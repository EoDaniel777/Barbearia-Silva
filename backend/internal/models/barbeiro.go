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

// HorarioTrabalho representa os horários de trabalho de um barbeiro
type HorarioTrabalho struct {
	ID          uint      `json:"id"`
	BarbeiroID  uint      `json:"barbeiro_id"`
	DiaSemana   int       `json:"dia_semana"` // 0 = Segunda, 1 = Terça, ..., 6 = Domingo
	HoraInicio  string    `json:"hora_inicio"` // formato HH:MM
	HoraFim     string    `json:"hora_fim"`    // formato HH:MM
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// HorarioTrabalhoInput é usado para criar/atualizar horários de trabalho
type HorarioTrabalhoInput struct {
	BarbeiroID int    `json:"barbeiro_id"`
	DiaSemana  int    `json:"dia_semana" binding:"required,min=0,max=6"`
	HoraInicio string `json:"hora_inicio" binding:"required"`
	HoraFim    string `json:"hora_fim" binding:"required"`
}
