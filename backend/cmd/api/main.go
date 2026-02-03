package main

import (
	"log"

	"backend/internal/database"
	"backend/internal/firebase"
	"backend/internal/handlers"
)

func main() {
	// Initialize Firebase (optional - won't fail if not configured)
	log.Println("Inicializando Firebase Auth...")
	if err := firebase.InitFirebase(); err != nil {
		log.Printf("⚠️  Firebase não inicializado: %v", err)
		log.Println("Sistema funcionará apenas com autenticação JWT local")
	}

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
	if firebase.IsFirebaseEnabled() {
		log.Println("🔥 Firebase Auth: HABILITADO")
	} else {
		log.Println("🔐 Firebase Auth: DESABILITADO (usando apenas JWT local)")
	}

	if err := router.Run(":8080"); err != nil {
		log.Fatal("Erro ao iniciar servidor:", err)
	}
}
