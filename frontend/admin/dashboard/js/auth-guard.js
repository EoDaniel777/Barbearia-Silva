/**
 * Auth Guard - Proteção de Rotas Administrativas
 * Barbearia Silva - 2025
 *
 * Este script deve ser carregado ANTES de qualquer outro script do dashboard
 * para garantir que apenas usuários autenticados possam acessar.
 */

(function() {
    'use strict';


    /**
     * Exibe uma notificação toast simples
     */
    function showToast(message, type = 'info') {
        // Adicionar animações CSS se ainda não existirem
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            font-size: 14px;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * ✅ VALIDAÇÃO NO BACKEND - Verifica se o usuário está autenticado
     */
    async function isAuthenticated() {
        const token = localStorage.getItem('token');

        if (!token) {
            console.warn('[AUTH GUARD] Token não encontrado');
            return false;
        }

        try {
            // ✅ Validar token no backend
            const response = await fetch('/api/v1/auth/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.warn('[AUTH GUARD] Token inválido ou expirado');
                return false;
            }

            const data = await response.json();

            if (!data.valid) {
                console.warn('[AUTH GUARD] Token não validado');
                return false;
            }

            return data;
        } catch (error) {
            console.error('[AUTH GUARD] Erro ao validar token:', error);
            return false;
        }
    }

    /**
     * ✅ VALIDAÇÃO NO BACKEND - Verifica se o usuário tem permissão de admin
     */
    async function isAdmin() {
        const validatedUser = await isAuthenticated();

        if (!validatedUser) {
            return false;
        }

        // Backend já retorna o tipo do usuário
        const isAdminUser = validatedUser.tipo === 'admin';

        if (!isAdminUser) {
            console.warn('[AUTH GUARD] Usuário não é admin:', validatedUser.tipo);
        }

        return isAdminUser;
    }

    /**
     * Redireciona para a página de login
     */
    function redirectToLogin() {
        console.warn('[AUTH GUARD] Redirecionando para login...');

        // Limpar dados inválidos do localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Salvar URL atual para redirecionar de volta após o login
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentPath);

        // Redirecionar para login
        window.location.href = '/login';
    }

    /**
     * ✅ ASYNC - Executa a verificação de autenticação
     */
    async function checkAuth() {
        const isAdminUser = await isAdmin();

        if (!isAdminUser) {
            console.error('[AUTH GUARD] Acesso negado - usuário não é administrador');
            showToast('Acesso restrito a administradores. Redirecionando...', 'error');
            setTimeout(() => {
                redirectToLogin();
            }, 1500);
            return false;
        }

        return true;
    }

    // ✅ EXECUTAR VERIFICAÇÃO IMEDIATAMENTE (ASYNC)
    // Bloquear carregamento da página se não estiver autenticado
    (async function() {
        const authorized = await checkAuth();
        if (!authorized) {
            // Parar execução de outros scripts
            throw new Error('AUTH_GUARD: Acesso não autorizado');
        }
    })();

    // Expor API global (caso precise usar em outros scripts)
    window.AuthGuard = {
        isAuthenticated,
        isAdmin,
        checkAuth
    };

})();
