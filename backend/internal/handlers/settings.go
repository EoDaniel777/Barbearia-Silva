package handlers

import (
	"encoding/base64"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// UploadLogo faz upload da logo da barbearia
// Aceita base64 ou multipart/form-data
func UploadLogo(c *gin.Context) {
	var input struct {
		LogoDark  string `json:"logoDark"`  // Base64
		LogoWhite string `json:"logoWhite"` // Base64
	}

	// Tentar receber como JSON (base64)
	if err := c.ShouldBindJSON(&input); err == nil {
		// Processar upload via base64
		if input.LogoDark != "" {
			if err := saveBase64Image(input.LogoDark, "logoDark.jpeg"); err != nil {
				log.Printf("Erro ao salvar logoDark: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar logo dark"})
				return
			}
		}

		if input.LogoWhite != "" {
			if err := saveBase64Image(input.LogoWhite, "logoWhite.jpeg"); err != nil {
				log.Printf("Erro ao salvar logoWhite: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar logo white"})
				return
			}
		}

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
	// Remover prefixo data:image/...;base64, se existir
	parts := strings.Split(base64Data, ",")
	var imageData string
	if len(parts) > 1 {
		imageData = parts[1]
	} else {
		imageData = base64Data
	}

	// Decodificar base64
	decoded, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		return err
	}

	// Caminho do arquivo
	imagesPath := filepath.Join("..", "..", "..", "frontend", "client", "home", "assets", "images")
	destPath := filepath.Join(imagesPath, filename)

	// Criar diretório se não existir
	if err := os.MkdirAll(imagesPath, 0755); err != nil {
		return err
	}

	// Salvar arquivo
	return os.WriteFile(destPath, decoded, 0644)
}

// GetConfiguracoesGerais retorna configurações gerais do sistema
func GetConfiguracoesGerais(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"nome":     "Barbearia Silva",
		"telefone": "(61) 99999-9999",
		"endereco": "Brasília - DF",
		"email":    "contato@barbeariasilva.com",
		"whatsapp": "5561999999999",
	})
}

// AtualizarConfiguracoesGerais atualiza configurações gerais
// Por enquanto, mock - no futuro pode salvar em banco de dados
func AtualizarConfiguracoesGerais(c *gin.Context) {
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Salvar em banco de dados
	// Por enquanto apenas retorna sucesso
	c.JSON(http.StatusOK, gin.H{
		"message": "Configurações atualizadas com sucesso",
		"data":    input,
	})
}
