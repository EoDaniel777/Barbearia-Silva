package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/barbearia/internal/database"
	"github.com/yourusername/barbearia/internal/models"
)

// ListarComandas retorna todas as comandas
func ListarComandas(c *gin.Context) {
	status := c.Query("status") // filtrar por status (aberta, fechada, cancelada)

	query := `
		SELECT
			c.id, c.cliente_nome, c.barbeiro_id,
			b.nome as barbeiro_nome,
			c.data_abertura, c.data_fechamento,
			c.status, c.total, c.forma_pagamento, c.observacoes_pgto, c.criado_em
		FROM comandas c
		LEFT JOIN barbeiros b ON c.barbeiro_id = b.id
	`

	args := []interface{}{}

	if status != "" {
		query += " WHERE c.status = ?"
		args = append(args, status)
	}

	query += " ORDER BY c.data_abertura DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Printf("Erro ao listar comandas: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar comandas"})
		return
	}
	defer rows.Close()

	comandas := []models.Comanda{}
	for rows.Next() {
		var cmd models.Comanda
		var dataFechamento sql.NullTime
		var formaPagamento, observacoesPgto sql.NullString

		err := rows.Scan(
			&cmd.ID, &cmd.ClienteNome, &cmd.BarbeiroID,
			&cmd.BarbeiroNome,
			&cmd.DataAbertura, &dataFechamento,
			&cmd.Status, &cmd.Total, &formaPagamento, &observacoesPgto, &cmd.CreatedAt,
		)
		if err != nil {
			log.Printf("Erro ao fazer scan da comanda: %v", err)
			continue
		}

		if dataFechamento.Valid {
			cmd.DataFechamento = &dataFechamento.Time
		}
		if formaPagamento.Valid {
			cmd.FormaPagamento = formaPagamento.String
		}
		if observacoesPgto.Valid {
			cmd.ObservacoesPgto = observacoesPgto.String
		}

		comandas = append(comandas, cmd)
	}

	c.JSON(http.StatusOK, comandas)
}

// ObterComanda retorna uma comanda específica com seus itens
func ObterComanda(c *gin.Context) {
	id := c.Param("id")

	// Buscar comanda
	var cmd models.Comanda
	var dataFechamento sql.NullTime
	var formaPagamento, observacoesPgto sql.NullString

	query := `
		SELECT
			c.id, c.cliente_nome, c.barbeiro_id,
			b.nome as barbeiro_nome,
			c.data_abertura, c.data_fechamento,
			c.status, c.total, c.forma_pagamento, c.observacoes_pgto, c.criado_em
		FROM comandas c
		LEFT JOIN barbeiros b ON c.barbeiro_id = b.id
		WHERE c.id = ?
	`

	err := database.DB.QueryRow(query, id).Scan(
		&cmd.ID, &cmd.ClienteNome, &cmd.BarbeiroID,
		&cmd.BarbeiroNome,
		&cmd.DataAbertura, &dataFechamento,
		&cmd.Status, &cmd.Total, &formaPagamento, &observacoesPgto, &cmd.CreatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comanda não encontrada"})
		return
	}
	if err != nil {
		log.Printf("Erro ao buscar comanda: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar comanda"})
		return
	}

	if dataFechamento.Valid {
		cmd.DataFechamento = &dataFechamento.Time
	}
	if formaPagamento.Valid {
		cmd.FormaPagamento = formaPagamento.String
	}
	if observacoesPgto.Valid {
		cmd.ObservacoesPgto = observacoesPgto.String
	}

	// Buscar itens da comanda
	itemsQuery := `
		SELECT id, comanda_id, tipo, item_id, nome, quantidade, preco_unitario, subtotal, criado_em
		FROM itens_comanda
		WHERE comanda_id = ?
		ORDER BY criado_em ASC
	`

	itemsRows, err := database.DB.Query(itemsQuery, id)
	if err != nil {
		log.Printf("Erro ao buscar itens da comanda: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar itens"})
		return
	}
	defer itemsRows.Close()

	itens := []models.ItemComanda{}
	for itemsRows.Next() {
		var item models.ItemComanda
		err := itemsRows.Scan(
			&item.ID, &item.ComandaID, &item.Tipo, &item.ItemID,
			&item.Nome, &item.Quantidade, &item.PrecoUnitario, &item.Subtotal, &item.CreatedAt,
		)
		if err != nil {
			log.Printf("Erro ao fazer scan do item: %v", err)
			continue
		}
		itens = append(itens, item)
	}

	// Retornar comanda completa
	comandaCompleta := models.ComandaCompleta{
		Comanda: cmd,
		Itens:   itens,
	}

	c.JSON(http.StatusOK, comandaCompleta)
}

