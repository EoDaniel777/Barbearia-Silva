package models

import (
	"time"
)

// User representa um usuário do sistema
type User struct {
	ID        int       `json:"id" db:"id"`
	Nome      string    `json:"nome" db:"nome"`
	Email     string    `json:"email" db:"email"`
	Senha     string    `json:"-" db:"senha"` // Não expor senha no JSON
	Telefone  string    `json:"telefone" db:"telefone"`
	Tipo      string    `json:"tipo" db:"tipo"` // "cliente" ou "admin"
	CriadoEm  time.Time `json:"criadoEm" db:"criado_em"`
	AtualizadoEm time.Time `json:"atualizadoEm" db:"atualizado_em"`
}

// LoginRequest representa os dados de login
type LoginRequest struct {
	Email string `json:"email" binding:"required"`
	Senha string `json:"senha" binding:"required"`
}

// LoginResponse representa a resposta do login
type LoginResponse struct {
	User  User   `json:"user"`
	Token string `json:"token,omitempty"`
}
