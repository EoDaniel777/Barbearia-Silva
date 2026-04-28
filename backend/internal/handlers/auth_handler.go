package handlers

import (
	"backend/internal/database"
	"backend/internal/middleware"
	"backend/internal/models"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// Login autentica um usuário
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Buscar usuário por email
	var user models.User
	var foto *string
	err := database.DB.QueryRow(`
		SELECT id, nome, email, senha, telefone, tipo, criado_em, atualizado_em, foto
		FROM usuarios
		WHERE email = ?
	`, req.Email).Scan(&user.ID, &user.Nome, &user.Email, &user.Senha, &user.Telefone, &user.Tipo, &user.CriadoEm, &user.AtualizadoEm, &foto)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email ou senha incorretos"})
		return
	}

	// Verificar senha com bcrypt
	err = bcrypt.CompareHashAndPassword([]byte(user.Senha), []byte(req.Senha))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email ou senha incorretos"})
		return
	}

	// Limpar senha antes de retornar
	user.Senha = ""

	// Atribuir foto se existir
	if foto != nil {
		user.Foto = *foto
	}

	// Gerar token JWT com validade de 7 dias
	token, err := generateJWT(user.ID, user.Email, user.Tipo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token de autenticação"})
		return
	}

	// Criar resposta
	response := models.LoginResponse{
		User:  user,
		Token: token,
	}

	c.JSON(http.StatusOK, response)
}

// Register registra um novo usuário
func (h *AuthHandler) Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Definir tipo padrão como cliente
	if user.Tipo == "" {
		user.Tipo = "cliente"
	}

	// Hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Senha), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar senha"})
		return
	}

	// Inserir usuário com senha hasheada
	result, err := database.DB.Exec(`
		INSERT INTO usuarios (nome, email, senha, telefone, tipo)
		VALUES (?, ?, ?, ?, ?)
	`, user.Nome, user.Email, string(hashedPassword), user.Telefone, user.Tipo)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar usuário"})
		return
	}

	id, _ := result.LastInsertId()
	user.ID = int(id)
	user.Senha = ""

	c.JSON(http.StatusCreated, user)
}

