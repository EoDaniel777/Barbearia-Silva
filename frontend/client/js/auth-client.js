/**
 * Cliente de Autenticação para Site Público
 * Barbearia Silva - 2025
 */

(function() {
    'use strict';

    console.log('[AUTH CLIENT] Inicializando...');

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
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
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
        }, 4000);
    }

    /**
     * Verifica se o usuário está autenticado
     */
    function isAuthenticated() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        return !!(user && token);
    }

    /**
     * Obtém dados do usuário logado
     */
    function getUser() {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('[AUTH CLIENT] Erro ao ler usuário:', error);
            return null;
        }
    }

    /**
     * Realiza logout
     */
    function logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    }

    /**
     * Renderiza o header com base no estado de autenticação
     */
    function renderHeader() {
        console.log('[AUTH CLIENT] 🔍 Iniciando renderHeader()');

        const headerNav = document.querySelector('.header-nav');
        const headerActions = document.querySelector('.header-actions');

        console.log('[AUTH CLIENT] Elementos do header:', {
            headerNav: !!headerNav,
            headerActions: !!headerActions
        });

        if (!headerNav || !headerActions) {
            console.error('[AUTH CLIENT] ❌ Elementos do header não encontrados');
            return;
        }

        const authenticated = isAuthenticated();
        const user = getUser();

        console.log('[AUTH CLIENT] Estado de autenticação:', {
            isAuthenticated: authenticated,
            user: user ? { id: user.id, nome: user.nome, tipo: user.tipo } : null
        });

        if (authenticated) {
            console.log('[AUTH CLIENT] ✅ Usuário autenticado, renderizando botão de perfil');
            renderAuthenticatedHeader(headerNav, headerActions);
        } else {
            console.log('[AUTH CLIENT] 🔓 Usuário não autenticado, renderizando botão de login');
            renderGuestHeader(headerNav, headerActions);
        }
    }

    /**
     * Renderiza header para usuário autenticado
     */
    function renderAuthenticatedHeader(headerNav, headerActions) {
        console.log('[AUTH CLIENT] 🎨 Renderizando header autenticado...');
        const user = getUser();

        console.log('[AUTH CLIENT] Dados do usuário:', user);

        // Remover botão de login do nav
        const loginBtn = headerNav.querySelector('.btn-login');
        if (loginBtn) {
            console.log('[AUTH CLIENT] Removendo botão de login');
            loginBtn.remove();
        }

        // Adicionar botão de perfil no header-actions (onde estava o theme-toggle)
        // Primeiro, remover qualquer profile-dropdown existente
        const existingDropdown = headerActions.querySelector('.profile-dropdown');
        if (existingDropdown) {
            console.log('[AUTH CLIENT] Removendo dropdown existente');
            existingDropdown.remove();
        }

        // Verificar se é admin
        const isAdmin = user && (user.tipo === 'admin' || user.role === 'admin' || user.admin === true);
        console.log('[AUTH CLIENT] Tipo de usuário:', isAdmin ? 'ADMIN' : 'CLIENTE');

        const profileHtml = `
            <div class="profile-dropdown">
                <button class="profile-btn" id="client-profile-btn" aria-label="Perfil">
                    ${user && user.foto ?
                        `<img class="profile-btn-photo" src="${user.foto}" alt="Perfil" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <span class="profile-btn-initial" style="display:none;">${user.nome ? user.nome.charAt(0).toUpperCase() : '?'}</span>` :
                        `<span class="profile-btn-initial">${user && user.nome ? user.nome.charAt(0).toUpperCase() : '?'}</span>`
                    }
                </button>
                <div class="profile-menu" id="client-profile-menu">
                    <div class="profile-menu-header">
                        <strong>${user ? user.nome : 'Usuário'}</strong>
                        <small>${user ? user.email : ''}</small>
                    </div>
                    <hr>
                    ${isAdmin ? `
                        <a href="/dashboard" class="profile-menu-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Dashboard
                        </a>
                    ` : `
                        <a href="#" class="profile-menu-item" id="client-profile-edit-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Meu Perfil
                        </a>
                        <a href="/agendar" class="profile-menu-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Agendar Horário
                        </a>
                    `}
                    <hr>
                    <a href="#" class="profile-menu-item" id="client-logout-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Sair
                    </a>
                </div>
            </div>
        `;

        // Inserir antes do theme-toggle (se existir)
        const themeToggle = headerActions.querySelector('.theme-toggle-label');
        if (themeToggle) {
            themeToggle.insertAdjacentHTML('beforebegin', profileHtml);
        } else {
            headerActions.insertAdjacentHTML('beforeend', profileHtml);
        }

        // Configurar eventos
        setupProfileDropdown();
    }

    /**
     * Renderiza header para visitante (não autenticado)
     */
    function renderGuestHeader(headerNav, headerActions) {
        // Remover qualquer profile-dropdown existente
        const existingDropdown = headerActions.querySelector('.profile-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Remover botão de login que já existe no nav (vamos criar no header-actions)
        let loginBtn = headerNav.querySelector('.btn-login');
        if (loginBtn) {
            loginBtn.remove();
        }

        // Criar botão de login no header-actions (sempre no canto)
        const existingInActions = headerActions.querySelector('.btn-login-client');
        if (!existingInActions) {
            const loginHtml = '<a href="/login" class="btn-login-client">Acessar</a>';

            // Inserir antes do theme-toggle (se existir)
            const themeToggle = headerActions.querySelector('.theme-toggle-label');
            if (themeToggle) {
                themeToggle.insertAdjacentHTML('beforebegin', loginHtml);
            } else {
                headerActions.insertAdjacentHTML('beforeend', loginHtml);
            }
        }
    }

    /**
     * Configura dropdown de perfil
     */
    function setupProfileDropdown() {
        const profileBtn = document.getElementById('client-profile-btn');
        const profileMenu = document.getElementById('client-profile-menu');
        const logoutBtn = document.getElementById('client-logout-btn');
        const profileEditBtn = document.getElementById('client-profile-edit-btn');

        if (!profileBtn || !profileMenu) {
            console.error('[AUTH CLIENT] Botão ou menu de perfil não encontrado');
            return;
        }

        // Toggle profile menu
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-dropdown')) {
                profileMenu.classList.remove('active');
            }
        });

        // Editar perfil (apenas para clientes)
        if (profileEditBtn) {
            profileEditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                profileMenu.classList.remove('active');
                openProfileModal();
            });
        }

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Deseja realmente sair?')) {
                    logout();
                }
            });
        }
    }

    /**
     * Abre modal de edição de perfil (para clientes)
     */
    function openProfileModal() {
        const user = getUser();
        if (!user) return;

        showToast('Modal de edição de perfil em desenvolvimento! Em breve você poderá editar: Nome, Email, Telefone, Foto e Senha.', 'info');
        // TODO: Implementar modal completo de edição de perfil
    }

    /**
     * Inicialização
     */
    function init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderHeader);
        } else {
            renderHeader();
        }
    }

    // Expor API global
    window.AuthClient = {
        isAuthenticated,
        getUser,
        logout,
        renderHeader
    };

    console.log('[AUTH CLIENT] API exposta globalmente');

    // Inicializar
    init();
})();
