package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"fmt"
	"log"
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
	log.Printf("[HorarioHandler] Listando horários...")

	rows, err := database.DB.Query(`
		SELECT id, barbeiro_id, cliente_nome, telefone, servico_id, data_hora, status, criado_em
		FROM horarios
		ORDER BY data_hora ASC
	`)

	if err != nil {
		log.Printf("[HorarioHandler] Erro ao buscar horários: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar horários"})
		return
	}
	defer rows.Close()

	horarios := []models.Horario{}
	for rows.Next() {
		var h models.Horario
		err := rows.Scan(&h.ID, &h.BarbeiroID, &h.ClienteNome, &h.Telefone, &h.ServicoID, &h.DataHora, &h.Status, &h.CreatedAt)
		if err != nil {
			log.Printf("[HorarioHandler] Erro ao fazer scan de horário: %v", err)
			continue
		}
		horarios = append(horarios, h)
	}

	log.Printf("[HorarioHandler] ✓ Retornando %d horários", len(horarios))
	c.JSON(http.StatusOK, horarios)
}

// Create a new schedule
func (h *HorarioHandler) Create(c *gin.Context) {
	log.Printf("[HorarioHandler] Criando novo horário...")

	var input models.HorarioInput

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[HorarioHandler] Erro no bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[HorarioHandler] Dados recebidos: Cliente=%s, Barbeiro=%d, Serviço=%d, Data=%s",
		input.ClienteNome, input.BarbeiroID, input.ServicoID, input.DataHora)

	// Set default status if not provided
	if input.Status == "" {
		input.Status = "pendente"
	}

	// Save to database
	result, err := database.DB.Exec(`
		INSERT INTO horarios (barbeiro_id, cliente_nome, telefone, email, servico_id, data_hora, status)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, input.BarbeiroID, input.ClienteNome, input.Telefone, input.Email, input.ServicoID, input.DataHora, input.Status)

	if err != nil {
		log.Printf("[HorarioHandler] Erro ao inserir no banco: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar agendamento"})
		return
	}

	// Get the created horario ID
	horarioID, err := result.LastInsertId()
	if err != nil {
		log.Printf("[HorarioHandler] Erro ao obter ID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao obter ID do agendamento"})
		return
	}

	log.Printf("[HorarioHandler] ✓ Horário criado com ID: %d", horarioID)

	// Notify admin about new booking
	notificationHandler := NewNotificationHandler()
	if err := notificationHandler.NotifyAdmin(int(horarioID), input.ClienteNome); err != nil {
		log.Printf("[HorarioHandler] Aviso: Falha ao enviar notificação: %v", err)
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
	log.Printf("[UpdateStatus] Recebido ID: %s", id)

	var input struct {
		Status string `json:"status" binding:"required,oneof=pendente confirmado cancelado concluido"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[UpdateStatus] Erro no bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[UpdateStatus] Status recebido: %s", input.Status)

	// Primeiro verificar se o horário existe
	var clienteNome, telefone string
	err := database.DB.QueryRow(`
		SELECT cliente_nome, telefone
		FROM horarios
		WHERE id = ?
	`, id).Scan(&clienteNome, &telefone)

	if err != nil {
		log.Printf("[UpdateStatus] Erro ao buscar horário ID %s: %v", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Agendamento não encontrado"})
		return
	}

	log.Printf("[UpdateStatus] Horário encontrado. Cliente: %s, Telefone: %s", clienteNome, telefone)

	// Update status in database
	result, err := database.DB.Exec(`
		UPDATE horarios
		SET status = ?
		WHERE id = ?
	`, input.Status, id)

	if err != nil {
		log.Printf("[UpdateStatus] Erro ao atualizar status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar status"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("[UpdateStatus] Status atualizado. Linhas afetadas: %d", rowsAffected)

	// Buscar usuário pelo telefone para enviar notificação
	var usuarioID int
	err = database.DB.QueryRow(`
		SELECT id FROM usuarios WHERE telefone = ?
	`, telefone).Scan(&usuarioID)

	// Send notification to client if user exists
	if err == nil && usuarioID > 0 {
		log.Printf("[UpdateStatus] Enviando notificação para usuário ID: %d", usuarioID)
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
	} else {
		log.Printf("[UpdateStatus] Usuário não encontrado para telefone: %s", telefone)
	}

	log.Printf("[UpdateStatus] ✓ Status atualizado com sucesso para: %s", input.Status)

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

// GetFidelidade retorna informações de fidelidade do cliente com um barbeiro específico
func (h *HorarioHandler) GetFidelidade(c *gin.Context) {
	clienteNome := c.Query("cliente_nome")
	clienteTelefone := c.Query("telefone")
	barbeiroID := c.Query("barbeiro_id")

	if clienteNome == "" && clienteTelefone == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "É necessário fornecer cliente_nome ou telefone",
		})
		return
	}

	if barbeiroID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "É necessário fornecer barbeiro_id",
		})
		return
	}

	log.Printf("[GetFidelidade] Consultando fidelidade - Cliente: %s, Telefone: %s, Barbeiro: %s",
		clienteNome, clienteTelefone, barbeiroID)

	// Query otimizada com COUNT(*) em vez de buscar todos os registros
	var totalCortes int
	var query string
	var args []interface{}

	// Se tem nome E telefone, usa ambos (OR)
	if clienteNome != "" && clienteTelefone != "" {
		query = `
			SELECT COUNT(*)
			FROM horarios
			WHERE (LOWER(cliente_nome) = LOWER(?) OR telefone = ?)
			AND barbeiro_id = ?
			AND status = 'concluido'
		`
		args = []interface{}{clienteNome, clienteTelefone, barbeiroID}
	} else if clienteNome != "" {
		// Apenas nome
		query = `
			SELECT COUNT(*)
			FROM horarios
			WHERE LOWER(cliente_nome) = LOWER(?)
			AND barbeiro_id = ?
			AND status = 'concluido'
		`
		args = []interface{}{clienteNome, barbeiroID}
	} else {
		// Apenas telefone
		query = `
			SELECT COUNT(*)
			FROM horarios
			WHERE telefone = ?
			AND barbeiro_id = ?
			AND status = 'concluido'
		`
		args = []interface{}{clienteTelefone, barbeiroID}
	}

	err := database.DB.QueryRow(query, args...).Scan(&totalCortes)
	if err != nil {
		log.Printf("[GetFidelidade] Erro ao consultar: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro ao consultar fidelidade",
		})
		return
	}

	// Calcular se tem direito a corte grátis (múltiplo de 10)
	temDireito := totalCortes > 0 && totalCortes%10 == 0
	proximoGratis := 10 - (totalCortes % 10)

	// Se já tem direito, próximo é 10 (não 0)
	if temDireito {
		proximoGratis = 10
	}

	log.Printf("[GetFidelidade] ✓ Total cortes: %d | Tem direito: %v | Faltam: %d",
		totalCortes, temDireito, proximoGratis)

	c.JSON(http.StatusOK, gin.H{
		"temDireito":    temDireito,
		"total":         totalCortes,
		"proximoGratis": proximoGratis,
		"barbeiro_id":   barbeiroID,
	})
}