// Me retorna informações do usuário atual
func (h *AuthHandler) Me(c *gin.Context) {
	// Obter dados do contexto (validado pelo middleware AuthRequired)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	var user models.User
	var foto *string
	err := database.DB.QueryRow(`
		SELECT id, nome, email, telefone, tipo, criado_em, atualizado_em, foto
		FROM usuarios
		WHERE id = ?
	`, userID).Scan(&user.ID, &user.Nome, &user.Email, &user.Telefone, &user.Tipo, &user.CriadoEm, &user.AtualizadoEm, &foto)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não encontrado"})
		return
	}

	if foto != nil {
		user.Foto = *foto
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile atualiza o perfil do usuário
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.Param("id")
	log.Printf("[UpdateProfile] Atualizando perfil do usuário ID: %s", userID)

	var input struct {
		Nome        string  `json:"nome"`
		Email       string  `json:"email"`
		Telefone    string  `json:"telefone"`
		Foto        *string `json:"foto"`
		SenhaAtual  string  `json:"senhaAtual"`
		SenhaNova   string  `json:"senhaNova"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[UpdateProfile] Erro no bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	fotoLen := 0
	if input.Foto != nil {
		fotoLen = len(*input.Foto)
	}
	log.Printf("[UpdateProfile] Dados recebidos: Nome=%s, Email=%s, Foto=%d chars, Mudar senha=%v",
		input.Nome, input.Email, fotoLen, input.SenhaAtual != "")

	// Se estiver mudando senha, validar senha atual
	if input.SenhaAtual != "" && input.SenhaNova != "" {
		log.Printf("[UpdateProfile] Validando mudança de senha...")
		var senhaHash string
		err := database.DB.QueryRow("SELECT senha FROM usuarios WHERE id = ?", userID).Scan(&senhaHash)
		if err != nil {
			log.Printf("[UpdateProfile] Usuário não encontrado: %v", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}

		// Verificar senha atual
		err = bcrypt.CompareHashAndPassword([]byte(senhaHash), []byte(input.SenhaAtual))
		if err != nil {
			log.Printf("[UpdateProfile] Senha atual incorreta")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Senha atual incorreta"})
			return
		}

		// Hash da nova senha
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.SenhaNova), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("[UpdateProfile] Erro ao gerar hash: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar nova senha"})
			return
		}

		// Atualizar com nova senha
		result, err := database.DB.Exec(`
			UPDATE usuarios
			SET nome = ?, email = ?, telefone = ?, foto = ?, senha = ?, atualizado_em = CURRENT_TIMESTAMP
			WHERE id = ?
		`, input.Nome, input.Email, input.Telefone, input.Foto, string(hashedPassword), userID)

		if err != nil {
			log.Printf("[UpdateProfile] Erro ao atualizar: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar usuário"})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		log.Printf("[UpdateProfile] Usuário atualizado com nova senha. Linhas afetadas: %d", rowsAffected)
	} else {
		log.Printf("[UpdateProfile] Atualizando sem mudar senha...")
		// Atualizar sem mudar senha
		result, err := database.DB.Exec(`
			UPDATE usuarios
			SET nome = ?, email = ?, telefone = ?, foto = ?, atualizado_em = CURRENT_TIMESTAMP
			WHERE id = ?
		`, input.Nome, input.Email, input.Telefone, input.Foto, userID)

		if err != nil {
			log.Printf("[UpdateProfile] Erro ao atualizar: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar usuário"})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		log.Printf("[UpdateProfile] Usuário atualizado. Linhas afetadas: %d", rowsAffected)
	}

	// Buscar usuário atualizado
	var user models.User
	var foto *string
	err := database.DB.QueryRow(`
		SELECT id, nome, email, telefone, tipo, criado_em, atualizado_em, foto
		FROM usuarios
		WHERE id = ?
	`, userID).Scan(&user.ID, &user.Nome, &user.Email, &user.Telefone, &user.Tipo, &user.CriadoEm, &user.AtualizadoEm, &foto)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário atualizado"})
		return
	}

	if foto != nil {
		user.Foto = *foto
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Perfil atualizado com sucesso",
		"user":    user,
	})
}

// ListUsers lista todos os usuários
func (h *AuthHandler) ListUsers(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, nome, email, telefone, tipo, foto
		FROM usuarios
		ORDER BY nome ASC
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuários"})
		return
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var user models.User
		var foto *string
		err := rows.Scan(&user.ID, &user.Nome, &user.Email, &user.Telefone, &user.Tipo, &foto)
		if err != nil {
			continue
		}

		if foto != nil {
			user.Foto = *foto
		}

		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

// GetUsuariosAgendados retorna usuários organizados por prioridade:
// 1. Usuários com agendamento próximo (em atendimento)
// 2. Todos os outros usuários
func (h *AuthHandler) GetUsuariosAgendados(c *gin.Context) {
	barbeiroID := c.Query("barbeiro_id")

	log.Printf("[GetUsuariosAgendados] Buscando usuários, barbeiro_id=%s", barbeiroID)

	// 1. Buscar agendamentos próximos (próxima 1 hora)
	agora := time.Now()
	inicio := agora.Add(-15 * time.Minute)
	fim := agora.Add(75 * time.Minute)

	var horariosQuery string
	var horariosArgs []interface{}

	if barbeiroID != "" {
		horariosQuery = `
			SELECT h.id, h.cliente_nome, h.telefone, h.data_hora, h.servico_id,
				   u.id as usuario_id, u.nome as usuario_nome, u.email
			FROM horarios h
			LEFT JOIN usuarios u ON u.telefone = h.telefone
			WHERE h.status = 'confirmado'
			AND h.barbeiro_id = ?
			AND h.data_hora BETWEEN ? AND ?
			ORDER BY h.data_hora ASC
		`
		horariosArgs = []interface{}{
			barbeiroID,
			inicio.Format("2006-01-02T15:04:05Z07:00"),
			fim.Format("2006-01-02T15:04:05Z07:00"),
		}
	} else {
		horariosQuery = `
			SELECT h.id, h.cliente_nome, h.telefone, h.data_hora, h.servico_id,
				   u.id as usuario_id, u.nome as usuario_nome, u.email
			FROM horarios h
			LEFT JOIN usuarios u ON u.telefone = h.telefone
			WHERE h.status = 'confirmado'
			AND h.data_hora BETWEEN ? AND ?
			ORDER BY h.data_hora ASC
		`
		horariosArgs = []interface{}{
			inicio.Format("2006-01-02T15:04:05Z07:00"),
			fim.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	rows, err := database.DB.Query(horariosQuery, horariosArgs...)
	if err != nil {
		log.Printf("[GetUsuariosAgendados] Erro ao buscar agendamentos: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar agendamentos"})
		return
	}
	defer rows.Close()

	type UsuarioAgendado struct {
		AgendamentoID int     `json:"agendamento_id"`
		UsuarioID     *int    `json:"usuario_id"`
		Nome          string  `json:"nome"`
		Email         *string `json:"email"`
		Telefone      string  `json:"telefone"`
		HoraAgendada  string  `json:"hora_agendada"`
		ServicoID     int     `json:"servico_id"`
	}

	usuariosAgendados := []UsuarioAgendado{}
	idsAgendados := make(map[int]bool)

	for rows.Next() {
		var agendamentoID, servicoID int
		var usuarioID *int
		var clienteNome, telefone, dataHora string
		var usuarioNome, email *string

		err := rows.Scan(&agendamentoID, &clienteNome, &telefone, &dataHora, &servicoID,
			&usuarioID, &usuarioNome, &email)
		if err != nil {
			log.Printf("[GetUsuariosAgendados] Erro no scan: %v", err)
			continue
		}

		// Parse hora para exibição
		horaAgendada := dataHora[11:16] // Extrai HH:MM

		nome := clienteNome
		if usuarioNome != nil {
			nome = *usuarioNome
		}

		usuariosAgendados = append(usuariosAgendados, UsuarioAgendado{
			AgendamentoID: agendamentoID,
			UsuarioID:     usuarioID,
			Nome:          nome,
			Email:         email,
			Telefone:      telefone,
			HoraAgendada:  horaAgendada,
			ServicoID:     servicoID,
		})

		if usuarioID != nil {
			idsAgendados[*usuarioID] = true
		}
	}

	// 2. Buscar todos os outros usuários (que não estão agendados)
	rowsUsuarios, err := database.DB.Query(`
		SELECT id, nome, email, telefone, tipo, foto
		FROM usuarios
		ORDER BY nome ASC
	`)
	if err != nil {
		log.Printf("[GetUsuariosAgendados] Erro ao buscar usuários: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuários"})
		return
	}
	defer rowsUsuarios.Close()

	type Usuario struct {
		ID       int     `json:"id"`
		Nome     string  `json:"nome"`
		Email    string  `json:"email"`
		Telefone string  `json:"telefone"`
		Tipo     string  `json:"tipo"`
		Foto     *string `json:"foto"`
	}

	todosUsuarios := []Usuario{}
	for rowsUsuarios.Next() {
		var u Usuario
		err := rowsUsuarios.Scan(&u.ID, &u.Nome, &u.Email, &u.Telefone, &u.Tipo, &u.Foto)
		if err != nil {
			continue
		}

		// Não incluir se já está na lista de agendados
		if !idsAgendados[u.ID] {
			todosUsuarios = append(todosUsuarios, u)
		}
	}

	log.Printf("[GetUsuariosAgendados] ✓ Agendados: %d | Outros: %d",
		len(usuariosAgendados), len(todosUsuarios))

	c.JSON(http.StatusOK, gin.H{
		"emAtendimento": usuariosAgendados,
		"outros":        todosUsuarios,
		"total":         len(usuariosAgendados) + len(todosUsuarios),
	})
}

// ValidateToken valida o token JWT e retorna informações do usuário
func (h *AuthHandler) ValidateToken(c *gin.Context) {
	// O middleware AuthRequired já validou o token
	// Apenas retornar os dados do contexto
	userID, _ := c.Get("user_id")
	userEmail, _ := c.Get("user_email")
	userTipo, _ := c.Get("user_tipo")

	c.JSON(http.StatusOK, gin.H{
		"valid":  true,
		"userId": userID,
		"email":  userEmail,
		"tipo":   userTipo,
	})
}

// generateJWT gera um token JWT para o usuário
func generateJWT(userID int, email string, tipo string) (string, error) {
	// Definir claims (dados do token)
	claims := middleware.Claims{
		UserID: userID,
		Email:  email,
		Tipo:   tipo,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 dias
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "goNext",
			Subject:   email,
		},
	}

	// Criar token com claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Assinar token com secret
	tokenString, err := token.SignedString(middleware.GetJWTSecret())
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
