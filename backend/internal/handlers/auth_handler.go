package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
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

	// Criar resposta
	response := models.LoginResponse{
		User:  user,
		Token: "simple-token-" + user.Email, // Token simples para testes
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
	// Em uma implementação real, validar token e buscar usuário
	email := c.GetHeader("X-User-Email") // Simplificado para testes

	var user models.User
	var foto *string
	err := database.DB.QueryRow(`
		SELECT id, nome, email, telefone, tipo, criado_em, atualizado_em, foto
		FROM usuarios
		WHERE email = ?
	`, email).Scan(&user.ID, &user.Nome, &user.Email, &user.Telefone, &user.Tipo, &user.CriadoEm, &user.AtualizadoEm, &foto)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
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