// CriarComanda cria uma nova comanda
func CriarComanda(c *gin.Context) {
	var input models.ComandaInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se o barbeiro existe
	var barbeiroExists int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM barbeiros WHERE id = ? AND ativo = 1", input.BarbeiroID).Scan(&barbeiroExists)
	if err != nil || barbeiroExists == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Barbeiro não encontrado ou inativo"})
		return
	}

	// Inserir comanda
	result, err := database.DB.Exec(`
		INSERT INTO comandas (cliente_nome, barbeiro_id, status, total)
		VALUES (?, ?, 'aberta', 0.0)
	`, input.ClienteNome, input.BarbeiroID)

	if err != nil {
		log.Printf("Erro ao criar comanda: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar comanda"})
		return
	}

	id, _ := result.LastInsertId()

	c.JSON(http.StatusCreated, gin.H{
		"id":      id,
		"message": "Comanda criada com sucesso",
	})
}

// AdicionarItemComanda adiciona um item à comanda
func AdicionarItemComanda(c *gin.Context) {
	comandaID := c.Param("id")

	var input models.ItemComandaInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se a comanda existe e está aberta
	var status string
	err := database.DB.QueryRow("SELECT status FROM comandas WHERE id = ?", comandaID).Scan(&status)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comanda não encontrada"})
		return
	}
	if err != nil {
		log.Printf("Erro ao verificar comanda: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar comanda"})
		return
	}

	if status != "aberta" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comanda não está aberta"})
		return
	}

	// Calcular subtotal
	subtotal := input.PrecoUnitario * float64(input.Quantidade)

	// Inserir item
	_, err = database.DB.Exec(`
		INSERT INTO itens_comanda (comanda_id, tipo, item_id, nome, quantidade, preco_unitario, subtotal)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, comandaID, input.Tipo, input.ItemID, input.Nome, input.Quantidade, input.PrecoUnitario, subtotal)

	if err != nil {
		log.Printf("Erro ao adicionar item: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao adicionar item"})
		return
	}

	// Atualizar total da comanda
	_, err = database.DB.Exec(`
		UPDATE comandas
		SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM itens_comanda WHERE comanda_id = ?)
		WHERE id = ?
	`, comandaID, comandaID)

	if err != nil {
		log.Printf("Erro ao atualizar total: %v", err)
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Item adicionado com sucesso"})
}

// RemoverItemComanda remove um item da comanda
func RemoverItemComanda(c *gin.Context) {
	comandaID := c.Param("id")
	itemID := c.Param("item_id")

	// Verificar se a comanda está aberta
	var status string
	err := database.DB.QueryRow("SELECT status FROM comandas WHERE id = ?", comandaID).Scan(&status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comanda não encontrada"})
		return
	}

	if status != "aberta" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comanda não está aberta"})
		return
	}

	// Remover item
	result, err := database.DB.Exec("DELETE FROM itens_comanda WHERE id = ? AND comanda_id = ?", itemID, comandaID)
	if err != nil {
		log.Printf("Erro ao remover item: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover item"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
		return
	}

	// Atualizar total
	_, err = database.DB.Exec(`
		UPDATE comandas
		SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM itens_comanda WHERE comanda_id = ?)
		WHERE id = ?
	`, comandaID, comandaID)

	if err != nil {
		log.Printf("Erro ao atualizar total: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removido com sucesso"})
}

// FecharComanda fecha uma comanda (finaliza o atendimento e registra pagamento)
func FecharComanda(c *gin.Context) {
	comandaID := c.Param("id")

	var input models.FecharComandaInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se a comanda existe e está aberta
	var status string
	err := database.DB.QueryRow("SELECT status FROM comandas WHERE id = ?", comandaID).Scan(&status)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comanda não encontrada"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar comanda"})
		return
	}

	if status != "aberta" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comanda não está aberta"})
		return
	}

	// Fechar comanda
	now := time.Now()
	_, err = database.DB.Exec(`
		UPDATE comandas
		SET status = 'fechada',
		    data_fechamento = ?,
		    forma_pagamento = ?,
		    observacoes_pgto = ?
		WHERE id = ?
	`, now, input.FormaPagamento, input.ObservacoesPgto, comandaID)

	if err != nil {
		log.Printf("Erro ao fechar comanda: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao fechar comanda"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comanda fechada com sucesso"})
}

// CancelarComanda cancela uma comanda
func CancelarComanda(c *gin.Context) {
	comandaID := c.Param("id")

	// Verificar se a comanda existe e está aberta
	var status string
	err := database.DB.QueryRow("SELECT status FROM comandas WHERE id = ?", comandaID).Scan(&status)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comanda não encontrada"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar comanda"})
		return
	}

	if status != "aberta" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Somente comandas abertas podem ser canceladas"})
		return
	}

	// Cancelar comanda
	_, err = database.DB.Exec("UPDATE comandas SET status = 'cancelada' WHERE id = ?", comandaID)
	if err != nil {
		log.Printf("Erro ao cancelar comanda: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao cancelar comanda"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comanda cancelada com sucesso"})
}

// RelatorioComandasDia retorna estatísticas das comandas do dia
func RelatorioComandasDia(c *gin.Context) {
	// Data de hoje (inicio e fim)
	hoje := time.Now().Format("2006-01-02")
	inicioHoje := hoje + " 00:00:00"
	fimHoje := hoje + " 23:59:59"

	// Total de comandas abertas hoje
	var totalAbertas int
	database.DB.QueryRow(`
		SELECT COUNT(*) FROM comandas
		WHERE data_abertura BETWEEN ? AND ? AND status = 'aberta'
	`, inicioHoje, fimHoje).Scan(&totalAbertas)

	// Total de comandas fechadas hoje
	var totalFechadas int
	database.DB.QueryRow(`
		SELECT COUNT(*) FROM comandas
		WHERE data_abertura BETWEEN ? AND ? AND status = 'fechada'
	`, inicioHoje, fimHoje).Scan(&totalFechadas)

	// Receita total de hoje (comandas fechadas)
	var receitaTotal float64
	database.DB.QueryRow(`
		SELECT COALESCE(SUM(total), 0) FROM comandas
		WHERE data_abertura BETWEEN ? AND ? AND status = 'fechada'
	`, inicioHoje, fimHoje).Scan(&receitaTotal)

	// Itens mais vendidos hoje
	rows, err := database.DB.Query(`
		SELECT i.nome, SUM(i.quantidade) as quantidade
		FROM itens_comanda i
		JOIN comandas c ON i.comanda_id = c.id
		WHERE c.data_abertura BETWEEN ? AND ?
		GROUP BY i.nome
		ORDER BY quantidade DESC
		LIMIT 5
	`, inicioHoje, fimHoje)

	itensMaisVendidos := []map[string]interface{}{}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var nome string
			var quantidade int
			rows.Scan(&nome, &quantidade)
			itensMaisVendidos = append(itensMaisVendidos, map[string]interface{}{
				"nome":       nome,
				"quantidade": quantidade,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":              hoje,
		"comandasAbertas":   totalAbertas,
		"comandasFechadas":  totalFechadas,
		"receitaTotal":      receitaTotal,
		"itensMaisVendidos": itensMaisVendidos,
	})
}

// AtualizarQuantidadeItem atualiza a quantidade de um item da comanda
func AtualizarQuantidadeItem(c *gin.Context) {
	comandaID := c.Param("id")
	itemID := c.Param("item_id")

	var input struct {
		Quantidade int `json:"quantidade" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se a comanda está aberta
	var status string
	err := database.DB.QueryRow("SELECT status FROM comandas WHERE id = ?", comandaID).Scan(&status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comanda não encontrada"})
		return
	}

	if status != "aberta" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comanda não está aberta"})
		return
	}

	// Atualizar item (recalculando subtotal)
	_, err = database.DB.Exec(`
		UPDATE itens_comanda
		SET quantidade = ?, subtotal = preco_unitario * ?
		WHERE id = ? AND comanda_id = ?
	`, input.Quantidade, input.Quantidade, itemID, comandaID)

	if err != nil {
		log.Printf("Erro ao atualizar item: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar item"})
		return
	}

	// Atualizar total da comanda
	_, err = database.DB.Exec(`
		UPDATE comandas
		SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM itens_comanda WHERE comanda_id = ?)
		WHERE id = ?
	`, comandaID, comandaID)

	if err != nil {
		log.Printf("Erro ao atualizar total: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quantidade atualizada com sucesso"})
}
