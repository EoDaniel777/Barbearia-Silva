package handlers

import (
	"backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BarbeiroHandler struct {
	// TODO: Add service layer
}

func NewBarbeiroHandler() *BarbeiroHandler {
	return &BarbeiroHandler{}
}

// List godoc
// @Summary List all barbers
// @Description Get all active barbers
// @Tags barbeiros
// @Produce json
// @Success 200 {array} models.Barbeiro
// @Router /api/v1/barbeiros [get]
func (h *BarbeiroHandler) List(c *gin.Context) {
	// TODO: Implement database query
	barbeiros := []models.Barbeiro{
		{
			ID:    1,
			Nome:  "Alison Silva",
			Email: "alison@barbearia.com",
			Sexo:  "Masculino",
			Ativo: true,
		},
	}

	c.JSON(http.StatusOK, barbeiros)
}

// Get godoc
// @Summary Get a barber by ID
// @Description Get barber details by ID
// @Tags barbeiros
// @Produce json
// @Param id path int true "Barber ID"
// @Success 200 {object} models.Barbeiro
// @Router /api/v1/barbeiros/:id [get]
func (h *BarbeiroHandler) Get(c *gin.Context) {
	id := c.Param("id")

	// TODO: Implement database query
	barbeiro := models.Barbeiro{
		ID:    1,
		Nome:  "Alison Silva",
		Email: "alison@barbearia.com",
		Sexo:  "Masculino",
		Ativo: true,
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      id,
		"barbeiro": barbeiro,
	})
}

// Create godoc
// @Summary Create a new barber
// @Description Create a new barber with the provided data
// @Tags barbeiros
// @Accept json
// @Produce json
// @Param barbeiro body models.BarbeiroInput true "Barber data"
// @Success 201 {object} models.Barbeiro
// @Router /api/v1/barbeiros [post]
func (h *BarbeiroHandler) Create(c *gin.Context) {
	var input models.BarbeiroInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Save to database
	c.JSON(http.StatusCreated, gin.H{
		"message": "Barbeiro criado com sucesso",
		"data":    input,
	})
}

// Update godoc
// @Summary Update a barber
// @Description Update barber details
// @Tags barbeiros
// @Accept json
// @Produce json
// @Param id path int true "Barber ID"
// @Param barbeiro body models.BarbeiroInput true "Barber data"
// @Success 200 {object} models.Barbeiro
// @Router /api/v1/barbeiros/:id [put]
func (h *BarbeiroHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input models.BarbeiroInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Update in database
	c.JSON(http.StatusOK, gin.H{
		"message": "Barbeiro atualizado com sucesso",
		"id":      id,
		"data":    input,
	})
}

// Delete godoc
// @Summary Delete a barber
// @Description Delete a barber by ID
// @Tags barbeiros
// @Produce json
// @Param id path int true "Barber ID"
// @Success 200 {object} map[string]string
// @Router /api/v1/barbeiros/:id [delete]
func (h *BarbeiroHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// TODO: Delete from database
	c.JSON(http.StatusOK, gin.H{
		"message": "Barbeiro removido com sucesso",
		"id":      id,
	})
}
