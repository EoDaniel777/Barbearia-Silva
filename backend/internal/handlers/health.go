package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// HealthCheck godoc
// @Summary Health check endpoint
// @Description Check if the API is running
// @Tags health
// @Produce json
// @Success 200 {object} map[string]string
// @Router /health [get]
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "OK",
		"message": "API is running",
	})
}

// Test godoc
// @Summary Test endpoint
// @Description Test endpoint for validation
// @Tags test
// @Produce json
// @Success 200 {object} map[string]string
// @Router /teste [get]
func (h *HealthHandler) Test(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "testado",
	})
}
