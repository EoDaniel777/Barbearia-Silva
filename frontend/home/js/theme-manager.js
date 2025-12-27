// Global Theme Manager for BarbeariaSilva
// This script handles theme switching across all pages

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.theme);
        this.setupToggle();
        this.setupNavigation();
    }

    applyTheme(theme) {
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');

        // Get all logo elements
        const logos = {
            header: document.getElementById('headerLogo'),
            hero: document.getElementById('heroLogo'),
            footer: document.getElementById('footerLogo'),
            page: document.getElementById('pageLogo')
        };

        if (theme === 'light') {
            body.classList.add('light-mode');
            if (themeIcon) themeIcon.src = '/icons/sun.svg';

            // Update all logos to dark version
            Object.values(logos).forEach(logo => {
                if (logo) logo.src = '/img/logoDark.jpeg';
            });
        } else {
            body.classList.remove('light-mode');
            if (themeIcon) themeIcon.src = '/icons/moon.png';

            // Update all logos to white version
            Object.values(logos).forEach(logo => {
                if (logo) logo.src = '/img/logoWhite.jpeg';
            });
        }

        this.theme = theme;
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    setupToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    setupNavigation() {
        const currentPage = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage || (currentPage === '/' && href === '/')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ThemeManager();
    });
} else {
    new ThemeManager();
}
