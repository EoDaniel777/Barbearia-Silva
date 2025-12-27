package models

import "time"

// Horario representa um horário de agendamento
type Horario struct {
	ID          uint      `json:"id" db:"id"`
	BarbeiroID  uint      `json:"barbeiroID" db:"barbeiro_id"`
	ClienteNome string    `json:"nomeCliente" db:"cliente_nome"`
	Telefone    string    `json:"telefone" db:"telefone"`
	ServicoID   uint      `json:"servicoID" db:"servico_id"`
	DataHora    string    `json:"dataHora" db:"data_hora"`
	Status      string    `json:"status" db:"status"` // pendente, confirmado, cancelado, concluido
	CreatedAt   time.Time `json:"criadoEm" db:"criado_em"`
}

// HorarioInput é usado para criar agendamentos
type HorarioInput struct {
	BarbeiroID  int    `json:"barbeiroID" binding:"required"`
	ClienteNome string `json:"nomeCliente" binding:"required"`
	Telefone    string `json:"telefone" binding:"required"`
	ServicoID   int    `json:"servicoID" binding:"required"`
	DataHora    string `json:"dataHora" binding:"required"`
	Status      string `json:"status"`
}