// GetProximos retorna agendamentos dos próximos X minutos
// Útil para exibir clientes agendados no PDV
func (h *HorarioHandler) GetProximos(c *gin.Context) {
	// Minutos para buscar (padrão: 75 = -15min até +60min)
	minutos := c.DefaultQuery("minutos", "75")
	status := c.DefaultQuery("status", "confirmado")
	barbeiroID := c.Query("barbeiro_id")

	log.Printf("[GetProximos] Buscando agendamentos próximos: %s minutos, status=%s, barbeiro=%s",
		minutos, status, barbeiroID)

	// Calcular intervalo de tempo
	// De 15 minutos atrás até X minutos à frente
	agora := time.Now()
	inicio := agora.Add(-15 * time.Minute)
	fim := agora.Add(75 * time.Minute) // 75min = próxima 1h15min

	log.Printf("[GetProximos] Intervalo: %s até %s", inicio.Format("15:04"), fim.Format("15:04"))

	// Query SQL otimizada
	var query string
	var args []interface{}

	if barbeiroID != "" {
		query = `
			SELECT id, barbeiro_id, cliente_nome, telefone, servico_id, data_hora, status, criado_em
			FROM horarios
			WHERE status = ?
			AND barbeiro_id = ?
			AND data_hora BETWEEN ? AND ?
			ORDER BY data_hora ASC
		`
		args = []interface{}{status, barbeiroID, inicio.Format("2006-01-02T15:04:05Z07:00"), fim.Format("2006-01-02T15:04:05Z07:00")}
	} else {
		query = `
			SELECT id, barbeiro_id, cliente_nome, telefone, servico_id, data_hora, status, criado_em
			FROM horarios
			WHERE status = ?
			AND data_hora BETWEEN ? AND ?
			ORDER BY data_hora ASC
		`
		args = []interface{}{status, inicio.Format("2006-01-02T15:04:05Z07:00"), fim.Format("2006-01-02T15:04:05Z07:00")}
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Printf("[GetProximos] Erro ao buscar: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar agendamentos próximos"})
		return
	}
	defer rows.Close()

	horarios := []models.Horario{}
	for rows.Next() {
		var h models.Horario
		err := rows.Scan(&h.ID, &h.BarbeiroID, &h.ClienteNome, &h.Telefone, &h.ServicoID, &h.DataHora, &h.Status, &h.CreatedAt)
		if err != nil {
			log.Printf("[GetProximos] Erro ao fazer scan: %v", err)
			continue
		}
		horarios = append(horarios, h)
	}

	log.Printf("[GetProximos] ✓ Encontrados %d agendamentos próximos", len(horarios))

	c.JSON(http.StatusOK, gin.H{
		"agendamentos": horarios,
		"total":        len(horarios),
		"intervalo": gin.H{
			"inicio": inicio.Format("15:04"),
			"fim":    fim.Format("15:04"),
		},
	})
}
