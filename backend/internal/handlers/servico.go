package handlers

import (
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
	// TODO: Implement database query
	servicos := []models.Servico{
		{
			ID:        1,
			Nome:      "Corte",
			Descricao: "Seu corte em 30 minutos. Qualidade e agilidade que você precisa.",
			Preco:     35.00,
			Duracao:   30,
			Ativo:     true,
		},
		{
			ID:        2,
			Nome:      "Barba",
			Descricao: "Sua barba em 30 minutos. Qualidade e agilidade que você precisa.",
			Preco:     35.00,
			Duracao:   30,
			Ativo:     true,
		},
		{
			ID:        3,
			Nome:      "Kids",
			Descricao: "Seu corte kids em 30 minutos. Qualidade e agilidade que você precisa.",
			Preco:     35.00,
			Duracao:   30,
			Ativo:     true,
		},
	}

	c.JSON(http.StatusOK, servicos)
}

// Create a new service
func (h *ServicoHandler) Create(c *gin.Context) {
	var input models.ServicoInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Save to database
	c.JSON(http.StatusCreated, gin.H{
		"message": "Serviço criado com sucesso",
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

	// TODO: Update in database
	c.JSON(http.StatusOK, gin.H{
		"message": "Serviço atualizado com sucesso",
		"id":      id,
		"data":    input,
	})
}

// Delete a service
func (h *ServicoHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// TODO: Delete from database
	c.JSON(http.StatusOK, gin.H{
		"message": "Serviço removido com sucesso",
		"id":      id,
	})
}
