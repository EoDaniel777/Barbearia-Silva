/**
 * Home Loader - Carrega serviços e barbeiros da API
 * Barbearia Silva - 2025
 */

(function() {
    'use strict';

    console.log('[HOME LOADER] Inicializado');

    // Carregar serviços ao carregar a página
    document.addEventListener('DOMContentLoaded', async () => {
        await loadServices();
        await loadBarbers();
    });

    /**
     * Carrega serviços da API
     */
    async function loadServices() {
        const container = document.getElementById('services-container');
        if (!container) return;

        try {
            console.log('[HOME LOADER] Carregando serviços...');

            // Adicionar timestamp para evitar cache
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/v1/servicos?_t=${timestamp}`);
            if (!response.ok) throw new Error('Erro ao carregar serviços');

            const servicos = await response.json();
            console.log('[HOME LOADER] Serviços carregados:', servicos.length);

            // Filtrar apenas serviços (não produtos) e limitar a 4
            const servicosParaExibir = servicos
                .filter(s => s.tipo === 'servico' && s.ativo)
                .slice(0, 4);

            if (servicosParaExibir.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum serviço disponível no momento.</p>';
                return;
            }

            // Renderizar serviços
            container.innerHTML = servicosParaExibir.map(servico => `
                <div class="service-card">
                    ${servico.foto ? `<img src="${servico.foto}" alt="${servico.nome}" class="service-image">` : ''}
                    <div class="service-content">
                        <h3 class="service-title">${servico.nome}</h3>
                        <p class="service-description">${servico.descricao || 'Serviço de qualidade profissional'}</p>
                        <div class="service-footer">
                            <span class="service-price">R$ ${servico.preco.toFixed(2)}</span>
                            <span class="service-duration">${servico.duracao} min</span>
                        </div>
                    </div>
                </div>
            `).join('');

            console.log('[HOME LOADER] ✓ Serviços renderizados');
        } catch (error) {
            console.error('[HOME LOADER] Erro ao carregar serviços:', error);
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Erro ao carregar serviços. Tente novamente mais tarde.</p>';
        }
    }

    /**
     * Carrega barbeiros da API
     */
    async function loadBarbers() {
        const container = document.getElementById('barbers-grid');
        if (!container) return;

        try {
            console.log('[HOME LOADER] Carregando barbeiros...');

            const response = await fetch('/api/v1/barbeiros');
            if (!response.ok) throw new Error('Erro ao carregar barbeiros');

            const barbeiros = await response.json();
            console.log('[HOME LOADER] Barbeiros carregados:', barbeiros.length);

            const barbeirosAtivos = barbeiros.filter(b => b.ativo);

            if (barbeirosAtivos.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum barbeiro disponível no momento.</p>';
                return;
            }

            // Renderizar barbeiros
            container.innerHTML = barbeirosAtivos.map(barbeiro => `
                <div class="barber-card">
                    ${barbeiro.foto ? `<img src="${barbeiro.foto}" alt="${barbeiro.nome}" class="barber-photo">` : '<div class="barber-photo-placeholder">👤</div>'}
                    <h3 class="barber-name">${barbeiro.nome}</h3>
                    <p class="barber-specialty">${barbeiro.especialidade || 'Barbeiro profissional'}</p>
                    ${barbeiro.descricao ? `<p class="barber-description">${barbeiro.descricao}</p>` : ''}
                </div>
            `).join('');

            console.log('[HOME LOADER] ✓ Barbeiros renderizados');
        } catch (error) {
            console.error('[HOME LOADER] Erro ao carregar barbeiros:', error);
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Erro ao carregar barbeiros.</p>';
        }
    }
})();
