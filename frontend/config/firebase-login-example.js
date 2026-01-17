// Exemplo de Integração do Firebase com a Página de Login
// Este arquivo mostra como integrar o Firebase Authentication com o sistema de login existente

// =====================================================
// INICIALIZAÇÃO DO FIREBASE
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[LOGIN] Inicializando página de login com Firebase');

    // Inicializar Firebase
    if (typeof firebaseConfig !== 'undefined' && typeof FirebaseAuth !== 'undefined') {
        const initialized = FirebaseAuth.initFirebase(firebaseConfig);

        if (initialized) {
            console.log('[LOGIN] Firebase inicializado com sucesso');
            setupFirebaseAuth();
        } else {
            console.warn('[LOGIN] Firebase não foi inicializado. Usando autenticação local.');
            setupLocalAuth();
        }
    } else {
        console.warn('[LOGIN] Firebase não configurado. Usando autenticação local.');
        setupLocalAuth();
    }
});

// =====================================================
// AUTENTICAÇÃO COM FIREBASE
// =====================================================

function setupFirebaseAuth() {
    // Observar mudanças no estado de autenticação
    FirebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('[FIREBASE] Usuário já logado:', user.email);

            // Sincronizar com backend
            await syncUserWithBackend(user);

            // Redirecionar baseado no tipo de usuário
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.tipo === 'admin') {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/';
            }
        }
    });

    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleFirebaseLogin);
    }

    // Botão de login com Google (se existir)
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }

    // Link de esqueci a senha
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}

// =====================================================
// HANDLERS DE AUTENTICAÇÃO FIREBASE
// =====================================================

async function handleFirebaseLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('Preencha todos os campos', 'error');
        return;
    }

    // Mostrar loading
    showLoading(true);

    try {
        // Tentar login com Firebase
        const result = await FirebaseAuth.loginWithEmail(email, password);

        if (result.success) {
            console.log('[FIREBASE] Login realizado com sucesso');

            // Sincronizar com backend
            await syncUserWithBackend(result.user);

            // Redirecionar
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.tipo === 'admin') {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/';
            }
        } else {
            // Se falhar, tentar autenticação local
            console.warn('[FIREBASE] Falha no login Firebase. Tentando autenticação local...');
            await handleLocalLogin(email, password);
        }
    } catch (error) {
        console.error('[LOGIN] Erro no login:', error);
        showMessage('Erro ao fazer login. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleGoogleLogin() {
    showLoading(true);

    try {
        const result = await FirebaseAuth.loginWithGoogle();

        if (result.success) {
            console.log('[FIREBASE] Login com Google realizado');

            // Sincronizar com backend
            await syncUserWithBackend(result.user);

            // Redirecionar
            window.location.href = '/dashboard';
        } else {
            showMessage(result.error, 'error');
        }
    } catch (error) {
        console.error('[LOGIN] Erro no login com Google:', error);
        showMessage('Erro ao fazer login com Google', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();

    const email = prompt('Digite seu email para recuperar a senha:');

    if (!email) return;

    showLoading(true);

    try {
        const result = await FirebaseAuth.resetPassword(email);

        if (result.success) {
            showMessage('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
        } else {
            showMessage(result.error, 'error');
        }
    } catch (error) {
        console.error('[LOGIN] Erro ao enviar email:', error);
        showMessage('Erro ao enviar email de recuperação', 'error');
    } finally {
        showLoading(false);
    }
}

// =====================================================
// SINCRONIZAÇÃO COM BACKEND
// =====================================================

async function syncUserWithBackend(firebaseUser) {
    try {
        console.log('[SYNC] Sincronizando usuário com backend:', firebaseUser.email);

        // Buscar dados do usuário no backend
        const response = await fetch('/api/v1/auth/me', {
            headers: {
                'X-User-Email': firebaseUser.email,
                'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
            }
        });

        if (response.ok) {
            const backendUser = await response.json();

            // Mesclar dados do Firebase com dados do backend
            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                nome: backendUser.nome || firebaseUser.displayName || 'Usuário',
                tipo: backendUser.tipo || 'cliente',
                telefone: backendUser.telefone || '',
                foto: backendUser.foto || firebaseUser.photoURL || null,
                firebaseToken: await firebaseUser.getIdToken()
            };

            // Salvar no localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('[SYNC] Dados do usuário salvos:', userData);
        } else {
            // Se o usuário não existe no backend, criar
            await createUserInBackend(firebaseUser);
        }
    } catch (error) {
        console.error('[SYNC] Erro ao sincronizar com backend:', error);

        // Salvar dados básicos do Firebase
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nome: firebaseUser.displayName || 'Usuário',
            tipo: 'cliente',
            foto: firebaseUser.photoURL || null
        };

        localStorage.setItem('user', JSON.stringify(userData));
    }
}

async function createUserInBackend(firebaseUser) {
    try {
        console.log('[SYNC] Criando usuário no backend');

        const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: firebaseUser.displayName || 'Usuário',
                email: firebaseUser.email,
                senha: 'firebase-auth', // Senha placeholder (não será usada)
                tipo: 'cliente'
            })
        });

        if (response.ok) {
            console.log('[SYNC] Usuário criado no backend');
            await syncUserWithBackend(firebaseUser);
        }
    } catch (error) {
        console.error('[SYNC] Erro ao criar usuário no backend:', error);
    }
}

// =====================================================
// AUTENTICAÇÃO LOCAL (FALLBACK)
// =====================================================

function setupLocalAuth() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            await handleLocalLogin(email, password);
        });
    }
}

async function handleLocalLogin(email, password) {
    showLoading(true);

    try {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha: password })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('[LOCAL AUTH] Login local realizado');

            // Salvar dados do usuário
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);

            // Redirecionar
            if (data.user.tipo === 'admin') {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/';
            }
        } else {
            const error = await response.json();
            showMessage(error.message || 'Email ou senha incorretos', 'error');
        }
    } catch (error) {
        console.error('[LOCAL AUTH] Erro no login:', error);
        showMessage('Erro ao fazer login. Verifique sua conexão.', 'error');
    } finally {
        showLoading(false);
    }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function showMessage(message, type = 'info') {
    // Implementar toast ou alert
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Exemplo simples
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showLoading(show) {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = show;
        submitBtn.textContent = show ? 'Entrando...' : 'Entrar';
    }

    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
}

// =====================================================
// LOGOUT (para uso em outras páginas)
// =====================================================

async function handleLogout() {
    try {
        // Logout do Firebase (se estiver usando)
        if (typeof FirebaseAuth !== 'undefined') {
            await FirebaseAuth.logout();
        }

        // Limpar localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Redirecionar para login
        window.location.href = '/login';
    } catch (error) {
        console.error('[LOGOUT] Erro ao fazer logout:', error);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.handleLogout = handleLogout;
}
