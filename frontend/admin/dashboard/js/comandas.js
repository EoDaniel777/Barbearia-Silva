// ===================================
// SISTEMA DE COMANDAS / PDV
// ===================================

let comandaAtual = null;
let barbeirosCache = [];
let servicosCache = [];

// Carregar página de comandas
async function loadComandas() {
    try {
        // Carregar dados auxiliares (barbeiros e serviços)
        await carregarDadosAuxiliares();

        // Carregar comandas abertas
        await carregarComandasAbertas();

        // Carregar resumo do dia
        await carregarResumoDia();

        // Carregar histórico
        await carregarHistoricoComandas();
    } catch (error) {
        console.error('Erro ao carregar comandas:', error);
    }
}

// Carregar barbeiros e serviços
async function carregarDadosAuxiliares() {
    try {
        // Barbeiros
        const resBarbeiros = await fetch('/api/v1/barbeiros');
        barbeirosCache = await resBarbeiros.json();

        // Serviços e produtos
        const resServicos = await fetch('/api/v1/servicos');
        servicosCache = await resServicos.json();
    } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
    }
}

// Carregar comandas abertas
async function carregarComandasAbertas() {
    try {
        const response = await fetch('/api/v1/comandas?status=aberta');
        const comandas = await response.json();

        const container = document.getElementById('comandas-abertas-list');

        if (comandas.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma comanda aberta</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cliente</th>
                        <th>Barbeiro</th>
                        <th>Total</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${comandas.map(cmd => `
                        <tr>
                            <td>#${cmd.id}</td>
                            <td>${cmd.clienteNome}</td>
                            <td>${cmd.barbeiroNome || '-'}</td>
                            <td>R$ ${cmd.total.toFixed(2)}</td>
                            <td class="table-actions">
                                <button class="btn-icon edit" onclick="gerenciarComanda(${cmd.id})" title="Gerenciar">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Erro ao carregar comandas abertas:', error);
    }
}

// Carregar resumo do dia
async function carregarResumoDia() {
    try {
        const response = await fetch('/api/v1/comandas/relatorio/dia');
        const resumo = await response.json();

        document.getElementById('resumo-abertas').textContent = resumo.comandasAbertas || 0;
        document.getElementById('resumo-fechadas').textContent = resumo.comandasFechadas || 0;
        document.getElementById('resumo-receita').textContent = `R$ ${(resumo.receitaTotal || 0).toFixed(2)}`;
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
    }
}

// Carregar histórico de comandas
async function carregarHistoricoComandas() {
    try {
        const response = await fetch('/api/v1/comandas');
        const comandas = await response.json();

        const container = document.getElementById('comandas-historico-list');

        // Filtrar apenas fechadas e canceladas para o histórico
        const historico = comandas.filter(cmd => cmd.status === 'fechada' || cmd.status === 'cancelada');

        if (historico.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma comanda no histórico</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cliente</th>
                        <th>Barbeiro</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Data Fechamento</th>
                    </tr>
                </thead>
                <tbody>
                    ${historico.slice(0, 20).map(cmd => `
                        <tr>
                            <td>#${cmd.id}</td>
                            <td>${cmd.clienteNome}</td>
                            <td>${cmd.barbeiroNome || '-'}</td>
                            <td>R$ ${cmd.total.toFixed(2)}</td>
                            <td><span class="status-badge ${cmd.status}">${cmd.status}</span></td>
                            <td>${cmd.dataFechamento ? new Date(cmd.dataFechamento).toLocaleString('pt-BR') : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

// Abrir modal de nova comanda
function abrirNovaComanda() {
    // Preencher select de barbeiros
    const select = document.getElementById('comanda-barbeiro');
    select.innerHTML = '<option value="">Selecione o barbeiro</option>';
    barbeirosCache.forEach(barb => {
        if (barb.ativo) {
            select.innerHTML += `<option value="${barb.id}">${barb.nome}</option>`;
        }
    });

    // Limpar formulário
    document.getElementById('comanda-cliente-nome').value = '';
    document.getElementById('comanda-barbeiro').value = '';

    // Abrir modal
    document.getElementById('novaComandaModal').classList.add('active');
}

// Inicializar modal de nova comanda
function initNovaComandaModal() {
    const modal = document.getElementById('novaComandaModal');
    const closeBtn = document.getElementById('closeNovaComandaModal');
    const cancelBtn = document.getElementById('cancelNovaComanda');
    const saveBtn = document.getElementById('saveNovaComanda');

    const closeModal = () => {
        modal?.classList.remove('active');
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    saveBtn?.addEventListener('click', async () => {
        const clienteNome = document.getElementById('comanda-cliente-nome').value;
        const barbeiroId = document.getElementById('comanda-barbeiro').value;

        if (!clienteNome || !barbeiroId) {
            showToast('Preencha todos os campos', 'warning');
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Abrindo...';

            const response = await fetch('/api/v1/comandas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clienteNome: clienteNome,
                    barbeiroId: parseInt(barbeiroId)
                })
            });

            if (response.ok) {
                const result = await response.json();
                showToast('Comanda aberta com sucesso!', 'success');
                closeModal();
                loadComandas();

                // Abrir automaticamente a comanda para gerenciamento
                setTimeout(() => gerenciarComanda(result.id), 500);
            } else {
                const error = await response.json();
                showToast(error.error || 'Erro ao abrir comanda', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('Erro ao abrir comanda', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Abrir Comanda';
        }
    });
}

// Gerenciar comanda (adicionar/remover itens)
async function gerenciarComanda(id) {
    try {
        const response = await fetch(`/api/v1/comandas/${id}`);
        if (!response.ok) {
            showToast('Comanda não encontrada', 'error');
            return;
        }

        comandaAtual = await response.json();

        // Preencher informações do modal
        document.getElementById('comanda-id-modal').textContent = comandaAtual.id;
        document.getElementById('comanda-cliente-modal').textContent = comandaAtual.clienteNome;
        document.getElementById('comanda-barbeiro-modal').textContent = comandaAtual.barbeiroNome || '-';
        document.getElementById('comanda-status-modal').textContent = comandaAtual.status;
        document.getElementById('comanda-total-modal').textContent = `R$ ${comandaAtual.total.toFixed(2)}`;

        // Preencher select de serviços/produtos
        atualizarSelectItens();

        // Listar itens da comanda
        listarItensComanda();

        // Abrir modal
        document.getElementById('gerenciarComandaModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao carregar comanda:', error);
        showToast('Erro ao carregar comanda', 'error');
    }
}

// Atualizar select de itens baseado no tipo selecionado
function atualizarSelectItens() {
    const tipo = document.getElementById('item-tipo').value;
    const select = document.getElementById('item-servico-produto');

    select.innerHTML = '<option value="">Selecione</option>';

    servicosCache
        .filter(s => s.tipo === tipo && s.ativo)
        .forEach(item => {
            select.innerHTML += `<option value="${item.id}" data-preco="${item.preco}" data-nome="${item.nome}">${item.nome} - R$ ${item.preco.toFixed(2)}</option>`;
        });
}

// Listener para mudança de tipo
document.addEventListener('DOMContentLoaded', () => {
    const tipoSelect = document.getElementById('item-tipo');
    tipoSelect?.addEventListener('change', atualizarSelectItens);
});

// Listar itens da comanda
function listarItensComanda() {
    const container = document.getElementById('itens-comanda-list');

    if (!comandaAtual || !comandaAtual.itens || comandaAtual.itens.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum item adicionado</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Tipo</th>
                    <th>Qtd</th>
                    <th>Preço Un.</th>
                    <th>Subtotal</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${comandaAtual.itens.map(item => `
                    <tr>
                        <td>${item.nome}</td>
                        <td>${item.tipo === 'servico' ? 'Serviço' : 'Produto'}</td>
                        <td>${item.quantidade}</td>
                        <td>R$ ${item.precoUnitario.toFixed(2)}</td>
                        <td>R$ ${item.subtotal.toFixed(2)}</td>
                        <td class="table-actions">
                            <button class="btn-icon delete" onclick="removerItemComanda(${item.id})" title="Remover">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Adicionar item à comanda
async function adicionarItemComanda() {
    if (!comandaAtual) return;

    const tipo = document.getElementById('item-tipo').value;
    const select = document.getElementById('item-servico-produto');
    const itemId = select.value;
    const quantidade = parseInt(document.getElementById('item-quantidade').value);

    if (!itemId || quantidade < 1) {
        showToast('Selecione um item e quantidade válida', 'warning');
        return;
    }

    const option = select.options[select.selectedIndex];
    const nome = option.dataset.nome;
    const preco = parseFloat(option.dataset.preco);

    try {
        const response = await fetch(`/api/v1/comandas/${comandaAtual.id}/itens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: tipo,
                itemId: parseInt(itemId),
                nome: nome,
                quantidade: quantidade,
                precoUnitario: preco
            })
        });

        if (response.ok) {
            showToast('Item adicionado com sucesso!', 'success');

            // Resetar formulário
            document.getElementById('item-quantidade').value = 1;
            select.value = '';

            // Recarregar comanda
            await gerenciarComanda(comandaAtual.id);
        } else {
            const error = await response.json();
            showToast(error.error || 'Erro ao adicionar item', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao adicionar item', 'error');
    }
}

// Remover item da comanda
async function removerItemComanda(itemId) {
    if (!comandaAtual) return;

    if (!confirm('Deseja realmente remover este item?')) return;

    try {
        const response = await fetch(`/api/v1/comandas/${comandaAtual.id}/itens/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Item removido com sucesso!', 'success');
            await gerenciarComanda(comandaAtual.id);
        } else {
            const error = await response.json();
            showToast(error.error || 'Erro ao remover item', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao remover item', 'error');
    }
}

// Abrir modal de fechar comanda
function fecharComandaModal() {
    if (!comandaAtual) return;

    if (comandaAtual.itens.length === 0) {
        showToast('Adicione pelo menos um item antes de fechar a comanda', 'warning');
        return;
    }

    // Preencher informações
    document.getElementById('fechar-comanda-id').textContent = comandaAtual.id;
    document.getElementById('fechar-comanda-cliente').textContent = comandaAtual.clienteNome;
    document.getElementById('fechar-comanda-total').textContent = `R$ ${comandaAtual.total.toFixed(2)}`;

    // Limpar formulário
    document.getElementById('forma-pagamento').value = '';
    document.getElementById('observacoes-pgto').value = '';

    // Fechar modal de gerenciar e abrir modal de fechar
    document.getElementById('gerenciarComandaModal').classList.remove('active');
    document.getElementById('fecharComandaModal').classList.add('active');
}

// Confirmar fechamento da comanda
async function confirmarFecharComanda() {
    if (!comandaAtual) return;

    const formaPagamento = document.getElementById('forma-pagamento').value;
    const observacoes = document.getElementById('observacoes-pgto').value;

    if (!formaPagamento) {
        showToast('Selecione a forma de pagamento', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/v1/comandas/${comandaAtual.id}/fechar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                formaPagamento: formaPagamento,
                observacoesPgto: observacoes
            })
        });

        if (response.ok) {
            showToast('Comanda fechada com sucesso!', 'success');
            document.getElementById('fecharComandaModal').classList.remove('active');
            comandaAtual = null;
            loadComandas();
        } else {
            const error = await response.json();
            showToast(error.error || 'Erro ao fechar comanda', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao fechar comanda', 'error');
    }
}

// Cancelar comanda
async function cancelarComanda() {
    if (!comandaAtual) return;

    if (!confirm('Deseja realmente cancelar esta comanda?')) return;

    try {
        const response = await fetch(`/api/v1/comandas/${comandaAtual.id}/cancelar`, {
            method: 'PATCH'
        });

        if (response.ok) {
            showToast('Comanda cancelada', 'success');
            document.getElementById('gerenciarComandaModal').classList.remove('active');
            comandaAtual = null;
            loadComandas();
        } else {
            const error = await response.json();
            showToast(error.error || 'Erro ao cancelar comanda', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao cancelar comanda', 'error');
    }
}

// Inicializar modais
function initComandasModals() {
    // Modal de gerenciar comanda
    const gerenciarModal = document.getElementById('gerenciarComandaModal');
    const closeGerenciarBtn = document.getElementById('closeGerenciarComandaModal');

    closeGerenciarBtn?.addEventListener('click', () => {
        gerenciarModal.classList.remove('active');
        comandaAtual = null;
    });

    gerenciarModal?.addEventListener('click', (e) => {
        if (e.target === gerenciarModal) {
            gerenciarModal.classList.remove('active');
            comandaAtual = null;
        }
    });

    // Modal de fechar comanda
    const fecharModal = document.getElementById('fecharComandaModal');
    const closeFecharBtn = document.getElementById('closeFecharComandaModal');

    closeFecharBtn?.addEventListener('click', () => {
        fecharModal.classList.remove('active');
        // Reabrir modal de gerenciar
        if (comandaAtual) {
            document.getElementById('gerenciarComandaModal').classList.add('active');
        }
    });

    fecharModal?.addEventListener('click', (e) => {
        if (e.target === fecharModal) {
            fecharModal.classList.remove('active');
            if (comandaAtual) {
                document.getElementById('gerenciarComandaModal').classList.add('active');
            }
        }
    });
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    initNovaComandaModal();
    initComandasModals();
});
