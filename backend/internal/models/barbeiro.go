package models

import "time"

// Barbeiro representa um barbeiro/profissional da barbearia
type Barbeiro struct {
	ID            uint      `json:"id"`
	Nome          string    `json:"nome" binding:"required"`
	Email         string    `json:"email" binding:"required,email"`
	Telefone      string    `json:"telefone"`
	Sexo          string    `json:"sexo" binding:"required,oneof=Masculino Feminino"`
	Foto          string    `json:"foto"`
	Especialidade string    `json:"especialidade"`
	Descricao     string    `json:"descricao"`
	Ativo         bool      `json:"ativo"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// BarbeiroInput é usado para criar/atualizar barbeiros
type BarbeiroInput struct {
	Nome          string `json:"nome" binding:"required"`
	Email         string `json:"email" binding:"required,email"`
	Telefone      string `json:"telefone"`
	Sexo          string `json:"sexo" binding:"required,oneof=Masculino Feminino"`
	Foto          string `json:"foto"`
	Especialidade string `json:"especialidade"`
}
