/**
 * Theme Manager - Sistema de Tema Global
 * Sincroniza o tema entre todas as páginas do site
 * Barbearia Silva - 2025
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'barbearia-theme';
        this.currentTheme = this.loadTheme();
        this.elements = {
            body: document.body,
            checkbox: null,
            logos: {
                header: null,
                hero: null,
                footer: null
            }
        };

    }

    /**
     * Carrega o tema salvo do localStorage
     * @returns {string} 'light' ou 'dark'
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(this.THEME_KEY);
        return savedTheme || 'dark'; // Dark é o padrão
    }

    /**
     * Salva o tema no localStorage
     * @param {string} theme - 'light' ou 'dark'
     */
    saveTheme(theme) {
        localStorage.setItem(this.THEME_KEY, theme);

        // Disparar evento customizado para outras abas/janelas
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    /**
     * Inicializa o gerenciador de tema
     * @param {Object} config - Configuração com seletores dos elementos
     */
    init(config = {}) {

        // Configurar elementos
        this.elements.checkbox = document.getElementById(config.checkboxId || 'theme-toggle-checkbox');
        this.elements.logos.header = document.getElementById(config.headerLogoId || 'headerLogo');
        this.elements.logos.hero = document.getElementById(config.heroLogoId || 'heroLogo');
        this.elements.logos.footer = document.getElementById(config.footerLogoId || 'footerLogo');

            checkbox: !!this.elements.checkbox,
            headerLogo: !!this.elements.logos.header,
            heroLogo: !!this.elements.logos.hero,
            footerLogo: !!this.elements.logos.footer
        });

        // Aplicar tema atual
        this.applyTheme(this.currentTheme);

        // Configurar eventos
        this.setupEvents();

        // Sincronizar com outras abas
        this.setupStorageSync();

    }

    /**
     * Configura os eventos do checkbox de tema
     */
    setupEvents() {
        if (this.elements.checkbox) {
            this.elements.checkbox.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'light' : 'dark';
                this.toggleTheme(newTheme);
            });
        } else {
            console.warn('[THEME MANAGER] ⚠ Checkbox NÃO encontrado! Verifique o ID');
        }
    }

    /**
     * Sincroniza o tema entre abas/janelas do navegador
     */
    setupStorageSync() {
        // Escutar mudanças no localStorage de outras abas
        window.addEventListener('storage', (e) => {
            if (e.key === this.THEME_KEY && e.newValue) {
                this.currentTheme = e.newValue;
                this.applyTheme(this.currentTheme);
            }
        });

        // Escutar evento customizado (mesma aba)
        window.addEventListener('themeChanged', (e) => {
        });
    }

    /**
     * Alterna o tema
     * @param {string} theme - 'light' ou 'dark'
     */
    toggleTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
    }

    /**
     * Aplica o tema na página
     * @param {string} theme - 'light' ou 'dark'
     */
    applyTheme(theme) {

        const { body, checkbox, logos } = this.elements;

        if (theme === 'light') {
            // Modo Claro

            if (!body.classList.contains('theme-white')) {
                body.classList.add('theme-white');
            } else {
            }


            if (checkbox) {
                checkbox.checked = true;
            }

            // Atualizar logos para modo claro
            this.updateLogos({
                header: '/img/logoWhite.jpeg',
                hero: '/img/logoSemFundo.png',
                footer: '/img/SemFundoBlack.png'
            });

        } else {
            // Modo Escuro

            if (body.classList.contains('theme-white')) {
                body.classList.remove('theme-white');
            } else {
            }


            if (checkbox) {
                checkbox.checked = false;
            }

            // Atualizar logos para modo escuro
            this.updateLogos({
                header: '/img/logoSemFundo.png',
                hero: '/img/logoSemFundo.png',
                footer: '/img/logoSemFundo.png'
            });
        }

    }

    /**
     * Atualiza as logos conforme o tema
     * @param {Object} logos - Objeto com paths das logos
     */
    updateLogos(logos) {
        if (this.elements.logos.header && logos.header) {
            this.elements.logos.header.src = logos.header;
        }
        if (this.elements.logos.hero && logos.hero) {
            this.elements.logos.hero.src = logos.hero;
        }
        if (this.elements.logos.footer && logos.footer) {
            this.elements.logos.footer.src = logos.footer;
        }
    }

    /**
     * Retorna o tema atual
     * @returns {string}
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Verifica se está no modo claro
     * @returns {boolean}
     */
    isLightMode() {
        return this.currentTheme === 'light';
    }

    /**
     * Verifica se está no modo escuro
     * @returns {boolean}
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Criar instância global
const themeManager = new ThemeManager();

// Expor globalmente
if (typeof window !== 'undefined') {
    window.ThemeManager = themeManager;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
