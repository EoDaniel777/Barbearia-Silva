// Firebase Authentication Module
// Este arquivo configura e inicializa o Firebase Authentication

// Import Firebase SDK (usando CDN)
// Certifique-se de incluir os scripts do Firebase no HTML antes deste arquivo

let auth = null;
let app = null;

/**
 * Inicializa o Firebase
 * @param {Object} config - Configuração do Firebase
 */
function initFirebase(config) {
    try {
        // Verifica se o Firebase está disponível
        if (typeof firebase === 'undefined') {
            console.error('[FIREBASE] Firebase SDK não carregado. Inclua os scripts do Firebase no HTML.');
            return false;
        }

        // Inicializa o Firebase
        app = firebase.initializeApp(config);
        auth = firebase.auth();

        console.log('[FIREBASE] Firebase inicializado com sucesso');

        // Configurar persistência de autenticação
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log('[FIREBASE] Persistência de autenticação configurada');
            })
            .catch((error) => {
                console.error('[FIREBASE] Erro ao configurar persistência:', error);
            });

        return true;
    } catch (error) {
        console.error('[FIREBASE] Erro ao inicializar Firebase:', error);
        return false;
    }
}

/**
 * Registra novo usuário com email e senha
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
async function registerWithEmail(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('[FIREBASE AUTH] Usuário registrado:', userCredential.user.uid);
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        console.error('[FIREBASE AUTH] Erro ao registrar:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Login com email e senha
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
async function loginWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('[FIREBASE AUTH] Login realizado:', userCredential.user.uid);
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        console.error('[FIREBASE AUTH] Erro ao fazer login:', error);
        return {
            success: false,
            error: getErrorMessage(error.code),
            code: error.code
        };
    }
}

/**
 * Login com Google
 * @returns {Promise<Object>}
 */
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log('[FIREBASE AUTH] Login com Google realizado:', result.user.uid);
        return {
            success: true,
            user: result.user
        };
    } catch (error) {
        console.error('[FIREBASE AUTH] Erro ao fazer login com Google:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Logout
 * @returns {Promise<Object>}
 */
async function logout() {
    try {
        await auth.signOut();
        console.log('[FIREBASE AUTH] Logout realizado');
        return { success: true };
    } catch (error) {
        console.error('[FIREBASE AUTH] Erro ao fazer logout:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Envia email de redefinição de senha
 * @param {string} email
 * @returns {Promise<Object>}
 */
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        console.log('[FIREBASE AUTH] Email de redefinição enviado');
        return { success: true };
    } catch (error) {
        console.error('[FIREBASE AUTH] Erro ao enviar email:', error);
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

/**
 * Obtém o usuário atual
 * @returns {Object|null}
 */
function getCurrentUser() {
    return auth ? auth.currentUser : null;
}

/**
 * Observa mudanças no estado de autenticação
 * @param {Function} callback
 */
function onAuthStateChanged(callback) {
    if (auth) {
        auth.onAuthStateChanged(callback);
    }
}

/**
 * Atualiza o perfil do usuário
 * @param {Object} profile - { displayName, photoURL }
 * @returns {Promise<Object>}
 */
async function updateUserProfile(profile) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        await user.updateProfile(profile);
        console.log('[FIREBASE AUTH] Perfil atualizado');
        return { success: true };
    } catch (error) {
        console.error('[FIREBASE AUTH] Erro ao atualizar perfil:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Traduz códigos de erro do Firebase
 * @param {string} errorCode
 * @returns {string}
 */
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este email já está em uso',
        'auth/invalid-email': 'Email inválido',
        'auth/operation-not-allowed': 'Operação não permitida',
        'auth/weak-password': 'Senha muito fraca. Use no mínimo 6 caracteres',
        'auth/user-disabled': 'Usuário desabilitado',
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
        'auth/popup-closed-by-user': 'Popup fechado antes de concluir o login',
        'auth/cancelled-popup-request': 'Solicitação de popup cancelada'
    };

    return errorMessages[errorCode] || 'Erro ao processar requisição';
}

// Exportar funções
if (typeof window !== 'undefined') {
    window.FirebaseAuth = {
        initFirebase,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        getCurrentUser,
        onAuthStateChanged,
        updateUserProfile,
        getErrorMessage
    };
}
