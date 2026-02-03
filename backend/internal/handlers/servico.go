package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ServicoHandler struct{}

func NewServicoHandler() *ServicoHandler {
	return &ServicoHandler{}
}

// List all services com filtros opcionais
// Query params: ?tipo=servico|produto&limit=4&ativo=true|false
func (h *ServicoHandler) List(c *gin.Context) {
	// Adicionar headers para prevenir cache do navegador
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	// Query params
	tipoFiltro := c.Query("tipo")        // "servico" ou "produto"
	limitStr := c.Query("limit")         // Limite de resultados
	ativoFiltro := c.DefaultQuery("ativo", "true") // Padrão: apenas ativos

	log.Printf("[ServicoHandler] List - Filtros: tipo=%s, limit=%s, ativo=%s",
		tipoFiltro, limitStr, ativoFiltro)

	// Construir query dinamicamente
	query := `
		SELECT id, nome, tipo, descricao, preco, duracao, foto, ativo, criado_em, atualizado_em
		FROM servicos
		WHERE 1=1
	`
	args := []interface{}{}

	// Filtro de ativo
	if ativoFiltro == "true" {
		query += " AND ativo = 1"
	} else if ativoFiltro == "false" {
		query += " AND ativo = 0"
	}
	// Se não especificar, retorna todos (ativos e inativos)

	// Filtro de tipo
	if tipoFiltro != "" {
		query += " AND tipo = ?"
		args = append(args, tipoFiltro)
	}

	// Ordenação
	query += " ORDER BY nome ASC"

	// Limite de resultados
	if limitStr != "" {
		query += " LIMIT ?"
		args = append(args, limitStr)
	}

	log.Printf("[ServicoHandler] Query: %s | Args: %v", query, args)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Printf("[ServicoHandler] Erro ao buscar: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}
	defer rows.Close()

	servicos := []models.Servico{}
	for rows.Next() {
		var s models.Servico
		var tipo, descricao, foto *string

		err := rows.Scan(&s.ID, &s.Nome, &tipo, &descricao, &s.Preco, &s.Duracao, &foto, &s.Ativo, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			log.Printf("[ServicoHandler] Erro no scan: %v", err)
			continue
		}

		// Handle nullable fields
		if tipo != nil {
			s.Tipo = *tipo
		} else {
			s.Tipo = "servico" // default
		}
		if descricao != nil {
			s.Descricao = *descricao
		}
		if foto != nil {
			s.Foto = *foto
		}

		servicos = append(servicos, s)
	}

	log.Printf("[ServicoHandler] ✓ Retornando %d serviços", len(servicos))
	c.JSON(http.StatusOK, servicos)
}

// Get a service by ID
func (h *ServicoHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var s models.Servico
	var tipo, descricao, foto *string

	err := database.DB.QueryRow(`
		SELECT id, nome, tipo, descricao, preco, duracao, foto, ativo, criado_em, atualizado_em
		FROM servicos
		WHERE id = ? AND ativo = 1
	`, id).Scan(&s.ID, &s.Nome, &tipo, &descricao, &s.Preco, &s.Duracao, &foto, &s.Ativo, &s.CreatedAt, &s.UpdatedAt)

	if err != nil {
		log.Printf("[ServicoHandler] Erro ao buscar serviço ID %s: %v", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
		return
	}

	// Handle nullable fields
	if tipo != nil {
		s.Tipo = *tipo
	} else {
		s.Tipo = "servico" // default
	}
	if descricao != nil {
		s.Descricao = *descricao
	}
	if foto != nil {
		s.Foto = *foto
	}

	c.JSON(http.StatusOK, s)
}

// Create a new service
func (h *ServicoHandler) Create(c *gin.Context) {
	log.Printf("[ServicoHandler] Criando novo serviço...")

	var input models.ServicoInput

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[ServicoHandler] Erro no bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[ServicoHandler] Dados recebidos: Nome=%s, Tipo=%s, Preço=%.2f, Duração=%d, Foto=%d chars",
		input.Nome, input.Tipo, input.Preco, input.Duracao, len(input.Foto))

	// Validação adicional: produtos podem ter duração 0
	if input.Tipo == "servico" && input.Duracao == 0 {
		log.Printf("[ServicoHandler] Validação falhou: serviço sem duração")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Serviços devem ter uma duração"})
		return
	}

	// Insert into database
	result, err := database.DB.Exec(`
		INSERT INTO servicos (nome, tipo, descricao, preco, duracao, foto, ativo)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, input.Nome, input.Tipo, input.Descricao, input.Preco, input.Duracao, input.Foto, 1)

	if err != nil {
		// Log do erro para debugging
		log.Printf("[ServicoHandler] ✗ Erro ao inserir no banco: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar serviço", "details": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	log.Printf("[ServicoHandler] ✓ Serviço criado com ID: %d", id)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Serviço criado com sucesso",
		"id":      id,
		"data":    input,
	})
}

// Update a service
func (h *ServicoHandler) Update(c *gin.Context) {
	id := c.Param("id")
	log.Printf("[ServicoHandler] Atualizando serviço ID: %s", id)

	var input models.ServicoInput

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[ServicoHandler] Erro no bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[ServicoHandler] Dados recebidos: Nome=%s, Tipo=%s, Preço=%.2f, Foto=%d chars",
		input.Nome, input.Tipo, input.Preco, len(input.Foto))

	// Update in database
	result, err := database.DB.Exec(`
		UPDATE servicos
		SET nome = ?, tipo = ?, descricao = ?, preco = ?, duracao = ?, foto = ?, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = ?
	`, input.Nome, input.Tipo, input.Descricao, input.Preco, input.Duracao, input.Foto, id)

	if err != nil {
		log.Printf("[ServicoHandler] Erro ao atualizar: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar serviço"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("[ServicoHandler] ✓ Serviço atualizado. Linhas afetadas: %d", rowsAffected)

	c.JSON(http.StatusOK, gin.H{
		"message": "Serviço atualizado com sucesso",
		"id":      id,
		"data":    input,
	})
}

// Delete a service
func (h *ServicoHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Soft delete - apenas marcar como inativo
	_, err := database.DB.Exec(`
		UPDATE servicos
		SET ativo = 0, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = ?
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover serviço"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Serviço removido com sucesso",
		"id":      id,
	})
}
