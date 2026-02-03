package handlers

import (
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type PagesHandler struct{}

func NewPagesHandler() *PagesHandler {
	return &PagesHandler{}
}

// ===================================
// CLIENT PAGES (Área do Cliente)
// ===================================

// Home serves the customer-facing homepage
func (h *PagesHandler) Home(c *gin.Context) {
	// Path relative to backend/cmd/api (where go run is executed)
	htmlPath := filepath.Join("..", "..", "..", "frontend", "client", "home.html")
	c.File(htmlPath)
}

// Servicos serves the services page (CLIENT)
func (h *PagesHandler) Servicos(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "client", "servicos.html")
	c.File(htmlPath)
}

// Agendar serves the booking page (CLIENT)
func (h *PagesHandler) Agendar(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "client", "agendar.html")
	c.File(htmlPath)
}

// Barbeiros serves the barbers page (CLIENT)
func (h *PagesHandler) Barbeiros(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "client", "barbeiros.html")
	c.File(htmlPath)
}

// ===================================
// ADMIN PAGES (Área Administrativa)
// ===================================

// Dashboard serves the admin dashboard
func (h *PagesHandler) Dashboard(c *gin.Context) {
	// Path relative to backend/cmd/api (where go run is executed)
	htmlPath := filepath.Join("..", "..", "..", "frontend", "admin", "dashboard.html")
	c.File(htmlPath)
}

// ===================================
// AUTH PAGES (Autenticação)
// ===================================

// Login serves the login page (AUTH)
func (h *PagesHandler) Login(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "auth", "login.html")
	c.File(htmlPath)
}
