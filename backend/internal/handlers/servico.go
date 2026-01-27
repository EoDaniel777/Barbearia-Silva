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

// List all services
func (h *ServicoHandler) List(c *gin.Context) {
	// Adicionar headers para prevenir cache do navegador
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	rows, err := database.DB.Query(`
		SELECT id, nome, tipo, descricao, preco, duracao, foto, ativo, criado_em, atualizado_em
		FROM servicos
		WHERE ativo = 1
		ORDER BY nome ASC
	`)
	if err != nil {
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

	c.JSON(http.StatusOK, servicos)
}

// Get a service by ID
func (h *ServicoHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var s models.Servico
	var descricao, foto *string

	err := database.DB.QueryRow(`
		SELECT id, nome, tipo, descricao, preco, duracao, foto, ativo, criado_em, atualizado_em
		FROM servicos
		WHERE id = ?
	`, id).Scan(&s.ID, &s.Nome, &s.Tipo, &descricao, &s.Preco, &s.Duracao, &foto, &s.Ativo, &s.CreatedAt, &s.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Serviço não encontrado"})
		return
	}

	// Handle nullable fields
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
