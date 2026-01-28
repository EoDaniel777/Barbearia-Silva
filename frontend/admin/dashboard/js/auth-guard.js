/**
 * Auth Guard - Proteção de Rotas Administrativas
 * Barbearia Silva - 2025
 *
 * Este script deve ser carregado ANTES de qualquer outro script do dashboard
 * para garantir que apenas usuários autenticados possam acessar.
 */

(function() {
    'use strict';

    console.log('[AUTH GUARD] Inicializando verificação de autenticação...');

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
     * Verifica se o usuário está autenticado
     */
    function isAuthenticated() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!user || !token) {
            console.warn('[AUTH GUARD] Usuário não autenticado');
            return false;
        }

        try {
            const userData = JSON.parse(user);
            if (!userData || !userData.id) {
                console.warn('[AUTH GUARD] Dados de usuário inválidos');
                return false;
            }

            console.log('[AUTH GUARD] Usuário autenticado:', userData.nome);
            return true;
        } catch (error) {
            console.error('[AUTH GUARD] Erro ao validar dados do usuário:', error);
            return false;
        }
    }

    /**
     * Verifica se o usuário tem permissão de admin
     */
    function isAdmin() {
        try {
            const user = localStorage.getItem('user');
            if (!user) return false;

            const userData = JSON.parse(user);

            // Verificar se é admin (pode ajustar conforme a estrutura do seu user)
            return userData.role === 'admin' || userData.tipo === 'admin' || userData.admin === true;
        } catch (error) {
            console.error('[AUTH GUARD] Erro ao verificar permissões de admin:', error);
            return false;
        }
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
     * Executa a verificação de autenticação
     */
    function checkAuth() {
        if (!isAuthenticated()) {
            console.error('[AUTH GUARD] Acesso negado - usuário não autenticado');
            redirectToLogin();
            return false;
        }

        // Verificar se é admin - Dashboard é apenas para administradores
        if (!isAdmin()) {
            console.error('[AUTH GUARD] Acesso negado - usuário não é administrador');
            showToast('Acesso restrito a administradores. Redirecionando...', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
            return false;
        }

        console.log('[AUTH GUARD] ✓ Acesso autorizado');
        return true;
    }

    // EXECUTAR VERIFICAÇÃO IMEDIATAMENTE
    // Bloquear carregamento da página se não estiver autenticado
    if (!checkAuth()) {
        // Parar execução de outros scripts
        throw new Error('AUTH_GUARD: Acesso não autorizado');
    }

    // Expor API global (caso precise usar em outros scripts)
    window.AuthGuard = {
        isAuthenticated,
        isAdmin,
        checkAuth
    };

    console.log('[AUTH GUARD] Proteção de rota ativada');
})();
