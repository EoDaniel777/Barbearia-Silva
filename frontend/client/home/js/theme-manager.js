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


    /**
     * Inicializa o gerenciador de tema
     */
    function init(config = {}) {

        // Configurar elementos (incluindo body que agora já existe)
        elements.body = document.body;
        elements.checkbox = document.getElementById(config.checkboxId || 'theme-toggle-checkbox');
        elements.headerLogo = document.getElementById(config.headerLogoId || 'headerLogo');
        elements.heroLogo = document.getElementById(config.heroLogoId || 'heroLogo');
        elements.footerLogo = document.getElementById(config.footerLogoId || 'footerLogo');

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

    }

    /**
     * Configura os eventos do checkbox de tema
     */
    function setupEvents() {
        if (elements.checkbox) {
            elements.checkbox.addEventListener('change', function(e) {
                const newTheme = e.target.checked ? 'light' : 'dark';
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
                currentTheme = e.newValue;
                applyTheme(currentTheme);
            }
        });
    }

    /**
     * Alterna o tema
     */
    function toggleTheme(theme) {
        currentTheme = theme;
        applyTheme(theme);
        saveTheme(theme);
    }

    /**
     * Salva o tema no localStorage
     */
    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
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

        if (theme === 'light') {
            // Modo Claro

            if (!elements.body.classList.contains('theme-white')) {
                elements.body.classList.add('theme-white');
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

            if (elements.body.classList.contains('theme-white')) {
                elements.body.classList.remove('theme-white');
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


})();
