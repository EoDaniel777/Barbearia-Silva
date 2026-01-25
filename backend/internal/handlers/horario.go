package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"fmt"
	"net/http"
	"time"

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

	// Soft delete - apenas cancelar
	_, err := database.DB.Exec(`
		UPDATE horarios
		SET status = 'cancelado'
		WHERE id = ?
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao cancelar horário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Horário cancelado com sucesso",
		"id":      id,
	})
}

// GetDisponibilidade retorna os horários disponíveis para agendamento
func (h *HorarioHandler) GetDisponibilidade(c *gin.Context) {
	barbeiroID := c.Query("barbeiro_id")
	servicoID := c.Query("servico_id")
	data := c.Query("data") // formato: YYYY-MM-DD

	if barbeiroID == "" || servicoID == "" || data == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetros barbeiro_id, servico_id e data são obrigatórios"})
		return
	}

	// Buscar duração do serviço
	var duracao int
	err := database.DB.QueryRow("SELECT duracao FROM servicos WHERE id = ?", servicoID).Scan(&duracao)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
		return
	}

	// Calcular dia da semana (0=domingo, 1=segunda, ..., 6=sábado)
	// Vou usar uma função helper para isso
	diaSemana := getDiaSemana(data)

	// Buscar horário de trabalho do barbeiro neste dia
	var horaInicio, horaFim string
	err = database.DB.QueryRow(`
		SELECT hora_inicio, hora_fim
		FROM horarios_trabalho
		WHERE barbeiro_id = ? AND dia_semana = ? AND ativo = 1
	`, barbeiroID, diaSemana).Scan(&horaInicio, &horaFim)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "Barbeiro não trabalha neste dia",
			"slots":   []string{},
		})
		return
	}

	// Buscar agendamentos já existentes nesta data
	rows, err := database.DB.Query(`
		SELECT data_hora
		FROM horarios
		WHERE barbeiro_id = ? AND DATE(data_hora) = ? AND status IN ('pendente', 'confirmado')
	`, barbeiroID, data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar agendamentos"})
		return
	}
	defer rows.Close()

	ocupados := make(map[string]bool)
	for rows.Next() {
		var dataHora string
		rows.Scan(&dataHora)
		// Extrair apenas a hora (formato: 2026-01-10T14:30:00Z -> 14:30)
		hora := dataHora[11:16]
		ocupados[hora] = true
	}

	// Gerar slots disponíveis
	slots := gerarSlots(horaInicio, horaFim, duracao, ocupados)

	c.JSON(http.StatusOK, gin.H{
		"data":          data,
		"barbeiro_id":   barbeiroID,
		"servico_id":    servicoID,
		"duracao":       duracao,
		"hora_inicio":   horaInicio,
		"hora_fim":      horaFim,
		"slots_livres":  slots,
		"total_slots":   len(slots),
	})
}

// Helper: calcular dia da semana a partir de uma data
func getDiaSemana(data string) int {
	// Parse data no formato YYYY-MM-DD
	// Implementação simplificada usando time.Parse
	// Retorna 0=domingo, 1=segunda, ..., 6=sábado
	layout := "2006-01-02"
	t, err := time.Parse(layout, data)
	if err != nil {
		return -1
	}
	return int(t.Weekday())
}

// Helper: gerar slots de horário disponíveis
func gerarSlots(inicio, fim string, duracao int, ocupados map[string]bool) []string {
	slots := []string{}

	// Parse hora início e fim (formato HH:MM)
	horaInicio, minutoInicio := parseHora(inicio)
	horaFim, minutoFim := parseHora(fim)

	// Converter tudo para minutos
	minutoAtual := horaInicio*60 + minutoInicio
	minutoFinal := horaFim*60 + minutoFim

	// Gerar slots de acordo com a duração
	for minutoAtual+duracao <= minutoFinal {
		hora := minutoAtual / 60
		minuto := minutoAtual % 60
		horario := fmt.Sprintf("%02d:%02d", hora, minuto)

		// Verificar se não está ocupado
		if !ocupados[horario] {
			slots = append(slots, horario)
		}

		minutoAtual += duracao
	}

	return slots
}

// Helper: parse hora no formato HH:MM
func parseHora(horaStr string) (int, int) {
	var hora, minuto int
	fmt.Sscanf(horaStr, "%d:%d", &hora, &minuto)
	return hora, minuto
}
