package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BarbeiroHandler struct{}

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
	rows, err := database.DB.Query(`
		SELECT id, nome, email, telefone, sexo, foto, especialidade, descricao, ativo, criado_em, atualizado_em
		FROM barbeiros
		WHERE ativo = 1
		ORDER BY nome ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar barbeiros"})
		return
	}
	defer rows.Close()

	barbeiros := []models.Barbeiro{}
	for rows.Next() {
		var b models.Barbeiro
		var telefone, foto, especialidade, descricao *string

		err := rows.Scan(&b.ID, &b.Nome, &b.Email, &telefone, &b.Sexo, &foto,
			&especialidade, &descricao, &b.Ativo, &b.CreatedAt, &b.UpdatedAt)
		if err != nil {
			continue
		}

		// Handle nullable fields
		if telefone != nil {
			b.Telefone = *telefone
		}
		if foto != nil {
			b.Foto = *foto
		}
		if especialidade != nil {
			b.Especialidade = *especialidade
		}
		if descricao != nil {
			b.Descricao = *descricao
		}

		barbeiros = append(barbeiros, b)
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

	var b models.Barbeiro
	var telefone, foto, especialidade, descricao *string

	err := database.DB.QueryRow(`
		SELECT id, nome, email, telefone, sexo, foto, especialidade, descricao, ativo, criado_em, atualizado_em
		FROM barbeiros
		WHERE id = ?
	`, id).Scan(&b.ID, &b.Nome, &b.Email, &telefone, &b.Sexo, &foto,
		&especialidade, &descricao, &b.Ativo, &b.CreatedAt, &b.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barbeiro não encontrado"})
		return
	}

	// Handle nullable fields
	if telefone != nil {
		b.Telefone = *telefone
	}
	if foto != nil {
		b.Foto = *foto
	}
	if especialidade != nil {
		b.Especialidade = *especialidade
	}
	if descricao != nil {
		b.Descricao = *descricao
	}

	c.JSON(http.StatusOK, b)
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

	// Insert into database
	result, err := database.DB.Exec(`
		INSERT INTO barbeiros (nome, email, telefone, sexo, foto, especialidade, ativo)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, input.Nome, input.Email, input.Telefone, input.Sexo, input.Foto, input.Especialidade, 1)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar barbeiro"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{
		"message": "Barbeiro criado com sucesso",
		"id":      id,
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

	// Update in database
	_, err := database.DB.Exec(`
		UPDATE barbeiros
		SET nome = ?, email = ?, telefone = ?, sexo = ?, foto = ?, especialidade = ?, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = ?
	`, input.Nome, input.Email, input.Telefone, input.Sexo, input.Foto, input.Especialidade, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar barbeiro"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Barbeiro atualizado com sucesso",
		"id":      id,
		"data":    input,
	})
}

// Delete godoc
// @Summary Delete a barber
// @Description Delete a barber by ID (soft delete)
// @Tags barbeiros
// @Produce json
// @Param id path int true "Barber ID"
// @Success 200 {object} map[string]string
// @Router /api/v1/barbeiros/:id [delete]
func (h *BarbeiroHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Soft delete - apenas marcar como inativo
	_, err := database.DB.Exec(`
		UPDATE barbeiros
		SET ativo = 0, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = ?
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover barbeiro"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Barbeiro removido com sucesso",
		"id":      id,
	})
}
