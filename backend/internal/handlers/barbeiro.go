package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"log"
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
	// Adicionar headers para prevenir cache do navegador
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

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
		INSERT INTO barbeiros (nome, email, telefone, sexo, foto, especialidade, descricao, ativo)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, input.Nome, input.Email, input.Telefone, input.Sexo, input.Foto, input.Especialidade, input.Descricao, 1)

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
	log.Printf("[BarbeiroHandler] Atualizando barbeiro ID: %s", id)

	var input models.BarbeiroInput

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[BarbeiroHandler] Erro no bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[BarbeiroHandler] Dados recebidos: Nome=%s, Email=%s, Foto=%d chars",
		input.Nome, input.Email, len(input.Foto))

	// Update in database
	result, err := database.DB.Exec(`
		UPDATE barbeiros
		SET nome = ?, email = ?, telefone = ?, sexo = ?, foto = ?, especialidade = ?, descricao = ?, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = ?
	`, input.Nome, input.Email, input.Telefone, input.Sexo, input.Foto, input.Especialidade, input.Descricao, id)

	if err != nil {
		log.Printf("[BarbeiroHandler] Erro ao atualizar: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar barbeiro"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("[BarbeiroHandler] ✓ Barbeiro atualizado. Linhas afetadas: %d", rowsAffected)

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

// GetHorarios godoc
// @Summary Get barber work hours
// @Description Get all work hours for a specific barber
// @Tags barbeiros
// @Produce json
// @Param id path int true "Barber ID"
// @Success 200 {array} models.HorarioTrabalho
// @Router /api/v1/barbeiros/:id/horarios [get]
func (h *BarbeiroHandler) GetHorarios(c *gin.Context) {
	barbeiroID := c.Param("id")

	rows, err := database.DB.Query(`
		SELECT id, barbeiro_id, dia_semana, hora_inicio, hora_fim, criado_em, atualizado_em
		FROM horarios_trabalho
		WHERE barbeiro_id = ?
		ORDER BY dia_semana ASC
	`, barbeiroID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar horários"})
		return
	}
	defer rows.Close()

	horarios := []models.HorarioTrabalho{}
	for rows.Next() {
		var h models.HorarioTrabalho
		err := rows.Scan(&h.ID, &h.BarbeiroID, &h.DiaSemana, &h.HoraInicio, &h.HoraFim,
			&h.CreatedAt, &h.UpdatedAt)
		if err != nil {
			continue
		}
		horarios = append(horarios, h)
	}

	c.JSON(http.StatusOK, horarios)
}

// SaveHorarios godoc
// @Summary Save barber work hours
// @Description Save or update work hours for a specific barber
// @Tags barbeiros
// @Accept json
// @Produce json
// @Param id path int true "Barber ID"
// @Param horarios body map[string]interface{} true "Work hours data"
// @Success 200 {object} map[string]string
// @Router /api/v1/barbeiros/:id/horarios [post]
func (h *BarbeiroHandler) SaveHorarios(c *gin.Context) {
	barbeiroID := c.Param("id")

	// Verificar se o barbeiro existe
	var existe int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM barbeiros WHERE id = ? AND ativo = 1", barbeiroID).Scan(&existe)
	if err != nil || existe == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Barbeiro não encontrado"})
		return
	}

	// Parse do JSON recebido
	var input struct {
		Horarios []models.HorarioTrabalhoInput `json:"horarios"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(input.Horarios) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum horário fornecido"})
		return
	}

	// Deletar horários existentes do barbeiro
	_, err = database.DB.Exec("DELETE FROM horarios_trabalho WHERE barbeiro_id = ?", barbeiroID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao limpar horários antigos"})
		return
	}

	// Inserir novos horários
	stmt, err := database.DB.Prepare(`
		INSERT INTO horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim)
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao preparar inserção"})
		return
	}
	defer stmt.Close()

	for _, h := range input.Horarios {
		// Validar dia da semana (0-6)
		if h.DiaSemana < 0 || h.DiaSemana > 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dia da semana inválido"})
			return
		}

		// Validar horários
		if h.HoraInicio == "" || h.HoraFim == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Horários não podem estar vazios"})
			return
		}

		if h.HoraInicio >= h.HoraFim {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Hora de início deve ser anterior à hora de fim"})
			return
		}

		_, err = stmt.Exec(barbeiroID, h.DiaSemana, h.HoraInicio, h.HoraFim)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar horários"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Horários salvos com sucesso",
		"barbeiro_id": barbeiroID,
		"total": len(input.Horarios),
	})
}
