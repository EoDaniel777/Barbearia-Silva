/**
 * Carregador de Personalização - Sistema Barbearia
 * Carrega e aplica configurações de personalização na home page
 * 2026
 */

(function() {
    'use strict';

    console.log('[PERSONALIZAÇÃO LOADER] Inicializando...');

    let personalizacaoConfig = null;

    /**
     * Carrega as configurações de personalização do backend
     */
    async function loadPersonalizacao() {
        try {
            console.log('[PERSONALIZAÇÃO LOADER] Buscando configurações...');

            const response = await fetch('/api/v1/personalizacao');
            if (!response.ok) {
                throw new Error('Erro ao carregar personalização');
            }

            personalizacaoConfig = await response.json();
            console.log('[PERSONALIZAÇÃO LOADER] Configurações carregadas:', personalizacaoConfig);

            // Aplicar todas as personalizações
            aplicarCores();
            aplicarLogos();
            aplicarTextos();
            aplicarBanner();
            aplicarRedesSociais();

            console.log('[PERSONALIZAÇÃO LOADER] ✓ Personalizações aplicadas');

        } catch (error) {
            console.error('[PERSONALIZAÇÃO LOADER] Erro ao carregar:', error);
            // Em caso de erro, continuar com valores padrão
        }
    }

    /**
     * Aplica as cores personalizadas via CSS Variables
     */
    function aplicarCores() {
        if (!personalizacaoConfig) {
            console.warn('[PERSONALIZAÇÃO LOADER] ⚠ Configuração não carregada, usando cores padrão');
            return;
        }

        const root = document.documentElement;

        if (personalizacaoConfig.cor_primaria) {
            root.style.setProperty('--cor-primaria', personalizacaoConfig.cor_primaria);
            root.style.setProperty('--primary', personalizacaoConfig.cor_primaria);
            root.style.setProperty('--primary-color', personalizacaoConfig.cor_primaria);
            console.log('[PERSONALIZAÇÃO LOADER] Cor primária aplicada:', personalizacaoConfig.cor_primaria);
        }

        if (personalizacaoConfig.cor_secundaria) {
            root.style.setProperty('--cor-secundaria', personalizacaoConfig.cor_secundaria);
            root.style.setProperty('--secondary', personalizacaoConfig.cor_secundaria);
            root.style.setProperty('--primary-dark', personalizacaoConfig.cor_secundaria);
            console.log('[PERSONALIZAÇÃO LOADER] Cor secundária aplicada:', personalizacaoConfig.cor_secundaria);
        }

        if (personalizacaoConfig.cor_destaque) {
            root.style.setProperty('--cor-destaque', personalizacaoConfig.cor_destaque);
            root.style.setProperty('--accent', personalizacaoConfig.cor_destaque);
            console.log('[PERSONALIZAÇÃO LOADER] Cor destaque aplicada:', personalizacaoConfig.cor_destaque);
        }

        if (personalizacaoConfig.cor_header) {
            root.style.setProperty('--cor-header', personalizacaoConfig.cor_header);
            root.style.setProperty('--bg-dark', personalizacaoConfig.cor_header);
            console.log('[PERSONALIZAÇÃO LOADER] Cor header aplicada:', personalizacaoConfig.cor_header);
        }

        if (personalizacaoConfig.cor_texto) {
            root.style.setProperty('--cor-texto', personalizacaoConfig.cor_texto);
            root.style.setProperty('--text-dark', personalizacaoConfig.cor_texto);
        }

        if (personalizacaoConfig.cor_texto_claro) {
            root.style.setProperty('--cor-texto-claro', personalizacaoConfig.cor_texto_claro);
            root.style.setProperty('--text-light', personalizacaoConfig.cor_texto_claro);
        }

        console.log('[PERSONALIZAÇÃO LOADER] ✓ Cores aplicadas com sucesso');
        console.log('[PERSONALIZAÇÃO LOADER] Variáveis CSS atualizadas:', {
            '--cor-primaria': getComputedStyle(root).getPropertyValue('--cor-primaria'),
            '--cor-secundaria': getComputedStyle(root).getPropertyValue('--cor-secundaria'),
            '--cor-destaque': getComputedStyle(root).getPropertyValue('--cor-destaque'),
            '--cor-header': getComputedStyle(root).getPropertyValue('--cor-header')
        });
    }

    /**
     * Aplica logos personalizadas (escuro e claro)
     */
    function aplicarLogos() {
        if (!personalizacaoConfig) return;

        // Logo do header
        const headerLogo = document.getElementById('headerLogo');
        if (headerLogo && personalizacaoConfig.logo_escuro) {
            headerLogo.src = personalizacaoConfig.logo_escuro;
            console.log('[PERSONALIZAÇÃO LOADER] Logo do header atualizada');
        }

        // Logo da hero section
        const heroLogo = document.getElementById('heroLogo');
        if (heroLogo && personalizacaoConfig.logo_escuro) {
            heroLogo.src = personalizacaoConfig.logo_escuro;
            console.log('[PERSONALIZAÇÃO LOADER] Logo da hero section atualizada');
        }

        // Logo do footer
        const footerLogo = document.getElementById('footerLogo');
        if (footerLogo && personalizacaoConfig.logo_escuro) {
            footerLogo.src = personalizacaoConfig.logo_escuro;
            console.log('[PERSONALIZAÇÃO LOADER] Logo do footer atualizada');
        }

        // Atualizar favicon se disponível
        if (personalizacaoConfig.favicon) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = personalizacaoConfig.favicon;
            console.log('[PERSONALIZAÇÃO LOADER] Favicon atualizado');
        }

        console.log('[PERSONALIZAÇÃO LOADER] ✓ Logos aplicadas');
    }

    /**
     * Aplica textos personalizados
     */
    function aplicarTextos() {
        if (!personalizacaoConfig) return;

        // Título do site (meta title)
        if (personalizacaoConfig.titulo_site) {
            document.title = personalizacaoConfig.titulo_site;
        }

        // Atualizar meta description
        if (personalizacaoConfig.descricao_seo) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = personalizacaoConfig.descricao_seo;
        }

        // Atualizar meta keywords
        if (personalizacaoConfig.palavras_chave) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.content = personalizacaoConfig.palavras_chave;
        }

        // Atualizar texto do botão de agendar
        if (personalizacaoConfig.texto_botao_agendar) {
            const botoes = document.querySelectorAll('.btn-agendar, .hero-btn, [href="/agendar"]');
            botoes.forEach(btn => {
                if (btn.textContent.includes('Agendar')) {
                    btn.textContent = personalizacaoConfig.texto_botao_agendar;
                }
            });
        }

        console.log('[PERSONALIZAÇÃO LOADER] ✓ Textos aplicados');
    }

    /**
     * Aplica personalização do banner/hero
     */
    function aplicarBanner() {
        if (!personalizacaoConfig) return;

        const hero = document.querySelector('.hero, .banner, .hero-section');

        // Atualizar título do banner
        if (personalizacaoConfig.banner_titulo) {
            const heroTitle = document.querySelector('.hero-title, .banner-title, h1');
            if (heroTitle && (heroTitle.closest('.hero') || heroTitle.closest('.banner') || heroTitle.closest('.hero-section'))) {
                heroTitle.textContent = personalizacaoConfig.banner_titulo;
            }
        }

        // Atualizar subtítulo do banner
        if (personalizacaoConfig.banner_subtitulo) {
            const heroSubtitle = document.querySelector('.hero-subtitle, .banner-subtitle');
            if (heroSubtitle) {
                heroSubtitle.textContent = personalizacaoConfig.banner_subtitulo;
            }
        }

        if (hero) {
            // Aplicar altura do banner
            if (personalizacaoConfig.banner_altura) {
                const alturas = {
                    'pequeno': '300px',
                    'medio': '500px',
                    'grande': '700px'
                };
                const altura = alturas[personalizacaoConfig.banner_altura] || '500px';
                hero.style.minHeight = altura;
            }

            // Aplicar imagem de fundo do banner
            if (personalizacaoConfig.banner_imagem && personalizacaoConfig.banner_imagem.length > 10) {
                console.log('[PERSONALIZAÇÃO LOADER] Aplicando imagem de banner, tamanho:', personalizacaoConfig.banner_imagem.length);
                hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${personalizacaoConfig.banner_imagem})`;
                hero.style.backgroundSize = 'cover';
                hero.style.backgroundPosition = 'center';
                hero.style.backgroundRepeat = 'no-repeat';
                console.log('[PERSONALIZAÇÃO LOADER] ✓ Imagem de fundo aplicada ao banner');
            } else {
                console.log('[PERSONALIZAÇÃO LOADER] Sem imagem de banner ou imagem vazia');
            }
        }

        console.log('[PERSONALIZAÇÃO LOADER] ✓ Banner personalizado');
    }

    /**
     * Aplica links de redes sociais com ícones Font Awesome
     */
    function aplicarRedesSociais() {
        if (!personalizacaoConfig) return;

        // Verificar se deve exibir redes sociais
        if (!personalizacaoConfig.exibir_redes_sociais) {
            const socialContainer = document.querySelector('.social-media, .redes-sociais');
            if (socialContainer) {
                socialContainer.style.display = 'none';
            }
            return;
        }

        // Usar container de redes sociais que já existe no HTML
        const socialContainer = document.querySelector('.social-media');

        if (!socialContainer) {
            console.log('[PERSONALIZAÇÃO LOADER] Container .social-media não encontrado');
            return;
        }

        // Aplicar estilo ao container
        socialContainer.style.cssText = `
            display: flex;
            gap: 16px;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
        `;

        // Limpar container
        socialContainer.innerHTML = '';

        const redesSociais = [];

        // Instagram
        if (personalizacaoConfig.instagram) {
            let username = personalizacaoConfig.instagram;
            let url = personalizacaoConfig.instagram;

            if (username.startsWith('@')) {
                username = username.substring(1);
                url = `https://instagram.com/${username}`;
            } else if (username.startsWith('http')) {
                const match = username.match(/instagram\.com\/([^\/\?]+)/);
                if (match) username = match[1];
            }

            redesSociais.push({
                faIcon: 'fa-brands fa-instagram',
                url,
                name: 'Instagram',
                username: `@${username}`,
                color: '#E1306C'
            });
        }

        // Facebook
        if (personalizacaoConfig.facebook) {
            let displayName = 'Facebook';
            const match = personalizacaoConfig.facebook.match(/facebook\.com\/([^\/\?]+)/);
            if (match) displayName = match[1];

            redesSociais.push({
                faIcon: 'fa-brands fa-facebook',
                url: personalizacaoConfig.facebook,
                name: 'Facebook',
                username: displayName,
                color: '#1877F2'
            });
        }

        // TikTok
        if (personalizacaoConfig.tiktok) {
            let username = personalizacaoConfig.tiktok;
            let url = personalizacaoConfig.tiktok;

            if (username.startsWith('@')) {
                username = username.substring(1);
                url = `https://tiktok.com/@${username}`;
            } else if (username.startsWith('http')) {
                const match = username.match(/tiktok\.com\/@([^\/\?]+)/);
                if (match) username = match[1];
            }

            redesSociais.push({
                faIcon: 'fa-brands fa-tiktok',
                url,
                name: 'TikTok',
                username: `@${username}`,
                color: '#000000'
            });
        }

        // YouTube
        if (personalizacaoConfig.youtube) {
            let displayName = 'YouTube';
            const match = personalizacaoConfig.youtube.match(/youtube\.com\/(c\/|@|channel\/)?([^\/\?]+)/);
            if (match) displayName = match[2];

            redesSociais.push({
                faIcon: 'fa-brands fa-youtube',
                url: personalizacaoConfig.youtube,
                name: 'YouTube',
                username: displayName,
                color: '#FF0000'
            });
        }

        // WhatsApp - REMOVIDO (não incluir nas redes sociais do footer)

        // Adicionar links ao container
        redesSociais.forEach(rede => {
            const link = document.createElement('a');
            link.href = rede.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.title = rede.name;
            link.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
                color: var(--text-light, #FFFFFF);
                font-size: 14px;
                padding: 8px 16px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.05);
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;

            link.innerHTML = `
                <i class="${rede.faIcon}" style="font-size: 20px; color: ${rede.color};"></i>
                <span>${rede.username}</span>
            `;

            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-3px)';
                link.style.background = 'rgba(255, 255, 255, 0.1)';
                link.style.borderColor = rede.color;
            });

            link.addEventListener('mouseleave', () => {
                link.style.transform = 'translateY(0)';
                link.style.background = 'rgba(255, 255, 255, 0.05)';
                link.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            });

            socialContainer.appendChild(link);
        });

        console.log('[PERSONALIZAÇÃO LOADER] ✓ Redes sociais aplicadas');
    }


    // Expor API global
    window.PersonalizacaoLoader = {
        load: loadPersonalizacao,
        getConfig: () => personalizacaoConfig
    };

    // Carregar automaticamente quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPersonalizacao);
    } else {
        loadPersonalizacao();
    }

    console.log('[PERSONALIZAÇÃO LOADER] API exposta globalmente');
})();
