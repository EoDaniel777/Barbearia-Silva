package models

import "time"

// Servico representa um serviço oferecido pela barbearia
type Servico struct {
	ID        uint      `json:"id"`
	Nome      string    `json:"nome" binding:"required"`
	Descricao string    `json:"descricao"`
	Preco     float64   `json:"preco" binding:"required,min=0"`
	Duracao   int       `json:"duracao"` // em minutos
	Ativo     bool      `json:"ativo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ServicoInput é usado para criar/atualizar serviços
type ServicoInput struct {
	Nome      string  `json:"nome" binding:"required"`
	Descricao string  `json:"descricao"`
	Preco     float64 `json:"preco" binding:"required,min=0"`
	Duracao   int     `json:"duracao" binding:"required,min=1"`
}
