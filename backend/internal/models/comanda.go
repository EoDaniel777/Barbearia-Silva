package models

import "time"

// Comanda representa uma comanda de atendimento (PDV)
type Comanda struct {
	ID              uint      `json:"id" db:"id"`
	ClienteNome     string    `json:"clienteNome" db:"cliente_nome"`
	BarbeiroID      uint      `json:"barbeiroId" db:"barbeiro_id"`
	BarbeiroNome    string    `json:"barbeiroNome" db:"barbeiro_nome"` // Preenchido via JOIN
	DataAbertura    time.Time `json:"dataAbertura" db:"data_abertura"`
	DataFechamento  *time.Time `json:"dataFechamento,omitempty" db:"data_fechamento"`
	Status          string    `json:"status" db:"status"` // aberta, fechada, cancelada
	Total           float64   `json:"total" db:"total"`
	FormaPagamento  string    `json:"formaPagamento,omitempty" db:"forma_pagamento"` // dinheiro, pix, cartao
	ObservacoesPgto string    `json:"observacoesPgto,omitempty" db:"observacoes_pgto"`
	CreatedAt       time.Time `json:"criadoEm" db:"criado_em"`
}

// ItemComanda representa um item da comanda (serviço ou produto)
type ItemComanda struct {
	ID            uint      `json:"id" db:"id"`
	ComandaID     uint      `json:"comandaId" db:"comanda_id"`
	Tipo          string    `json:"tipo" db:"tipo"` // servico, produto
	ItemID        uint      `json:"itemId" db:"item_id"`
	Nome          string    `json:"nome" db:"nome"`
	Quantidade    int       `json:"quantidade" db:"quantidade"`
	PrecoUnitario float64   `json:"precoUnitario" db:"preco_unitario"`
	Subtotal      float64   `json:"subtotal" db:"subtotal"`
	CreatedAt     time.Time `json:"criadoEm" db:"criado_em"`
}

// ComandaCompleta representa uma comanda com seus itens
type ComandaCompleta struct {
	Comanda
	Itens []ItemComanda `json:"itens"`
}

// ComandaInput é usado para criar comandas
type ComandaInput struct {
	ClienteNome string `json:"clienteNome" binding:"required"`
	BarbeiroID  int    `json:"barbeiroId" binding:"required"`
}

// ItemComandaInput é usado para adicionar itens à comanda
type ItemComandaInput struct {
	Tipo       string  `json:"tipo" binding:"required,oneof=servico produto"`
	ItemID     int     `json:"itemId" binding:"required"`
	Nome       string  `json:"nome" binding:"required"`
	Quantidade int     `json:"quantidade" binding:"required,min=1"`
	PrecoUnitario float64 `json:"precoUnitario" binding:"required,min=0"`
}

// FecharComandaInput é usado para fechar uma comanda
type FecharComandaInput struct {
	FormaPagamento  string `json:"formaPagamento" binding:"required,oneof=dinheiro pix cartao"`
	ObservacoesPgto string `json:"observacoesPgto"`
}
