package main

import (
	"log"

	"backend/internal/database"
	"backend/internal/handlers"
)

func main() {
	// Initialize SQLite database
	log.Println("Inicializando banco de dados...")
	if err := database.InitSQLite(); err != nil {
		log.Fatal("Erro ao inicializar banco de dados:", err)
	}
	defer database.Close()

	// Setup router with all routes
	router := handlers.SetupRouter()

	// Start server
	log.Println("🚀 Servidor iniciado em http://localhost:8080")
	log.Println("📱 Acesse: http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Erro ao iniciar servidor:", err)
	}
}
