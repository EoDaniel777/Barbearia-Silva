package firebase

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var (
	// App é a instância global do Firebase App
	App *firebase.App
	// Auth é a instância global do Firebase Auth Client
	Auth *auth.Client
)

// InitFirebase inicializa o Firebase Admin SDK
func InitFirebase() error {
	ctx := context.Background()

	// ESTRATÉGIA DE INICIALIZAÇÃO (ordem de prioridade):
	// 1. Variável de ambiente FIREBASE_SERVICE_ACCOUNT_PATH
	// 2. Arquivo na raiz do projeto (homologação)
	// 3. Application Default Credentials (produção/cloud)

	var opt option.ClientOption
	var serviceAccountPath string

	// Tentativa 1: Variável de ambiente (produção)
	serviceAccountPath = os.Getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

	// Tentativa 2: Arquivo na raiz do projeto (homologação)
	if serviceAccountPath == "" {
		// Lista de possíveis locais do arquivo
		// Paths relativos de backend/cmd/api/ (onde go run é executado)
		possiblePaths := []string{
			"../../../barbeariahom-firebase-adminsdk-fbsvc-5776f8b071.json", // Raiz do projeto
			"./barbeariahom-firebase-adminsdk-fbsvc-5776f8b071.json",
			"../barbeariahom-firebase-adminsdk-fbsvc-5776f8b071.json",
			"../../barbeariahom-firebase-adminsdk-fbsvc-5776f8b071.json",
			"../../../firebase-service-account.json",
			"./firebase-service-account.json",
			"../firebase-service-account.json",
			"./config/firebase-service-account.json",
		}

		for _, path := range possiblePaths {
			if _, err := os.Stat(path); err == nil {
				serviceAccountPath = path
				log.Printf("[FIREBASE] 🔍 Service Account encontrado: %s", path)
				break
			}
		}
	}

	// Se encontrou arquivo de Service Account
	if serviceAccountPath != "" {
		log.Printf("[FIREBASE] Inicializando com Service Account: %s", serviceAccountPath)
		opt = option.WithCredentialsFile(serviceAccountPath)

		// Inicializar Firebase App com Service Account
		var err error
		App, err = firebase.NewApp(ctx, nil, opt)
		if err != nil {
			log.Printf("[FIREBASE] ⚠️  Erro ao inicializar Firebase App: %v", err)
			log.Println("[FIREBASE] Firebase Auth desabilitado. Sistema usará apenas autenticação JWT local.")
			return nil // Não retornar erro fatal
		}

		// Obter Auth client
		Auth, err = App.Auth(ctx)
		if err != nil {
			log.Printf("[FIREBASE] ⚠️  Erro ao obter Auth client: %v", err)
			return nil
		}

		log.Println("[FIREBASE] ✅ Firebase Auth inicializado com sucesso (Service Account)")
		return nil
	}

	// Tentativa 3: Application Default Credentials (Google Cloud)
	log.Println("[FIREBASE] Tentando Application Default Credentials...")
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "barbeariahom" // Project ID padrão
	}

	conf := &firebase.Config{
		ProjectID: projectID,
	}

	var err error
	App, err = firebase.NewApp(ctx, conf)
	if err != nil {
		log.Printf("[FIREBASE] ⚠️  Não foi possível inicializar Firebase: %v", err)
		log.Println("[FIREBASE] 🔐 Firebase Auth desabilitado. Sistema usará apenas autenticação JWT local.")
		return nil // Não retornar erro, apenas desabilitar Firebase
	}

	Auth, err = App.Auth(ctx)
	if err != nil {
		log.Printf("[FIREBASE] ⚠️  Não foi possível obter Auth client: %v", err)
		return nil
	}

	log.Println("[FIREBASE] ✅ Firebase Auth inicializado com sucesso (ADC)")
	return nil
}

// VerifyIDToken verifica um token Firebase
func VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error) {
	if Auth == nil {
		// Auth client não inicializado - silencioso, fallback para JWT
		return nil, nil
	}

	token, err := Auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		// Não logar erros comuns de tokens JWT (esperado em autenticação híbrida)
		// Apenas retornar erro para permitir fallback silencioso para JWT
		return nil, err
	}

	return token, nil
}

// GetUser retorna dados de um usuário pelo UID
func GetUser(ctx context.Context, uid string) (*auth.UserRecord, error) {
	if Auth == nil {
		return nil, nil
	}

	user, err := Auth.GetUser(ctx, uid)
	if err != nil {
		log.Printf("[FIREBASE] Erro ao buscar usuário %s: %v", uid, err)
		return nil, err
	}

	return user, nil
}

// IsFirebaseEnabled verifica se o Firebase está habilitado
func IsFirebaseEnabled() bool {
	return Auth != nil
}
