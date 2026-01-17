package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ServicoHandler struct{}

func NewServicoHandler() *ServicoHandler {
	return &ServicoHandler{}
}

// List all services
func (h *ServicoHandler) List(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, nome, tipo, descricao, preco, duracao, ativo, criado_em, atualizado_em
		FROM servicos
		WHERE ativo = 1
		ORDER BY nome ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}
	defer rows.Close()

	servicos := []models.Servico{}
	for rows.Next() {
		var s models.Servico
		var tipo, descricao *string

		err := rows.Scan(&s.ID, &s.Nome, &tipo, &descricao, &s.Preco, &s.Duracao, &s.Ativo, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			continue
		}

		// Handle nullable fields
		if tipo != nil {
			s.Tipo = *tipo
		} else {
			s.Tipo = "servico" // default
		}
		if descricao != nil {
			s.Descricao = *descricao
		}

		servicos = append(servicos, s)
	}

	c.JSON(http.StatusOK, servicos)
}

// Get a service by ID
func (h *ServicoHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var s models.Servico
	var descricao *string

	err := database.DB.QueryRow(`
		SELECT id, nome, descricao, preco, duracao, ativo, criado_em, atualizado_em
		FROM servicos
		WHERE id = ?
	`, id).Scan(&s.ID, &s.Nome, &descricao, &s.Preco, &s.Duracao, &s.Ativo, &s.CreatedAt, &s.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
		return
	}

	// Handle nullable fields
	if descricao != nil {
		s.Descricao = *descricao
	}

	c.JSON(http.StatusOK, s)
}

// Create a new service
func (h *ServicoHandler) Create(c *gin.Context) {
	var input models.ServicoInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Insert into database
	result, err := database.DB.Exec(`
		INSERT INTO servicos (nome, tipo, descricao, preco, duracao, ativo)
		VALUES (?, ?, ?, ?, ?, ?)
	`, input.Nome, input.Tipo, input.Descricao, input.Preco, input.Duracao, 1)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar serviço"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{
		"message": "Serviço criado com sucesso",
		"id":      id,
		"data":    input,
	})
}

// Update a service
func (h *ServicoHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input models.ServicoInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update in database
	_, err := database.DB.Exec(`
		UPDATE servicos
		SET nome = ?, tipo = ?, descricao = ?, preco = ?, duracao = ?, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = ?
	`, input.Nome, input.Tipo, input.Descricao, input.Preco, input.Duracao, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar serviço"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Serviço atualizado com sucesso",
		"id":      id,
		"data":    input,
	})
}

// Delete a service
func (h *ServicoHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Soft delete - apenas marcar como inativo
	_, err := database.DB.Exec(`
		UPDATE servicos
		SET ativo = 0, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = ?
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover serviço"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Serviço removido com sucesso",
		"id":      id,
	})
}
