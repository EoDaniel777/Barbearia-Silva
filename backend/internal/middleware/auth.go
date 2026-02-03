package middleware

import (
	"backend/internal/database"
	"backend/internal/firebase"
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWT Secret - Usar variável de ambiente ou padrão
var jwtSecret = getJWTSecret()

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET_KEY")
	if secret == "" {
		secret = "barbearia-silva-secret-key-2026-change-in-production"
		log.Println("[AUTH] Usando JWT_SECRET_KEY padrão. Configure JWT_SECRET_KEY em produção!")
	}
	return []byte(secret)
}

// Claims estrutura para os dados do token JWT
type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	Tipo   string `json:"tipo"` // "admin" ou "cliente"
	jwt.RegisteredClaims
}

// AuthRequired middleware que valida JWT ou Firebase token
// Suporta autenticação híbrida: tenta Firebase primeiro, depois JWT local
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

		// 🔥 ESTRATÉGIA HÍBRIDA: Tentar Firebase Auth primeiro
		if firebase.IsFirebaseEnabled() {
			ctx := context.Background()
			firebaseToken, err := firebase.VerifyIDToken(ctx, tokenString)

			if err == nil && firebaseToken != nil {
				// ✅ Token Firebase válido
				log.Printf("[AUTH] Token Firebase válido para UID: %s", firebaseToken.UID)

				// Buscar ou criar usuário local no banco
				var userID int
				var userTipo string

				err := database.DB.QueryRow(`
					SELECT id, tipo FROM usuarios WHERE email = ?
				`, firebaseToken.Claims["email"]).Scan(&userID, &userTipo)

				if err != nil {
					// Usuário não existe localmente, criar
					log.Printf("[AUTH] Criando usuário local para Firebase UID: %s", firebaseToken.UID)

					email := ""
					if val, ok := firebaseToken.Claims["email"].(string); ok {
						email = val
					}

					name := ""
					if val, ok := firebaseToken.Claims["name"].(string); ok {
						name = val
					} else {
						name = email // Fallback
					}

					result, err := database.DB.Exec(`
						INSERT INTO usuarios (nome, email, senha, tipo, foto)
						VALUES (?, ?, ?, ?, ?)
					`, name, email, "", "cliente", firebaseToken.Claims["picture"])

					if err != nil {
						log.Printf("[AUTH] Erro ao criar usuário local: %v", err)
						c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao sincronizar usuário"})
						c.Abort()
						return
					}

					id, _ := result.LastInsertId()
					userID = int(id)
					userTipo = "cliente"
				}

				// Adicionar dados ao contexto
				c.Set("user_id", userID)
				c.Set("user_email", firebaseToken.Claims["email"])
				c.Set("user_tipo", userTipo)
				c.Set("firebase_uid", firebaseToken.UID)
				c.Set("auth_method", "firebase")

				c.Next()
				return
			}
		}

		// 🔐 FALLBACK: Tentar JWT local
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
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

		// ✅ Token JWT válido
		if claims, ok := token.Claims.(*Claims); ok {
			log.Printf("[AUTH] Token JWT válido para user_id: %d", claims.UserID)

			c.Set("user_id", claims.UserID)
			c.Set("user_email", claims.Email)
			c.Set("user_tipo", claims.Tipo)
			c.Set("auth_method", "jwt")
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
