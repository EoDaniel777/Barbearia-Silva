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
            body: null,
            checkbox: null,
            logos: {
                header: null,
                hero: null,
                footer: null
            }
        };

        console.log('[THEME MANAGER] Construtor executado. Tema atual:', this.currentTheme);
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
        console.log('[THEME MANAGER] Tema salvo:', theme);

        // Disparar evento customizado para outras abas/janelas
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    /**
     * Inicializa o gerenciador de tema
     * @param {Object} config - Configuração com seletores dos elementos
     */
    init(config = {}) {
        console.log('[THEME MANAGER] Inicializando com config:', config);

        // Configurar body (agora que o DOM está pronto)
        this.elements.body = document.body;

        // Configurar elementos
        this.elements.checkbox = document.getElementById(config.checkboxId || 'theme-toggle-checkbox');
        this.elements.logos.header = document.getElementById(config.headerLogoId || 'headerLogo');
        this.elements.logos.hero = document.getElementById(config.heroLogoId || 'heroLogo');
        this.elements.logos.footer = document.getElementById(config.footerLogoId || 'footerLogo');

        console.log('[THEME MANAGER] Elementos configurados:', {
            body: !!this.elements.body,
            checkbox: !!this.elements.checkbox,
            headerLogo: !!this.elements.logos.header,
            heroLogo: !!this.elements.logos.hero,
            footerLogo: !!this.elements.logos.footer
        });

        // Aplicar tema atual
        console.log('[THEME MANAGER] Aplicando tema inicial:', this.currentTheme);
        this.applyTheme(this.currentTheme);

        // Configurar eventos
        this.setupEvents();

        // Sincronizar com outras abas
        this.setupStorageSync();

        console.log('[THEME MANAGER] ✓ Inicialização concluída');
    }

    /**
     * Configura os eventos do checkbox de tema
     */
    setupEvents() {
        if (this.elements.checkbox) {
            console.log('[THEME MANAGER] Checkbox encontrado, adicionando listener');
            this.elements.checkbox.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'light' : 'dark';
                console.log('[THEME MANAGER] ✓ Checkbox alterado! Novo tema:', newTheme);
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
                console.log('[THEME MANAGER] Tema alterado em outra aba:', e.newValue);
                this.currentTheme = e.newValue;
                this.applyTheme(this.currentTheme);
            }
        });

        // Escutar evento customizado (mesma aba)
        window.addEventListener('themeChanged', (e) => {
            console.log('[THEME MANAGER] Evento themeChanged recebido:', e.detail.theme);
        });
    }

    /**
     * Alterna o tema
     * @param {string} theme - 'light' ou 'dark'
     */
    toggleTheme(theme) {
        console.log('[THEME MANAGER] ► toggleTheme chamado com:', theme);
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        console.log('[THEME MANAGER] ✓ Tema alternado para:', theme);
    }

    /**
     * Aplica o tema na página
     * @param {string} theme - 'light' ou 'dark'
     */
    applyTheme(theme) {
        console.log('[THEME MANAGER] ► Aplicando tema:', theme);

        const { body, checkbox, logos } = this.elements;

        if (!body) {
            console.error('[THEME MANAGER] ❌ Body não disponível. Inicialize com init() primeiro.');
            return;
        }

        if (theme === 'light') {
            // Modo Claro
            console.log('[THEME MANAGER] Aplicando modo CLARO');
            console.log('[THEME MANAGER] Body antes:', body.className);

            if (!body.classList.contains('theme-white')) {
                body.classList.add('theme-white');
                console.log('[THEME MANAGER] ✓ Classe "theme-white" adicionada');
            } else {
                console.log('[THEME MANAGER] Classe "theme-white" já existe');
            }

            console.log('[THEME MANAGER] Body depois:', body.className);

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
            console.log('[THEME MANAGER] Aplicando modo ESCURO');
            console.log('[THEME MANAGER] Body antes:', body.className);

            if (body.classList.contains('theme-white')) {
                body.classList.remove('theme-white');
                console.log('[THEME MANAGER] ✓ Classe "theme-white" removida');
            } else {
                console.log('[THEME MANAGER] Classe "theme-white" não existe');
            }

            console.log('[THEME MANAGER] Body depois:', body.className);

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

        console.log('[THEME MANAGER] ✓ Tema aplicado com sucesso. Tema atual:', this.currentTheme);
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

// Expor globalmente com debug
if (typeof window !== 'undefined') {
    window.ThemeManager = themeManager;
    console.log('[THEME MANAGER] Expondo globalmente:', {
        ThemeManager: typeof window.ThemeManager,
        hasInit: typeof window.ThemeManager.init === 'function',
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(window.ThemeManager))
    });
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
