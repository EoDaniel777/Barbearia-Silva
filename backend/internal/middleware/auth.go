package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWT Secret - Em produção, usar variável de ambiente
var jwtSecret = []byte("barbearia-silva-secret-key-2026-change-in-production")

// Claims estrutura para os dados do token JWT
type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	Tipo   string `json:"tipo"` // "admin" ou "cliente"
	jwt.RegisteredClaims
}

// AuthRequired middleware que valida JWT em todas as requisições
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token de autenticação não fornecido",
			})
			c.Abort()
			return
		}

		// Formato esperado: "Bearer TOKEN"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Formato de token inválido. Use: Bearer TOKEN",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parse e validação do token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			// Verifica o método de assinatura
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtSecret, nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token inválido ou expirado",
			})
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token inválido",
			})
			c.Abort()
			return
		}

		// Extrair claims e adicionar ao contexto
		if claims, ok := token.Claims.(*Claims); ok {
			c.Set("user_id", claims.UserID)
			c.Set("user_email", claims.Email)
			c.Set("user_tipo", claims.Tipo)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Não foi possível extrair dados do token",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminRequired middleware que valida se o usuário é admin
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		userTipo, exists := c.Get("user_tipo")

		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Usuário não autenticado",
			})
			c.Abort()
			return
		}

		if userTipo != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Acesso negado. Apenas administradores podem acessar este recurso.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetJWTSecret retorna o secret para uso em outros pacotes
func GetJWTSecret() []byte {
	return jwtSecret
}
