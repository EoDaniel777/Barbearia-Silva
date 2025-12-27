package handlers

import (
	"backend/internal/database"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct{}

type Notification struct {
	ID         int    `json:"id"`
	UsuarioID  int    `json:"usuarioId"`
	Tipo       string `json:"tipo"`
	Titulo     string `json:"titulo"`
	Mensagem   string `json:"mensagem"`
	Lida       bool   `json:"lida"`
	HorarioID  *int   `json:"horarioId,omitempty"`
	CriadoEm   string `json:"criadoEm"`
}

func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{}
}

// GetNotifications retorna notificações do usuário
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	usuarioID := c.Query("usuario_id")
	if usuarioID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "usuario_id é obrigatório"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT id, usuario_id, tipo, COALESCE(titulo, '') as titulo, mensagem, lida, horario_id, criado_em
		FROM notificacoes
		WHERE usuario_id = ?
		ORDER BY criado_em DESC
		LIMIT 50
	`, usuarioID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar notificações"})
		return
	}
	defer rows.Close()

	notifications := []Notification{}
	for rows.Next() {
		var n Notification
		var lida int
		var horarioID *int
		err := rows.Scan(&n.ID, &n.UsuarioID, &n.Tipo, &n.Titulo, &n.Mensagem, &lida, &horarioID, &n.CriadoEm)
		if err != nil {
			continue
		}
		n.Lida = lida == 1
		n.HorarioID = horarioID
		notifications = append(notifications, n)
	}

	c.JSON(http.StatusOK, notifications)
}

// MarkAsRead marca uma notificação como lida
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	_, err = database.DB.Exec(`
		UPDATE notificacoes
		SET lida = 1
		WHERE id = ?
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao marcar notificação"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notificação marcada como lida"})
}

// CreateNotification cria uma nova notificação
func (h *NotificationHandler) CreateNotification(usuarioID int, tipo, titulo, mensagem string, horarioID *int) error {
	_, err := database.DB.Exec(`
		INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, horario_id)
		VALUES (?, ?, ?, ?, ?)
	`, usuarioID, tipo, titulo, mensagem, horarioID)

	return err
}

// NotifyAdmin notifica o admin sobre um novo agendamento
func (h *NotificationHandler) NotifyAdmin(horarioID int, clienteNome string) error {
	// Buscar ID do admin
	var adminID int
	err := database.DB.QueryRow(`
		SELECT id FROM usuarios WHERE tipo = 'admin' LIMIT 1
	`).Scan(&adminID)

	if err != nil {
		return err
	}

	titulo := "Novo Agendamento"
	mensagem := "Novo agendamento de " + clienteNome
	return h.CreateNotification(adminID, "agendamento", titulo, mensagem, &horarioID)
}

// NotifyClient notifica o cliente sobre status do agendamento
func (h *NotificationHandler) NotifyClient(clienteID int, tipo, titulo, mensagem string, horarioID *int) error {
	return h.CreateNotification(clienteID, tipo, titulo, mensagem, horarioID)
}
