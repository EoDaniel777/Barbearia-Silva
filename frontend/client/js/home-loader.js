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
        console.log('[HOME LOADER] 🔍 Iniciando loadServices()');
        const container = document.getElementById('services-container');

        if (!container) {
            console.error('[HOME LOADER] ❌ Container #services-container não encontrado no DOM');
            return;
        }
        console.log('[HOME LOADER] ✓ Container encontrado:', container);

        try {
            console.log('[HOME LOADER] 📡 Iniciando fetch de serviços...');

            // Adicionar timestamp para evitar cache
            const timestamp = new Date().getTime();
            const url = `/api/v1/servicos?_t=${timestamp}`;
            console.log('[HOME LOADER] URL da requisição:', url);

            const response = await fetch(url);
            console.log('[HOME LOADER] Response status:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const servicos = await response.json();
            console.log('[HOME LOADER] 📦 Dados recebidos da API:');
            console.log('[HOME LOADER] - Total de registros:', servicos.length);
            console.log('[HOME LOADER] - Dados completos:', servicos);

            // Filtrar apenas serviços (não produtos) e limitar a 6
            const servicosParaExibir = servicos
                .filter(s => s.tipo === 'servico' && s.ativo)
                .slice(0, 6);

            console.log('[HOME LOADER] 🔎 Após filtros (tipo=servico, ativo=true, limite=6):');
            console.log('[HOME LOADER] - Serviços filtrados:', servicosParaExibir.length);
            console.log('[HOME LOADER] - Serviços que serão exibidos:', servicosParaExibir);

            if (servicosParaExibir.length === 0) {
                console.warn('[HOME LOADER] ⚠️ Nenhum serviço ativo encontrado');
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum serviço disponível no momento.</p>';
                return;
            }

            // Renderizar serviços
            console.log('[HOME LOADER] 🎨 Renderizando', servicosParaExibir.length, 'cards...');
            container.innerHTML = servicosParaExibir.map((servico, index) => {
                console.log(`[HOME LOADER] - Card ${index + 1}:`, {
                    nome: servico.nome,
                    preco: servico.preco,
                    duracao: servico.duracao,
                    temFoto: !!servico.foto
                });

                return `
                    <div class="modern-card">
                        <img src="${servico.foto || '/img/meta.jpg'}" alt="${servico.nome}" class="card-image">
                        <div class="card-content">
                            <h3 class="card-title">${servico.nome}</h3>
                            <p class="card-description">${servico.descricao || 'Serviço de qualidade profissional'}</p>
                            <div class="card-footer">
                                <span class="card-price">R$ ${servico.preco.toFixed(2).replace('.', ',')}</span>
                                <span class="card-duration">⏱️ ${servico.duracao} min</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            console.log('[HOME LOADER] ✅ Serviços renderizados com sucesso!');
        } catch (error) {
            console.error('[HOME LOADER] ❌ ERRO ao carregar serviços:');
            console.error('[HOME LOADER] - Tipo:', error.name);
            console.error('[HOME LOADER] - Mensagem:', error.message);
            console.error('[HOME LOADER] - Stack:', error.stack);
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Erro ao carregar serviços. Tente novamente mais tarde.</p>';
        }
    }

    /**
     * Carrega barbeiros da API
     */
    async function loadBarbers() {
        console.log('[HOME LOADER] 🔍 Iniciando loadBarbers()');
        const container = document.getElementById('barbers-grid');

        if (!container) {
            console.warn('[HOME LOADER] ⚠️ Container #barbers-grid não encontrado (normal se não estiver na página atual)');
            return;
        }
        console.log('[HOME LOADER] ✓ Container de barbeiros encontrado:', container);

        try {
            console.log('[HOME LOADER] 📡 Buscando barbeiros...');
            const response = await fetch('/api/v1/barbeiros');
            console.log('[HOME LOADER] Response status:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const barbeiros = await response.json();
            console.log('[HOME LOADER] 📦 Barbeiros recebidos:');
            console.log('[HOME LOADER] - Total:', barbeiros.length);
            console.log('[HOME LOADER] - Dados:', barbeiros);

            const barbeirosAtivos = barbeiros.filter(b => b.ativo);
            console.log('[HOME LOADER] - Barbeiros ativos:', barbeirosAtivos.length);

            if (barbeirosAtivos.length === 0) {
                console.warn('[HOME LOADER] ⚠️ Nenhum barbeiro ativo encontrado');
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum barbeiro disponível no momento.</p>';
                return;
            }

            // Renderizar barbeiros
            console.log('[HOME LOADER] 🎨 Renderizando barbeiros...');
            container.innerHTML = barbeirosAtivos.map((barbeiro, index) => {
                console.log(`[HOME LOADER] - Barbeiro ${index + 1}:`, {
                    nome: barbeiro.nome,
                    especialidade: barbeiro.especialidade,
                    temFoto: !!barbeiro.foto
                });

                return `
                    <div class="barber-card">
                        ${barbeiro.foto ? `<img src="${barbeiro.foto}" alt="${barbeiro.nome}" class="barber-photo">` : '<div class="barber-photo-placeholder">👤</div>'}
                        <h3 class="barber-name">${barbeiro.nome}</h3>
                        <p class="barber-specialty">${barbeiro.especialidade || 'Barbeiro profissional'}</p>
                        ${barbeiro.descricao ? `<p class="barber-description">${barbeiro.descricao}</p>` : ''}
                    </div>
                `;
            }).join('');

            console.log('[HOME LOADER] ✅ Barbeiros renderizados com sucesso!');
        } catch (error) {
            console.error('[HOME LOADER] ❌ ERRO ao carregar barbeiros:');
            console.error('[HOME LOADER] - Tipo:', error.name);
            console.error('[HOME LOADER] - Mensagem:', error.message);
            console.error('[HOME LOADER] - Stack:', error.stack);
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Erro ao carregar barbeiros.</p>';
        }
    }
})();
