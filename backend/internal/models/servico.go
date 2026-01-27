package models

import "time"

// Servico representa um serviço oferecido pela barbearia
type Servico struct {
	ID        uint      `json:"id"`
	Nome      string    `json:"nome" binding:"required"`
	Tipo      string    `json:"tipo"` // "servico" ou "produto"
	Descricao string    `json:"descricao"`
	Preco     float64   `json:"preco" binding:"required,min=0"`
	Duracao   int       `json:"duracao"` // em minutos
	Foto      string    `json:"foto"`    // URL ou base64 da foto
	Ativo     bool      `json:"ativo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ServicoInput é usado para criar/atualizar serviços
type ServicoInput struct {
	Nome      string  `json:"nome" binding:"required"`
	Tipo      string  `json:"tipo" binding:"required,oneof=servico produto"`
	Descricao string  `json:"descricao"`
	Preco     float64 `json:"preco" binding:"required,min=0"`
	Duracao   int     `json:"duracao" binding:"min=0"` // Opcional - produtos podem ter duração 0
	Foto      string  `json:"foto"` // Base64 da foto (opcional)
}
