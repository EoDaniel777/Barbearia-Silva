package handlers

import (
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type PagesHandler struct{}

func NewPagesHandler() *PagesHandler {
	return &PagesHandler{}
}

// Home serves the customer-facing homepage
func (h *PagesHandler) Home(c *gin.Context) {
	// Path relative to backend/cmd/api (where go run is executed)
	htmlPath := filepath.Join("..", "..", "..", "frontend", "home", "index.html")
	c.File(htmlPath)
}

// Dashboard serves the admin dashboard
func (h *PagesHandler) Dashboard(c *gin.Context) {
	// Path relative to backend/cmd/api (where go run is executed)
	htmlPath := filepath.Join("..", "..", "..", "frontend", "dashboard", "index.html")
	c.File(htmlPath)
}

// Login serves the login page
func (h *PagesHandler) Login(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "login", "index.html")
	c.File(htmlPath)
}

// Servicos serves the services page
func (h *PagesHandler) Servicos(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "servicos", "index.html")
	c.File(htmlPath)
}

// Agendar serves the booking page
func (h *PagesHandler) Agendar(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "agendar", "index.html")
	c.File(htmlPath)
}

// Barbeiros serves the barbers page
func (h *PagesHandler) Barbeiros(c *gin.Context) {
	htmlPath := filepath.Join("..", "..", "..", "frontend", "barbeiros", "index.html")
	c.File(htmlPath)
}
