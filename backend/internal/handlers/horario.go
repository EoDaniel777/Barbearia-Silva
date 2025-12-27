package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HorarioHandler struct{}

func NewHorarioHandler() *HorarioHandler {
	return &HorarioHandler{}
}

// List all schedules
func (h *HorarioHandler) List(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, barbeiro_id, cliente_nome, telefone, servico_id, data_hora, status, criado_em
		FROM horarios
		ORDER BY data_hora ASC
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar horários"})
		return
	}
	defer rows.Close()

	horarios := []models.Horario{}
	for rows.Next() {
		var h models.Horario
		err := rows.Scan(&h.ID, &h.BarbeiroID, &h.ClienteNome, &h.Telefone, &h.ServicoID, &h.DataHora, &h.Status, &h.CreatedAt)
		if err != nil {
			continue
		}
		horarios = append(horarios, h)
	}

	c.JSON(http.StatusOK, horarios)
}

// Create a new schedule
func (h *HorarioHandler) Create(c *gin.Context) {
	var input models.HorarioInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default status if not provided
	if input.Status == "" {
		input.Status = "pendente"
	}

	// Save to database
	result, err := database.DB.Exec(`
		INSERT INTO horarios (barbeiro_id, cliente_nome, telefone, servico_id, data_hora, status)
		VALUES (?, ?, ?, ?, ?, ?)
	`, input.BarbeiroID, input.ClienteNome, input.Telefone, input.ServicoID, input.DataHora, input.Status)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar agendamento"})
		return
	}

	// Get the created horario ID
	horarioID, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao obter ID do agendamento"})
		return
	}

	// Notify admin about new booking
	notificationHandler := NewNotificationHandler()
	if err := notificationHandler.NotifyAdmin(int(horarioID), input.ClienteNome); err != nil {
		// Log error but don't fail the request
		// The booking was created successfully even if notification fails
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Horário agendado com sucesso",
		"id":      horarioID,
		"data":    input,
	})
}

// Update schedule status
func (h *HorarioHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required,oneof=pendente confirmado cancelado concluido"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get horario info before updating to send notification
	var clienteNome string
	var usuarioID int
	err := database.DB.QueryRow(`
		SELECT h.cliente_nome, u.id
		FROM horarios h
		LEFT JOIN usuarios u ON u.telefone = h.telefone
		WHERE h.id = ?
	`, id).Scan(&clienteNome, &usuarioID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agendamento não encontrado"})
		return
	}

	// Update status in database
	_, err = database.DB.Exec(`
		UPDATE horarios
		SET status = ?
		WHERE id = ?
	`, input.Status, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar status"})
		return
	}

	// Send notification to client if user exists
	if usuarioID > 0 {
		notificationHandler := NewNotificationHandler()
		var titulo, mensagem, tipo string

		switch input.Status {
		case "confirmado":
			tipo = "confirmacao"
			titulo = "Agendamento Confirmado"
			mensagem = "Seu agendamento foi confirmado!"
		case "cancelado":
			tipo = "cancelamento"
			titulo = "Agendamento Cancelado"
			mensagem = "Seu agendamento foi cancelado."
		case "concluido":
			tipo = "sistema"
			titulo = "Serviço Concluído"
			mensagem = "Obrigado por escolher nossa barbearia!"
		}

		if tipo != "" {
			notificationHandler.NotifyClient(usuarioID, tipo, titulo, mensagem, nil)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status atualizado com sucesso",
		"id":      id,
		"status":  input.Status,
	})
}

// Delete a schedule
func (h *HorarioHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// TODO: Delete from database
	c.JSON(http.StatusOK, gin.H{
		"message": "Horário removido com sucesso",
		"id":      id,
	})
}
