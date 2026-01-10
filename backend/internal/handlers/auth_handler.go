package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
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
	err := database.DB.QueryRow(`
		SELECT id, nome, email, senha, telefone, tipo, criado_em, atualizado_em
		FROM usuarios
		WHERE email = ?
	`, req.Email).Scan(&user.ID, &user.Nome, &user.Email, &user.Senha, &user.Telefone, &user.Tipo, &user.CriadoEm, &user.AtualizadoEm)

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
	err := database.DB.QueryRow(`
		SELECT id, nome, email, telefone, tipo, criado_em, atualizado_em
		FROM usuarios
		WHERE email = ?
	`, email).Scan(&user.ID, &user.Nome, &user.Email, &user.Telefone, &user.Tipo, &user.CriadoEm, &user.AtualizadoEm)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	c.JSON(http.StatusOK, user)
}
