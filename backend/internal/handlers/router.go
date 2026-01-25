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

	// ===================================
	// CLIENT AREA (Clientes/Usuários)
	// ===================================
	// Home/Customer frontend
	router.Static("/css", "../../../frontend/client/home/css")
	router.Static("/js", "../../../frontend/client/home/js")
	router.Static("/assets", "../../../frontend/client/home/assets")
	router.Static("/icons", "../../../frontend/client/home/assets/icons")
	router.Static("/img", "../../../frontend/client/home/assets/images")

	// ===================================
	// ADMIN AREA (Administrativo)
	// ===================================
	// Dashboard frontend
	router.Static("/dashboard/css", "../../../frontend/admin/dashboard/css")
	router.Static("/dashboard/js", "../../../frontend/admin/dashboard/js")
	router.Static("/dashboard/assets", "../../../frontend/admin/dashboard/assets")
	router.Static("/dashboard/icons", "../../../frontend/admin/dashboard/assets/icons")
	router.Static("/dashboard/img", "../../../frontend/admin/dashboard/assets/images")

	// ===================================
	// SHARED AREA (Compartilhado)
	// ===================================
	// Login (shared between client and admin)
	router.Static("/login/css", "../../../frontend/shared/login/css")
	router.Static("/login/js", "../../../frontend/shared/login/js")
	router.Static("/login/assets", "../../../frontend/shared/login/assets")

	// Favicon route
	router.GET("/favicon.ico", func(c *gin.Context) {
		c.File("../../../frontend/client/home/assets/images/logoSemFundo.png")
	})

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

			// Horários de trabalho do barbeiro
			barbeiros.GET("/:id/horarios", barbeiroHandler.GetHorarios)
			barbeiros.POST("/:id/horarios", barbeiroHandler.SaveHorarios)
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

		// Comandas (PDV - Ponto de Venda)
		comandas := v1.Group("/comandas")
		{
			comandas.GET("", ListarComandas)                                // Lista todas as comandas (com filtro opcional ?status=aberta)
			comandas.GET("/:id", ObterComanda)                              // Obter comanda específica com itens
			comandas.POST("", CriarComanda)                                 // Criar nova comanda
			comandas.POST("/:id/itens", AdicionarItemComanda)               // Adicionar item à comanda
			comandas.PUT("/:id/itens/:item_id", AtualizarQuantidadeItem)    // Atualizar quantidade de item
			comandas.DELETE("/:id/itens/:item_id", RemoverItemComanda)      // Remover item da comanda
			comandas.PATCH("/:id/fechar", FecharComanda)                    // Fechar comanda (finalizar e registrar pagamento)
			comandas.PATCH("/:id/cancelar", CancelarComanda)                // Cancelar comanda
			comandas.GET("/relatorio/dia", RelatorioComandasDia)            // Relatório do dia (estatísticas)
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

		// Settings (Configurações)
		settings := v1.Group("/settings")
		{
			settings.POST("/logo", UploadLogo)                          // Upload de logo
			settings.GET("/geral", GetConfiguracoesGerais)              // Obter configurações gerais
			settings.PUT("/geral", AtualizarConfiguracoesGerais)        // Atualizar configurações gerais
		}
	}

	return router
}
