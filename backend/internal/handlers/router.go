package handlers

import (
	"os"
	"path/filepath"
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
	personalizacaoHandler := NewPersonalizacaoHandler()

	// Serve static files from frontend directories
	// Path is relative to backend/ (where go run is executed)
	
	basePath := "../frontend"
	if _, err := os.Stat(basePath); os.IsNotExist(err) {
		basePath = "frontend"
	}

	// ===================================
	// CLIENT AREA (Clientes/Usuários)
	// ===================================
	// Client frontend (consolidado)
	router.Static("/css", filepath.Join(basePath, "client/css"))
	router.Static("/js", filepath.Join(basePath, "client/js"))
	router.Static("/assets", filepath.Join(basePath, "client/assets"))
	router.Static("/icons", filepath.Join(basePath, "client/assets/icons"))
	router.Static("/img", filepath.Join(basePath, "client/assets/images"))

	// ===================================
	// ADMIN AREA (Administrativo)
	// ===================================
	// Dashboard frontend
	router.Static("/dashboard/css", filepath.Join(basePath, "admin/dashboard/css"))
	router.Static("/dashboard/js", filepath.Join(basePath, "admin/dashboard/js"))
	router.Static("/dashboard/assets", filepath.Join(basePath, "admin/dashboard/assets"))
	router.Static("/dashboard/icons", filepath.Join(basePath, "admin/dashboard/assets/icons"))
	router.Static("/dashboard/img", filepath.Join(basePath, "admin/dashboard/assets/images"))

	// ===================================
	// AUTH AREA (Autenticação)
	// ===================================
	// Login/Auth pages
	router.Static("/auth/css", filepath.Join(basePath, "auth/css"))
	router.Static("/auth/js", filepath.Join(basePath, "auth/js"))
	router.Static("/auth/assets", filepath.Join(basePath, "auth/assets"))

	// ===================================
	// SHARED AREA (Compartilhado)
	// ===================================
	// Shared JavaScript modules (fidelidade, theme-manager, personalizacao-loader)
	router.Static("/shared/js", filepath.Join(basePath, "shared/js"))
	router.Static("/shared/config", filepath.Join(basePath, "shared/config"))

	// Favicon route
	router.GET("/favicon.ico", func(c *gin.Context) {
		c.File(filepath.Join(basePath, "client/assets/images/logoSemFundo.png"))
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
			// Rotas públicas (leitura)
			barbeiros.GET("", barbeiroHandler.List)
			barbeiros.GET("/:id", barbeiroHandler.Get)
			barbeiros.GET("/:id/horarios", barbeiroHandler.GetHorarios)

			// Rotas protegidas (apenas admin pode criar/editar/deletar)
			barbeirosAdmin := barbeiros.Group("")
			barbeirosAdmin.Use(middleware.AuthRequired(), middleware.AdminRequired())
			{
				barbeirosAdmin.POST("", barbeiroHandler.Create)
				barbeirosAdmin.PUT("/:id", barbeiroHandler.Update)
				barbeirosAdmin.DELETE("/:id", barbeiroHandler.Delete)
				barbeirosAdmin.POST("/:id/horarios", barbeiroHandler.SaveHorarios)
			}
		}

		// Horários (Schedules)
		horarios := v1.Group("/horarios")
		{
			// Rotas públicas
			horarios.GET("/disponibilidade", horarioHandler.GetDisponibilidade)
			horarios.GET("/fidelidade", horarioHandler.GetFidelidade) // Novo endpoint de fidelidade
			horarios.POST("", horarioHandler.Create) // Clientes podem criar agendamentos

			// Rotas protegidas (requer autenticação)
			horariosProtected := horarios.Group("")
			horariosProtected.Use(middleware.AuthRequired())
			{
				horariosProtected.GET("", horarioHandler.List)
				horariosProtected.GET("/proximos", horarioHandler.GetProximos) // Agendamentos próximos (PDV)
			}

			// Rotas admin (atualizar status e deletar)
			horariosAdmin := horarios.Group("")
			horariosAdmin.Use(middleware.AuthRequired(), middleware.AdminRequired())
			{
				horariosAdmin.PATCH("/:id/status", horarioHandler.UpdateStatus)
				horariosAdmin.DELETE("/:id", horarioHandler.Delete)
			}
		}

		// Serviços (Services)
		servicos := v1.Group("/servicos")
		{
			// Rotas públicas (leitura)
			servicos.GET("", servicoHandler.List)
			servicos.GET("/:id", servicoHandler.Get)

			// Rotas protegidas (apenas admin)
			servicosAdmin := servicos.Group("")
			servicosAdmin.Use(middleware.AuthRequired(), middleware.AdminRequired())
			{
				servicosAdmin.POST("", servicoHandler.Create)
				servicosAdmin.PUT("/:id", servicoHandler.Update)
				servicosAdmin.DELETE("/:id", servicoHandler.Delete)
			}
		}

		// Comandas (PDV - Ponto de Venda) - TODAS AS ROTAS PROTEGIDAS (apenas admin)
		comandas := v1.Group("/comandas")
		comandas.Use(middleware.AuthRequired(), middleware.AdminRequired())
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

			// Rotas protegidas de autenticação
			authProtected := auth.Group("")
			authProtected.Use(middleware.AuthRequired())
			{
				authProtected.GET("/me", authHandler.Me)
				authProtected.POST("/validate", authHandler.ValidateToken)
			}
		}

		// Usuários (Users) - Rotas protegidas
		usuarios := v1.Group("/usuarios")
		usuarios.Use(middleware.AuthRequired())
		{
			usuarios.GET("", authHandler.ListUsers)
			usuarios.GET("/agendados", authHandler.GetUsuariosAgendados) // Usuários com agendamentos próximos
			usuarios.PUT("/:id", authHandler.UpdateProfile)
		}

		// Notificações (Notifications) - Rotas protegidas
		notifications := v1.Group("/notifications")
		notifications.Use(middleware.AuthRequired())
		{
			notifications.GET("", notificationHandler.GetNotifications)
			notifications.PATCH("/:id/read", notificationHandler.MarkAsRead)
		}

		// Personalização (Customization)
		personalizacao := v1.Group("/personalizacao")
		{
			// Rota pública (leitura)
			personalizacao.GET("", personalizacaoHandler.GetPersonalizacao)

			// Rotas protegidas (apenas admin)
			personalizacaoAdmin := personalizacao.Group("")
			personalizacaoAdmin.Use(middleware.AuthRequired(), middleware.AdminRequired())
			{
				personalizacaoAdmin.PUT("", personalizacaoHandler.UpdatePersonalizacao)
				personalizacaoAdmin.DELETE("/reset", personalizacaoHandler.ResetPersonalizacao)
			}
		}

		// Settings (Configurações) - Todas protegidas (apenas admin)
		settings := v1.Group("/settings")
		settings.Use(middleware.AuthRequired(), middleware.AdminRequired())
		{
			settings.POST("/logo", UploadLogo)                          // Upload de logo
			settings.GET("/geral", GetConfiguracoesGerais)              // Obter configurações gerais
			settings.PUT("/geral", AtualizarConfiguracoesGerais)        // Atualizar configurações gerais
		}
	}

	return router
}
