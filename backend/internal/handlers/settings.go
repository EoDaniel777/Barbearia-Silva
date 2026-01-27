package handlers

import (
	"encoding/base64"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"backend/internal/database"
)

// UploadLogo faz upload da logo da barbearia
// Aceita base64 ou multipart/form-data
func UploadLogo(c *gin.Context) {
	log.Printf("[UploadLogo] Recebendo requisição de upload de logo")

	var input struct {
		LogoDark  string `json:"logoDark"`  // Base64
		LogoWhite string `json:"logoWhite"` // Base64
	}

	// Tentar receber como JSON (base64)
	if err := c.ShouldBindJSON(&input); err == nil {
		log.Printf("[UploadLogo] Método: JSON/Base64")
		log.Printf("[UploadLogo] LogoDark: %d chars, LogoWhite: %d chars",
			len(input.LogoDark), len(input.LogoWhite))

		// Processar upload via base64
		if input.LogoDark != "" {
			log.Printf("[UploadLogo] Salvando logoDark.jpeg...")
			if err := saveBase64Image(input.LogoDark, "logoDark.jpeg"); err != nil {
				log.Printf("[UploadLogo] ✗ Erro ao salvar logoDark: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar logo dark"})
				return
			}
			log.Printf("[UploadLogo] ✓ logoDark.jpeg salva com sucesso")
		}

		if input.LogoWhite != "" {
			log.Printf("[UploadLogo] Salvando logoWhite.jpeg...")
			if err := saveBase64Image(input.LogoWhite, "logoWhite.jpeg"); err != nil {
				log.Printf("[UploadLogo] ✗ Erro ao salvar logoWhite: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar logo white"})
				return
			}
			log.Printf("[UploadLogo] ✓ logoWhite.jpeg salva com sucesso")
		}

		log.Printf("[UploadLogo] ✓ Upload concluído com sucesso")
		c.JSON(http.StatusOK, gin.H{
			"message": "Logos atualizadas com sucesso",
		})
		return
	}

	// Tentar receber como multipart/form-data
	formDark, errDark := c.FormFile("logoDark")
	formWhite, errWhite := c.FormFile("logoWhite")

	if errDark != nil && errWhite != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Envie pelo menos uma logo (logoDark ou logoWhite)"})
		return
	}

	imagesPath := filepath.Join("..", "..", "..", "frontend", "client", "home", "assets", "images")

	// Salvar logoDark
	if errDark == nil {
		destPath := filepath.Join(imagesPath, "logoDark.jpeg")
		if err := c.SaveUploadedFile(formDark, destPath); err != nil {
			log.Printf("Erro ao salvar logoDark via form: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar logo dark"})
			return
		}
	}

	// Salvar logoWhite
	if errWhite == nil {
		destPath := filepath.Join(imagesPath, "logoWhite.jpeg")
		if err := c.SaveUploadedFile(formWhite, destPath); err != nil {
			log.Printf("Erro ao salvar logoWhite via form: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar logo white"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logos atualizadas com sucesso",
	})
}

// saveBase64Image salva uma imagem base64 no disco
func saveBase64Image(base64Data, filename string) error {
	log.Printf("[saveBase64Image] Salvando %s...", filename)

	// Remover prefixo data:image/...;base64, se existir
	parts := strings.Split(base64Data, ",")
	var imageData string
	if len(parts) > 1 {
		imageData = parts[1]
		prefix := parts[0]
		if len(prefix) > 50 {
			prefix = prefix[:50] + "..."
		}
		log.Printf("[saveBase64Image] Prefixo removido: %s", prefix)
	} else {
		imageData = base64Data
		log.Printf("[saveBase64Image] Nenhum prefixo encontrado")
	}

	// Decodificar base64
	decoded, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		log.Printf("[saveBase64Image] Erro ao decodificar base64: %v", err)
		return err
	}

	log.Printf("[saveBase64Image] Imagem decodificada: %d bytes", len(decoded))

	// Caminho do arquivo
	imagesPath := filepath.Join("..", "..", "..", "frontend", "client", "home", "assets", "images")
	destPath := filepath.Join(imagesPath, filename)

	log.Printf("[saveBase64Image] Caminho de destino: %s", destPath)

	// Criar diretório se não existir
	if err := os.MkdirAll(imagesPath, 0755); err != nil {
		log.Printf("[saveBase64Image] Erro ao criar diretório: %v", err)
		return err
	}

	// Salvar arquivo
	if err := os.WriteFile(destPath, decoded, 0644); err != nil {
		log.Printf("[saveBase64Image] Erro ao escrever arquivo: %v", err)
		return err
	}

	log.Printf("[saveBase64Image] ✓ Arquivo salvo com sucesso: %s (%d bytes)", filename, len(decoded))
	return nil
}

// GetConfiguracoesGerais retorna configurações gerais do sistema
func GetConfiguracoesGerais(c *gin.Context) {
	var config struct {
		Nome      string `json:"nome"`
		Telefone  string `json:"telefone"`
		WhatsApp  string `json:"whatsapp"`
		Endereco  string `json:"endereco"`
		Instagram string `json:"instagram"`
		Email     string `json:"email"`
	}

	err := database.DB.QueryRow(`
		SELECT nome, telefone, whatsapp, endereco, instagram, email
		FROM configuracoes
		WHERE id = 1
	`).Scan(&config.Nome, &config.Telefone, &config.WhatsApp, &config.Endereco, &config.Instagram, &config.Email)

	if err != nil {
		log.Printf("Erro ao buscar configurações: %v", err)
		// Retornar valores padrão se não encontrar
		c.JSON(http.StatusOK, gin.H{
			"nome":      "Barbearia Silva",
			"telefone":  "(61) 99999-9999",
			"endereco":  "Brasília - DF",
			"email":     "contato@barbeariasilva.com",
			"whatsapp":  "5561999999999",
			"instagram": "@barbeariasilva",
		})
		return
	}

	c.JSON(http.StatusOK, config)
}

// AtualizarConfiguracoesGerais atualiza configurações gerais
func AtualizarConfiguracoesGerais(c *gin.Context) {
	var input struct {
		Nome      string `json:"nome"`
		Telefone  string `json:"telefone"`
		WhatsApp  string `json:"whatsapp"`
		Endereco  string `json:"endereco"`
		Instagram string `json:"instagram"`
		Email     string `json:"email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se já existe configuração
	var exists int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM configuracoes WHERE id = 1").Scan(&exists)
	if err != nil {
		log.Printf("Erro ao verificar configurações: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar configurações"})
		return
	}

	now := time.Now()

	if exists > 0 {
		// Atualizar configuração existente
		_, err = database.DB.Exec(`
			UPDATE configuracoes
			SET nome = ?, telefone = ?, whatsapp = ?, endereco = ?, instagram = ?, email = ?, atualizado_em = ?
			WHERE id = 1
		`, input.Nome, input.Telefone, input.WhatsApp, input.Endereco, input.Instagram, input.Email, now)
	} else {
		// Inserir nova configuração
		_, err = database.DB.Exec(`
			INSERT INTO configuracoes (id, nome, telefone, whatsapp, endereco, instagram, email, criado_em, atualizado_em)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, 1, input.Nome, input.Telefone, input.WhatsApp, input.Endereco, input.Instagram, input.Email, now, now)
	}

	if err != nil {
		log.Printf("Erro ao salvar configurações: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar configurações"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Configurações atualizadas com sucesso",
		"data":    input,
	})
}
