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

        // Opcional: verificar se é admin
        // Se quiser restringir ainda mais, descomente as linhas abaixo:
        /*
        if (!isAdmin()) {
            console.error('[AUTH GUARD] Acesso negado - usuário não é administrador');
            alert('Você não tem permissão para acessar esta página.');
            window.location.href = '/';
            return false;
        }
        */

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
