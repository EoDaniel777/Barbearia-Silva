package handlers

import (
	"backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRouter configures all routes for the application
func SetupRouter() *gin.Engine {
	router := gin.Default()

	// Apply CORS middleware
	router.Use(middleware.CORS())

	// Initialize handlers
	healthHandler := NewHealthHandler()
	pagesHandler := NewPagesHandler()
	barbeiroHandler := NewBarbeiroHandler()
	servicoHandler := NewServicoHandler()
	horarioHandler := NewHorarioHandler()
	authHandler := NewAuthHandler()
	notificationHandler := NewNotificationHandler()

	// Serve static files from frontend directories
	// Path is relative to backend/cmd/api (where go run is executed)
	// Home/Customer frontend
	router.Static("/css", "../../../frontend/home/css")
	router.Static("/js", "../../../frontend/home/js")
	router.Static("/assets", "../../../frontend/home/assets")
	router.Static("/icons", "../../../frontend/home/assets/icons")
	router.Static("/img", "../../../frontend/home/assets/images")

	// Dashboard frontend
	router.Static("/dashboard/css", "../../../frontend/dashboard/css")
	router.Static("/dashboard/js", "../../../frontend/dashboard/js")
	router.Static("/dashboard/assets", "../../../frontend/dashboard/assets")
	router.Static("/dashboard/icons", "../../../frontend/dashboard/assets/icons")
	router.Static("/dashboard/img", "../../../frontend/dashboard/assets/images")

	// Page routes
	router.GET("/", pagesHandler.Home)
	router.GET("/dashboard", pagesHandler.Dashboard)
	router.GET("/login", pagesHandler.Login)
	router.GET("/servicos", pagesHandler.Servicos)
	router.GET("/agendar", pagesHandler.Agendar)
	router.GET("/barbeiros", pagesHandler.Barbeiros)

	// Health check routes
	router.GET("/health", healthHandler.HealthCheck)
	router.GET("/teste", healthHandler.Test)

	// API v1 routes group
	v1 := router.Group("/api/v1")
	{
		// Health
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "pong",
			})
		})

		// Barbeiros (Barbers)
		barbeiros := v1.Group("/barbeiros")
		{
			barbeiros.GET("", barbeiroHandler.List)
			barbeiros.GET("/:id", barbeiroHandler.Get)
			barbeiros.POST("", barbeiroHandler.Create)
			barbeiros.PUT("/:id", barbeiroHandler.Update)
			barbeiros.DELETE("/:id", barbeiroHandler.Delete)
		}

		// Horários (Schedules)
		horarios := v1.Group("/horarios")
		{
			horarios.GET("", horarioHandler.List)
			horarios.GET("/disponibilidade", horarioHandler.GetDisponibilidade)
			horarios.POST("", horarioHandler.Create)
			horarios.PATCH("/:id/status", horarioHandler.UpdateStatus)
			horarios.DELETE("/:id", horarioHandler.Delete)
		}

		// Serviços (Services)
		servicos := v1.Group("/servicos")
		{
			servicos.GET("", servicoHandler.List)
			servicos.POST("", servicoHandler.Create)
			servicos.PUT("/:id", servicoHandler.Update)
			servicos.DELETE("/:id", servicoHandler.Delete)
		}

		// Auth (Authentication)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.GET("/me", authHandler.Me)
		}

		// Notificações (Notifications)
		notifications := v1.Group("/notifications")
		{
			notifications.GET("", notificationHandler.GetNotifications)
			notifications.PATCH("/:id/read", notificationHandler.MarkAsRead)
		}
	}

	return router
}
