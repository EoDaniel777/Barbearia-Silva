// Firebase Configuration
// As credenciais são carregadas dinamicamente do backend

let firebaseConfig = null;

// Função para buscar e inicializar o Firebase
async function initFirebaseConfig() {
    try {
        const response = await fetch('/api/v1/config/firebase');
        if (!response.ok) {
            throw new Error('Falha ao carregar configurações do Firebase');
        }
        
        firebaseConfig = await response.json();
        
        // Verifica se temos as configurações mínimas (ex: apiKey)
        if (firebaseConfig && firebaseConfig.apiKey) {
            // Se estiver em ambiente Node (módulos)
            if (typeof module !== 'undefined' && module.exports) {
                module.exports = firebaseConfig;
            }
            
            // Retorna a config para inicialização
            return firebaseConfig;
        } else {
            console.warn('[FIREBASE] Configuração incompleta ou ausente no backend.');
            return null;
        }
    } catch (error) {
        console.error('[FIREBASE CONFIG]', error);
        return null;
    }
}

// Para retrocompatibilidade ou acesso global direto (se necessário)
window.getFirebaseConfig = initFirebaseConfig;
