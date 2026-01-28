/**
 * Theme Manager - Sistema de Tema Global
 * Sincroniza o tema entre todas as páginas do site
 * Barbearia Silva - 2025
 */

(function() {
    'use strict';

    const THEME_KEY = 'barbearia-theme';
    let currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
    let elements = {
        body: null,
        checkbox: null,
        headerLogo: null,
        heroLogo: null,
        footerLogo: null
    };

    console.log('[THEME MANAGER] Inicializado. Tema atual:', currentTheme);

    /**
     * Inicializa o gerenciador de tema
     */
    function init(config = {}) {
        console.log('[THEME MANAGER] Inicializando com config:', config);

        // Configurar elementos (incluindo body que agora já existe)
        elements.body = document.body;
        elements.checkbox = document.getElementById(config.checkboxId || 'theme-toggle-checkbox');
        elements.headerLogo = document.getElementById(config.headerLogoId || 'headerLogo');
        elements.heroLogo = document.getElementById(config.heroLogoId || 'heroLogo');
        elements.footerLogo = document.getElementById(config.footerLogoId || 'footerLogo');

        console.log('[THEME MANAGER] Elementos configurados:', {
            checkbox: !!elements.checkbox,
            headerLogo: !!elements.headerLogo,
            heroLogo: !!elements.heroLogo,
            footerLogo: !!elements.footerLogo
        });

        // Aplicar tema inicial
        applyTheme(currentTheme);

        // Configurar eventos
        setupEvents();

        // Sincronizar com outras abas
        setupStorageSync();

        console.log('[THEME MANAGER] ✓ Inicialização concluída');
    }

    /**
     * Configura os eventos do checkbox de tema
     */
    function setupEvents() {
        if (elements.checkbox) {
            console.log('[THEME MANAGER] Checkbox encontrado, adicionando listener');
            elements.checkbox.addEventListener('change', function(e) {
                const newTheme = e.target.checked ? 'light' : 'dark';
                console.log('[THEME MANAGER] ✓ Checkbox alterado! Novo tema:', newTheme);
                toggleTheme(newTheme);
            });
        } else {
            console.warn('[THEME MANAGER] ⚠ Checkbox NÃO encontrado');
        }
    }

    /**
     * Sincroniza o tema entre abas/janelas do navegador
     */
    function setupStorageSync() {
        // Escutar mudanças no localStorage de outras abas
        window.addEventListener('storage', function(e) {
            if (e.key === THEME_KEY && e.newValue) {
                console.log('[THEME MANAGER] Tema alterado em outra aba:', e.newValue);
                currentTheme = e.newValue;
                applyTheme(currentTheme);
            }
        });
    }

    /**
     * Alterna o tema
     */
    function toggleTheme(theme) {
        console.log('[THEME MANAGER] ► toggleTheme chamado com:', theme);
        currentTheme = theme;
        applyTheme(theme);
        saveTheme(theme);
        console.log('[THEME MANAGER] ✓ Tema alternado para:', theme);
    }

    /**
     * Salva o tema no localStorage
     */
    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        console.log('[THEME MANAGER] Tema salvo:', theme);
    }

    /**
     * Adiciona cache busting às URLs de logos
     */
    function addCacheBuster(url) {
        // Adicionar timestamp para evitar cache
        const timestamp = new Date().getTime();
        return `${url}?v=${timestamp}`;
    }

    /**
     * Aplica o tema na página
     */
    function applyTheme(theme) {
        console.log('[THEME MANAGER] ► Aplicando tema:', theme);

        if (theme === 'light') {
            // Modo Claro
            console.log('[THEME MANAGER] Aplicando modo CLARO');

            if (!elements.body.classList.contains('theme-white')) {
                elements.body.classList.add('theme-white');
                console.log('[THEME MANAGER] ✓ Classe "theme-white" adicionada');
            }

            if (elements.checkbox) {
                elements.checkbox.checked = true;
            }

            // Atualizar logos com cache busting
            // Usa logoWhite.jpeg que é editável pelo admin
            updateLogos({
                header: addCacheBuster('/img/SemFundoBlack.png'),
                hero: addCacheBuster('/img/logoWhite.jpeg'),
                footer: addCacheBuster('/img/SemFundoBlack.png')
            });

        } else {
            // Modo Escuro
            console.log('[THEME MANAGER] Aplicando modo ESCURO');

            if (elements.body.classList.contains('theme-white')) {
                elements.body.classList.remove('theme-white');
                console.log('[THEME MANAGER] ✓ Classe "theme-white" removida');
            }

            if (elements.checkbox) {
                elements.checkbox.checked = false;
            }

            // Atualizar logos com cache busting
            // Usa logoDark.jpeg que é editável pelo admin
            updateLogos({
                header: addCacheBuster('/img/logoSemFundo.png'),
                hero: addCacheBuster('/img/logoSemFundo.png'),
                footer: addCacheBuster('/img/logoSemFundo.png')
            });
        }

        console.log('[THEME MANAGER] ✓ Tema aplicado. Body classes:', elements.body.className);
    }

    /**
     * Atualiza as logos conforme o tema
     */
    function updateLogos(logos) {
        if (elements.headerLogo && logos.header) {
            elements.headerLogo.src = logos.header;
        }
        if (elements.heroLogo && logos.hero) {
            elements.heroLogo.src = logos.hero;
        }
        if (elements.footerLogo && logos.footer) {
            elements.footerLogo.src = logos.footer;
        }
    }

    /**
     * Retorna o tema atual
     */
    function getCurrentTheme() {
        return currentTheme;
    }

    /**
     * Verifica se está no modo claro
     */
    function isLightMode() {
        return currentTheme === 'light';
    }

    /**
     * Verifica se está no modo escuro
     */
    function isDarkMode() {
        return currentTheme === 'dark';
    }

    // Expor API global
    window.ThemeManager = {
        init: init,
        toggleTheme: toggleTheme,
        getCurrentTheme: getCurrentTheme,
        isLightMode: isLightMode,
        isDarkMode: isDarkMode
    };

    console.log('[THEME MANAGER] API exposta globalmente');

})();
