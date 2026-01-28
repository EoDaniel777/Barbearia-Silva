// ===================================
// DASHBOARD BARBEARIA SILVA
// ===================================

// State
let currentPage = 'dashboard';
let barbeiros = [];
let servicos = [];
let horarios = [];

// ===================================
// NAVIGATION
// ===================================

// Inicializar clique no avatar da sidebar para abrir modal de perfil
function initSidebarAvatarClick() {
    const sidebarAvatar = document.querySelector('.sidebar-avatar');

    if (!sidebarAvatar) {
        console.error('[SIDEBAR AVATAR] Elemento não encontrado');
        return;
    }

    sidebarAvatar.addEventListener('click', () => {
        console.log('[SIDEBAR AVATAR] Avatar clicado, abrindo modal de perfil');
        openPerfilAdminModal();
    });

    console.log('[SIDEBAR AVATAR] Evento de clique configurado');
}

function init() {
    initNavigation();
    initMobileMenu();
    initProfileDropdown();
    initNotifications();
    initEditBarbeiroModal(); // Modal de edição de barbeiro
    initHorariosModal(); // Modal de horários de trabalho
    initThemeToggle(); // Inicializa o theme toggle
    initSidebarAvatarClick(); // Clique no avatar da sidebar para editar perfil
    loadUserInfo();
    loadDashboardData();
    loadNotifications(); // Carrega notificações e atualiza badge ao iniciar
}

// Aguardar DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function initNavigation() {
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                navigateToPage(page);
            });
        });
    }

    // Bottom navigation (mobile)
    const bottomNavLinks = document.querySelectorAll('.nav-item-dash');
    if (bottomNavLinks.length > 0) {
        bottomNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                navigateToPage(page);
            });
        });
    }
}

function navigateToPage(page) {
    // Update sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Update bottom navigation (mobile)
    document.querySelectorAll('.nav-item-dash').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `${page}-page`);
    });

    currentPage = page;

    // Update top-bar title (mobile)
    const topBarTitle = document.querySelector('.top-bar-title');
    const pageTitles = {
        'dashboard': 'Dashboard',
        'barbeiros': 'Cadastro de Barbeiros',
        'horarios': 'Gestão de Horários',
        'servicos': 'Serviços e Produtos',
        'comandas': 'Comandas / PDV',
        'galeria': 'Configurações'
    };

    if (topBarTitle) {
        topBarTitle.textContent = pageTitles[page] || 'Dashboard';
    }

    // Load page data
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'barbeiros':
            loadBarbeiros();
            break;
        case 'horarios':
            loadHorarios();
            break;
        case 'servicos':
            loadServicos();
            break;
        case 'comandas':
            if (typeof loadComandas === 'function') {
                loadComandas();
            }
            break;
        case 'galeria':
            loadGaleria();
            break;
    }
}

function initMobileMenu() {
    // Mobile menu functionality will be added here if needed
}

// ===================================
// DASHBOARD PAGE
// ===================================

async function loadDashboardData() {
    try {
        // Load bookings
        const response = await fetch('/api/v1/horarios');
        const horarios = await response.json();

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = getStartOfWeek();
        const startOfMonth = getStartOfMonth();

        const todayBookings = horarios.filter(h => h.dataHora.startsWith(today));
        const weekBookings = horarios.filter(h => new Date(h.dataHora) >= startOfWeek);
        const monthBookings = horarios.filter(h => new Date(h.dataHora) >= startOfMonth);

        // Update stats
        document.getElementById('stat-hoje').textContent = todayBookings.length;
        document.getElementById('stat-semana').textContent = weekBookings.length;
        document.getElementById('stat-mes').textContent = monthBookings.length;

        // Calculate revenue (assuming average price of R$ 35)
        // Comentado porque o card stat-total está desabilitado no HTML
        // const revenue = monthBookings.filter(h => h.status === 'concluido').length * 35;
        // document.getElementById('stat-total').textContent = `R$ ${revenue}`;

        // Show recent bookings
        displayRecentBookings(horarios.slice(0, 5));

        // Show top services (mock data for now)
        displayTopServices();
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

function displayRecentBookings(bookings) {
    const container = document.getElementById('recent-bookings');

    if (bookings.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum agendamento recente</p>';
        return;
    }

    container.innerHTML = bookings.map(booking => `
        <div class="booking-item">
            <div class="booking-info">
                <h4>${booking.nomeCliente || booking.cliente_nome}</h4>
                <p>${formatDateTime(booking.dataHora || booking.data_hora)}</p>
            </div>
            <span class="status-badge ${booking.status}">${getStatusText(booking.status)}</span>
        </div>
    `).join('');
}

function displayTopServices() {
    const container = document.getElementById('top-services');

    const services = [
        { name: 'Corte', count: 45 },
        { name: 'Barba', count: 32 },
        { name: 'Corte + Barba', count: 28 },
        { name: 'Kids', count: 15 }
    ];

    container.innerHTML = services.map(service => `
        <div class="service-item">
            <div class="service-info">
                <h4>${service.name}</h4>
                <p>${service.count} realizados este mês</p>
            </div>
        </div>
    `).join('');
}

// ===================================
// BARBEIROS PAGE
// ===================================

async function loadBarbeiros() {
    try {
        const response = await fetch('/api/v1/barbeiros');
        barbeiros = await response.json();
        displayBarbeiros();
    } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
        document.getElementById('barbers-list').innerHTML =
            '<p class="empty-message">Erro ao carregar barbeiros</p>';
    }
}

function displayBarbeiros() {
    const container = document.getElementById('barbers-list');

    if (barbeiros.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum barbeiro cadastrado</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                    <th>Especialidade</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${barbeiros.map(barber => `
                    <tr>
                        <td>${barber.nome}</td>
                        <td>${barber.email || '-'}</td>
                        <td>${barber.telefone || '-'}</td>
                        <td>${barber.especialidade || '-'}</td>
                        <td class="table-actions">
                            <button class="btn-icon edit" onclick="editBarbeiro(${barber.id})" title="Editar dados">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon schedule" onclick="gerenciarHorarios(${barber.id})" title="Gerenciar horários" style="background: var(--success-color);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </button>
                            <button class="btn-icon delete" onclick="deleteBarbeiro(${barber.id})" title="Excluir">
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

// Barber Form
document.getElementById('barber-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nome: document.getElementById('barber-name').value,
        email: document.getElementById('barber-email').value,
        telefone: document.getElementById('barber-phone').value,
        sexo: document.getElementById('barber-gender').value,
        especialidade: document.getElementById('barber-specialty').value,
        descricao: document.getElementById('barber-description').value
    };

    try {
        const response = await fetch('/api/v1/barbeiros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showToast('Barbeiro cadastrado com sucesso!', 'success');
            document.getElementById('barber-form').reset();
            loadBarbeiros();
        } else {
            showToast('Erro ao cadastrar barbeiro', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao cadastrar barbeiro', 'error');
    }
});

document.getElementById('clear-form')?.addEventListener('click', () => {
    document.getElementById('barber-form').reset();
});

let currentBarbeiroId = null;

// Função para EDITAR DADOS do barbeiro (nome, email, telefone, etc)
async function editBarbeiro(id) {
    const barbeiro = barbeiros.find(b => b.id === id);
    if (!barbeiro) {
        showToast('Barbeiro não encontrado', 'error');
        return;
    }

    // Preencher formulário do modal com dados do barbeiro
    document.getElementById('edit-barber-id').value = barbeiro.id;
    document.getElementById('edit-barber-name').value = barbeiro.nome;
    document.getElementById('edit-barber-email').value = barbeiro.email || '';
    document.getElementById('edit-barber-phone').value = barbeiro.telefone || '';
    document.getElementById('edit-barber-gender').value = barbeiro.sexo || 'Masculino';
    document.getElementById('edit-barber-specialty').value = barbeiro.especialidade || '';
    document.getElementById('edit-barber-description').value = barbeiro.descricao || '';

    // Resetar preview de foto
    const previewImg = document.getElementById('edit-preview-img');
    const placeholder = document.getElementById('edit-photo-placeholder');

    if (barbeiro.foto) {
        currentBarbeiroPhoto = barbeiro.foto;
        previewImg.src = barbeiro.foto;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        currentBarbeiroPhoto = null;
        previewImg.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    // Abrir modal de edição
    document.getElementById('editBarbeiroModal').classList.add('active');
}

// Função para GERENCIAR HORÁRIOS do barbeiro
async function gerenciarHorarios(id) {
    const barbeiro = barbeiros.find(b => b.id === id);
    if (!barbeiro) {
        showToast('Barbeiro não encontrado', 'error');
        return;
    }

    currentBarbeiroId = id;
    document.getElementById('barbeiro-nome-modal').textContent = barbeiro.nome;

    // Carregar horários existentes do barbeiro
    await loadBarbeiroHorarios(id);

    // Abrir modal de horários
    document.getElementById('horariosModal').classList.add('active');
}

async function loadBarbeiroHorarios(barbeiroId) {
    try {
        const response = await fetch(`/api/v1/barbeiros/${barbeiroId}/horarios`);
        if (response.ok) {
            const horarios = await response.json();

            // Resetar todos os checkboxes e inputs primeiro
            for (let dia = 0; dia <= 6; dia++) {
                document.getElementById(`dia-${dia}`).checked = false;
                document.getElementById(`inicio-${dia}`).disabled = true;
                document.getElementById(`fim-${dia}`).disabled = true;
            }

            // Preencher com os horários do barbeiro
            if (horarios && horarios.length > 0) {
                horarios.forEach(h => {
                    const dia = h.dia_semana;
                    document.getElementById(`dia-${dia}`).checked = true;
                    document.getElementById(`inicio-${dia}`).value = h.hora_inicio;
                    document.getElementById(`fim-${dia}`).value = h.hora_fim;
                    document.getElementById(`inicio-${dia}`).disabled = false;
                    document.getElementById(`fim-${dia}`).disabled = false;
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
    }
}

async function deleteBarbeiro(id) {
    const confirmed = await showConfirm('Deseja realmente excluir este barbeiro?', 'Excluir Barbeiro');
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/v1/barbeiros/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Barbeiro excluído com sucesso!', 'success');
            loadBarbeiros();
        } else {
            showToast('Erro ao excluir barbeiro', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao excluir barbeiro', 'error');
    }
}

// ===================================
// HORÁRIOS PAGE
// ===================================

async function loadHorarios() {
    try {
        const response = await fetch('/api/v1/horarios');
        horarios = await response.json();
        displayHorarios();
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
    }
}

function displayHorarios() {
    const pending = horarios.filter(h => h.status === 'pendente');
    displayPendingBookings(pending);
    displayAllBookings(horarios);
}

function displayPendingBookings(bookings) {
    const container = document.getElementById('pending-bookings');

    if (bookings.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum agendamento pendente</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Data/Hora</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${bookings.map(booking => `
                    <tr>
                        <td>${booking.nomeCliente || booking.cliente_nome}</td>
                        <td>${booking.telefone}</td>
                        <td>${formatDateTime(booking.dataHora || booking.data_hora)}</td>
                        <td class="table-actions">
                            <button class="btn-icon edit" style="background: rgba(76, 175, 80, 0.1); color: #4CAF50;"
                                    onclick="updateBookingStatus(${booking.id}, 'confirmado')">
                                ✓
                            </button>
                            <button class="btn-icon delete" onclick="updateBookingStatus(${booking.id}, 'cancelado')">
                                ✗
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function displayAllBookings(bookings) {
    const container = document.getElementById('all-bookings');

    if (bookings.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum agendamento</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Data/Hora</th>
                    <th>Status</th>
                    <th>Comanda</th>
                </tr>
            </thead>
            <tbody>
                ${bookings.map(booking => `
                    <tr>
                        <td>${booking.nomeCliente || booking.cliente_nome}</td>
                        <td>${booking.telefone}</td>
                        <td>${formatDateTime(booking.dataHora || booking.data_hora)}</td>
                        <td><span class="status-badge ${booking.status}">${getStatusText(booking.status)}</span></td>
                        <td class="table-actions">
                            <button class="btn-icon" style="background: rgba(13, 124, 164, 0.1); color: #0D7CA4;"
                                    onclick="abrirComandaAgendamento(${booking.id}, '${(booking.nomeCliente || booking.cliente_nome).replace(/'/g, "\\'")}', ${booking.barbeiro_id || 0})"
                                    title="Adicionar produtos">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 3h18v18H3z"></path>
                                    <path d="M3 9h18M9 21V9"></path>
                                </svg>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function updateBookingStatus(id, status) {
    try {
        const response = await fetch(`/api/v1/horarios/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showToast('Status atualizado com sucesso!', 'success');
            loadHorarios();
        } else {
            showToast('Erro ao atualizar status', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao atualizar status', 'error');
    }
}

// ===================================
// SERVIÇOS PAGE
// ===================================

async function loadServicos() {
    try {
        const response = await fetch('/api/v1/servicos');
        servicos = await response.json();
        displayServicos();
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

function displayServicos() {
    const container = document.getElementById('services-list');

    if (servicos.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum serviço cadastrado</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Foto</th>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Preço</th>
                    <th>Duração</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${servicos.map(service => `
                    <tr>
                        <td>
                            ${service.foto ?
                                `<img src="${service.foto}" alt="${service.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` :
                                `<div style="width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #8E8E93;">Sem foto</div>`
                            }
                        </td>
                        <td>${service.nome}</td>
                        <td>${service.tipo === 'servico' ? 'Serviço' : 'Produto'}</td>
                        <td>R$ ${service.preco}</td>
                        <td>${service.duracao ? service.duracao + ' min' : '-'}</td>
                        <td class="table-actions">
                            <div class="div-table-actions">
                                <button class="btn-icon edit" onclick="editServico(${service.id})">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>

                                <button class="btn-icon delete" onclick="deleteServico(${service.id})">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

let editingServicoId = null;
let serviceFotoBase64 = ''; // Armazena foto em base64 (formulário de criar)
let editServiceFotoBase64 = ''; // Armazena foto em base64 (modal de editar)

// Service Photo Upload
document.getElementById('service-photo')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showToast('Selecione um arquivo de imagem válido', 'error');
        return;
    }

    // Converter para base64
    const base64 = await fileToBase64(file);
    serviceFotoBase64 = base64;

    // Mostrar preview
    const preview = document.getElementById('service-photo-preview');
    const img = document.getElementById('service-photo-img');
    if (preview && img) {
        img.src = base64;
        preview.style.display = 'flex';
        preview.style.alignItems = 'center';
        preview.style.gap = '12px';
    }
});

// Remove Service Photo
document.getElementById('remove-service-photo')?.addEventListener('click', () => {
    serviceFotoBase64 = '';
    document.getElementById('service-photo').value = '';
    document.getElementById('service-photo-preview').style.display = 'none';
    document.getElementById('service-photo-img').src = '';
});

// Service Form
document.getElementById('service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nome: document.getElementById('service-name').value,
        tipo: document.getElementById('service-type').value,
        preco: parseFloat(document.getElementById('service-price').value),
        duracao: parseInt(document.getElementById('service-duration').value) || 0,
        descricao: document.getElementById('service-description').value,
        foto: serviceFotoBase64 // Incluir foto em base64
    };

    try {
        let response;
        let message;

        if (editingServicoId) {
            // Modo de edição - PUT
            response = await fetch(`/api/v1/servicos/${editingServicoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            message = 'Serviço/Produto atualizado com sucesso!';
        } else {
            // Modo de criação - POST
            response = await fetch('/api/v1/servicos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            message = 'Serviço/Produto cadastrado com sucesso!';
        }

        if (response.ok) {
            showToast(message, 'success');
            cancelEditServico();
            loadServicos();
        } else {
            showToast('Erro ao salvar', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao salvar', 'error');
    }
});

document.getElementById('clear-service-form')?.addEventListener('click', () => {
    cancelEditServico();
});

async function editServico(id) {
    const servico = servicos.find(s => s.id === id);
    if (!servico) {
        showToast('Serviço não encontrado', 'error');
        return;
    }

    // Preencher modal com dados do serviço
    document.getElementById('edit-service-id').value = servico.id;
    document.getElementById('edit-service-name').value = servico.nome;
    document.getElementById('edit-service-type').value = servico.tipo || 'servico';
    document.getElementById('edit-service-price').value = servico.preco;
    document.getElementById('edit-service-duration').value = servico.duracao || '';
    document.getElementById('edit-service-description').value = servico.descricao || '';

    // Preencher foto se existir
    if (servico.foto) {
        editServiceFotoBase64 = servico.foto;
        const preview = document.getElementById('edit-service-photo-preview');
        const img = document.getElementById('edit-service-photo-img');
        if (preview && img) {
            img.src = servico.foto;
            preview.style.display = 'flex';
            preview.style.alignItems = 'center';
            preview.style.gap = '12px';
        }
    } else {
        editServiceFotoBase64 = '';
        const preview = document.getElementById('edit-service-photo-preview');
        if (preview) {
            preview.style.display = 'none';
        }
    }

    // Abrir modal
    document.getElementById('editServicoModal').style.display = 'flex';
}

function cancelEditServico() {
    editingServicoId = null;
    serviceFotoBase64 = '';
    document.getElementById('service-form').reset();

    // Limpar preview de foto
    document.getElementById('service-photo-preview').style.display = 'none';
    document.getElementById('service-photo-img').src = '';

    // Restaurar texto do botão
    const submitBtn = document.querySelector('#service-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Cadastrar';
    }

    // Restaurar texto do botão de limpar
    const clearBtn = document.getElementById('clear-service-form');
    if (clearBtn) {
        clearBtn.textContent = 'Limpar';
    }
}

async function deleteServico(id) {
    const confirmed = await showConfirm('Deseja realmente excluir este item?', 'Excluir Serviço/Produto');
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/v1/servicos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Item excluído com sucesso!', 'success');
            loadServicos();
        } else {
            showToast('Erro ao excluir', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao excluir', 'error');
    }
}

// ===================================
// GALERIA PAGE
// ===================================

function loadGaleria() {
    // Gallery functionality - basic implementation
    const container = document.getElementById('gallery-grid');
    container.innerHTML = '<p class="empty-message">Sistema de galeria em desenvolvimento</p>';

    // Inicializar upload de logos
    initLogoUploads();

    // Carregar informações da barbearia
    carregarInformacoesBarbearia();

    // Inicializar form de informações
    initInfoBarbeariaForm();
}

// ===================================
// INFORMAÇÕES DA BARBEARIA
// ===================================

async function carregarInformacoesBarbearia() {
    try {
        const response = await fetch('/api/v1/settings/geral');
        const data = await response.json();

        document.getElementById('info-nome').value = data.nome || '';
        document.getElementById('info-telefone').value = data.telefone || '';
        document.getElementById('info-whatsapp').value = data.whatsapp || '';
        document.getElementById('info-endereco').value = data.endereco || '';
        document.getElementById('info-instagram').value = data.instagram || '';
        document.getElementById('info-email').value = data.email || '';
    } catch (error) {
        console.error('Erro ao carregar informações:', error);
    }
}

function initInfoBarbeariaForm() {
    const form = document.getElementById('info-barbearia-form');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            nome: document.getElementById('info-nome').value,
            telefone: document.getElementById('info-telefone').value,
            whatsapp: document.getElementById('info-whatsapp').value,
            endereco: document.getElementById('info-endereco').value,
            instagram: document.getElementById('info-instagram').value,
            email: document.getElementById('info-email').value
        };

        try {
            const response = await fetch('/api/v1/settings/geral', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                showInfoStatus('Informações salvas com sucesso!', 'success');
                setTimeout(() => hideInfoStatus(), 3000);
            } else {
                throw new Error('Erro ao salvar');
            }
        } catch (error) {
            console.error('Erro:', error);
            showInfoStatus('Erro ao salvar informações', 'error');
        }
    });
}

function showInfoStatus(message, type) {
    const statusEl = document.getElementById('info-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = 'alert';

    if (type === 'success') {
        statusEl.classList.add('success');
    } else if (type === 'error') {
        statusEl.classList.add('error');
    }

    statusEl.style.display = 'block';
}

function hideInfoStatus() {
    const statusEl = document.getElementById('info-status');
    if (statusEl) {
        statusEl.style.display = 'none';
    }
}

// ===================================
// LOGO UPLOAD FUNCTIONALITY
// ===================================

function initLogoUploads() {
    const logoDarkInput = document.getElementById('logo-dark-input');
    const logoWhiteInput = document.getElementById('logo-white-input');

    if (logoDarkInput) {
        logoDarkInput.addEventListener('change', (e) => handleLogoUpload(e, 'dark'));
    }

    if (logoWhiteInput) {
        logoWhiteInput.addEventListener('change', (e) => handleLogoUpload(e, 'white'));
    }
}

async function handleLogoUpload(event, logoType) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        showLogoStatus('Erro: Selecione um arquivo de imagem válido', 'error');
        return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showLogoStatus('Erro: A imagem deve ter no máximo 5MB', 'error');
        return;
    }

    try {
        showLogoStatus(`Enviando logo ${logoType}...`, 'info');

        // Converter para base64
        const base64 = await fileToBase64(file);

        // Preparar dados para envio
        const payload = {};
        if (logoType === 'dark') {
            payload.logoDark = base64;
        } else {
            payload.logoWhite = base64;
        }

        // Enviar para backend
        const response = await fetch('/api/v1/settings/logo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // Atualizar preview
            const previewId = `logo-${logoType}-preview`;
            const preview = document.getElementById(previewId);
            if (preview) {
                // Não adicionar query string em base64
                preview.src = base64;
                // Forçar reload da imagem
                preview.style.display = 'none';
                setTimeout(() => preview.style.display = 'block', 10);
            }

            // Atualizar logos em toda a página
            updateLogosOnPage(logoType, base64);

            showLogoStatus(`Logo ${logoType} atualizada com sucesso!`, 'success');

            // Limpar status após 3 segundos
            setTimeout(() => {
                hideLogoStatus();
            }, 3000);
        } else {
            throw new Error(data.error || 'Erro ao fazer upload');
        }
    } catch (error) {
        console.error('Erro ao fazer upload da logo:', error);
        showLogoStatus(`Erro: ${error.message}`, 'error');
    }
}

/**
 * Converte arquivo para base64 usando método moderno e seguro
 * Usa File.arrayBuffer() - API moderna sem problemas de permissão
 */
async function fileToBase64(file) {
    // Validar o arquivo antes de tentar ler
    if (!file) {
        throw new Error('Nenhum arquivo fornecido');
    }

    if (!file.type || !file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
    }

    console.log('[fileToBase64] Processando arquivo:', file.name, 'Tamanho:', file.size);

    try {
        // Método moderno: usar arrayBuffer() - mais confiável
        console.log('[fileToBase64] Usando File.arrayBuffer()...');

        // Ler arquivo como ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        console.log('[fileToBase64] ArrayBuffer lido:', arrayBuffer.byteLength, 'bytes');

        // Converter ArrayBuffer para base64
        const base64 = await arrayBufferToBase64(arrayBuffer, file.type);
        console.log('[fileToBase64] ✓ Conversão bem-sucedida. Base64:', base64.length, 'caracteres');

        return base64;
    } catch (error) {
        console.error('[fileToBase64] Erro:', error);

        // Mensagem específica para erro de permissão
        if (error.name === 'NotReadableError' || error.message.includes('permission')) {
            throw new Error('Não foi possível ler o arquivo. Tente selecionar uma imagem de outra pasta (Downloads, Documentos, etc.) ou tire uma nova foto.');
        }

        throw new Error('Não foi possível processar a imagem: ' + error.message);
    }
}

/**
 * Converte ArrayBuffer para base64 com prefixo data URL
 */
function arrayBufferToBase64(buffer, mimeType) {
    return new Promise((resolve, reject) => {
        try {
            // Converter ArrayBuffer para Array de bytes
            const bytes = new Uint8Array(buffer);

            // Criar string binária
            let binary = '';
            const chunkSize = 0x8000; // 32KB chunks para performance

            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.subarray(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, chunk);
            }

            // Converter para base64
            const base64 = btoa(binary);

            // Adicionar prefixo data URL
            const dataUrl = `data:${mimeType};base64,${base64}`;

            resolve(dataUrl);
        } catch (error) {
            reject(new Error('Erro ao converter para base64: ' + error.message));
        }
    });
}

function updateLogosOnPage(logoType, base64) {
    // Atualizar todas as logos na página
    if (logoType === 'dark') {
        // Top bar logo
        const topBarLogo = document.querySelector('.top-bar-logo');
        if (topBarLogo) topBarLogo.src = base64;

        // Sidebar logo
        const sidebarLogo = document.querySelector('.sidebar-logo img');
        if (sidebarLogo) sidebarLogo.src = base64;
    }
    // Note: logoWhite é usada principalmente no tema claro do site público
}

function showLogoStatus(message, type) {
    const statusEl = document.getElementById('logo-upload-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = 'alert';

    if (type === 'success') {
        statusEl.classList.add('success');
    } else if (type === 'error') {
        statusEl.classList.add('error');
    } else {
        statusEl.style.background = 'rgba(13, 124, 164, 0.2)';
        statusEl.style.border = '1px solid rgba(13, 124, 164, 0.4)';
        statusEl.style.color = '#0D7CA4';
    }

    statusEl.style.display = 'block';
}

function hideLogoStatus() {
    const statusEl = document.getElementById('logo-upload-status');
    if (statusEl) {
        statusEl.style.display = 'none';
    }
}

// Gallery upload
document.getElementById('upload-area')?.addEventListener('click', () => {
    document.getElementById('gallery-file').click();
});

document.getElementById('gallery-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('preview-area');
            const isVideo = file.type.startsWith('video');

            preview.innerHTML = `
                <div class="preview-item">
                    ${isVideo ?
                        `<video src="${e.target.result}" controls></video>` :
                        `<img src="${e.target.result}" alt="Preview">`
                    }
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';

    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateTimeStr;
    }
}

function getStatusText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'cancelado': 'Cancelado',
        'concluido': 'Concluído'
    };
    return statusMap[status] || status;
}

function getStartOfWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}

function getStartOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ===================================
// PROFILE & NOTIFICATIONS
// ===================================

function initProfileDropdown() {
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    // THEME TOGGLE COMENTADO: const themeToggle = document.getElementById('theme-toggle-menu');

    // Toggle profile menu
    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu?.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-dropdown')) {
            profileMenu?.classList.remove('active');
        }
    });

    /* THEME TOGGLE COMENTADO TEMPORARIAMENTE
    // Theme toggle
    themeToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
    });
    */
}

function initNotifications() {
    const notifBtn = document.getElementById('notif-btn');
    const notifPanel = document.getElementById('notifications-panel');
    const closeBtn = document.getElementById('close-notif');

    // Open notifications panel
    notifBtn?.addEventListener('click', () => {
        notifPanel?.classList.add('active');
        loadNotifications();
    });

    // Close notifications panel
    closeBtn?.addEventListener('click', () => {
        notifPanel?.classList.remove('active');
    });

    // Close when clicking outside
    notifPanel?.addEventListener('click', (e) => {
        if (e.target === notifPanel) {
            notifPanel.classList.remove('active');
        }
    });
}

function initThemeToggle() {
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');

    if (!themeCheckbox) return;

    // Carregar tema salvo do localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isLightMode = savedTheme === 'light';

    // Aplicar tema inicial
    if (isLightMode) {
        document.body.classList.add('light-mode');
        themeCheckbox.checked = true;
    } else {
        document.body.classList.remove('light-mode');
        themeCheckbox.checked = false;
    }

    // Event listener para mudança de tema
    themeCheckbox.addEventListener('change', () => {
        const isChecked = themeCheckbox.checked;

        if (isChecked) {
            // Ativar light mode
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            // Ativar dark mode
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }

        console.log(`[THEME] Tema alterado para: ${isChecked ? 'light' : 'dark'}`);
    });
}

function loadUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Update profile info (top-bar mobile)
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const profilePhoto = document.getElementById('profile-btn-img');
        const profileIcon = document.getElementById('profile-btn-icon');

        // Update sidebar profile
        const sidebarUserName = document.getElementById('sidebar-user-name');
        const sidebarUserEmail = document.getElementById('sidebar-user-email');
        const sidebarProfileImg = document.getElementById('sidebar-profile-img');
        const sidebarProfileIcon = document.getElementById('sidebar-profile-icon');

        if (user.nome) {
            userName && (userName.textContent = user.nome);
            userEmail && (userEmail.textContent = user.email || '');
            sidebarUserName && (sidebarUserName.textContent = user.nome);
            sidebarUserEmail && (sidebarUserEmail.textContent = user.email || '');
        }

        // Update profile photo (top-bar)
        if (user.foto && profilePhoto && profileIcon) {
            profilePhoto.src = user.foto;
            profilePhoto.style.display = 'block';
            profileIcon.style.display = 'none';
        } else if (profilePhoto && profileIcon) {
            profilePhoto.style.display = 'none';
            profileIcon.style.display = 'block';
        }

        // Update sidebar profile photo
        if (user.foto && sidebarProfileImg && sidebarProfileIcon) {
            console.log('[LOAD USER INFO] Atualizando foto do sidebar. Tamanho:', user.foto.length);
            sidebarProfileImg.src = user.foto;
            sidebarProfileImg.style.display = 'block';
            sidebarProfileIcon.style.display = 'none';
            console.log('[LOAD USER INFO] Foto do sidebar atualizada com sucesso');
        } else if (sidebarProfileImg && sidebarProfileIcon) {
            console.log('[LOAD USER INFO] Usuário não tem foto. Mostrando ícone padrão');
            sidebarProfileImg.style.display = 'none';
            sidebarProfileIcon.style.display = 'block';
        }

        /* THEME TOGGLE COMENTADO TEMPORARIAMENTE
        // Update theme text
        updateThemeText();
        */
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
}

/* ===================================
   THEME TOGGLE (COMENTADO TEMPORARIAMENTE)
   Remover comentários quando compatibilidade for corrigida
   =================================== */

// function toggleTheme() {
//     const body = document.body;
//     const isLightMode = body.classList.contains('light-mode');
//
//     if (isLightMode) {
//         body.classList.remove('light-mode');
//         localStorage.setItem('theme', 'dark');
//     } else {
//         body.classList.add('light-mode');
//         localStorage.setItem('theme', 'light');
//     }
//
//     updateThemeText();
// }

// function updateThemeText() {
//     const themeText = document.getElementById('theme-text');
//     const isLightMode = document.body.classList.contains('light-mode');
//
//     if (themeText) {
//         themeText.textContent = isLightMode ? 'Tema Escuro' : 'Tema Claro';
//     }
// }

async function loadNotifications() {
    const notifList = document.getElementById('notifications-list');
    const notifBadge = document.getElementById('notif-badge');

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            notifList.innerHTML = '<p class="empty-message">Faça login para ver notificações</p>';
            return;
        }

        const response = await fetch(`/api/v1/notifications?usuario_id=${user.id}`);

        if (!response.ok) {
            throw new Error('Erro ao carregar notificações');
        }

        const notifications = await response.json();

        // Update badge count
        const unreadCount = notifications.filter(n => !n.lida).length;
        if (notifBadge) {
            notifBadge.textContent = unreadCount;
            notifBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        // Display notifications
        if (notifications.length === 0) {
            notifList.innerHTML = '<p class="empty-message">Nenhuma notificação</p>';
            return;
        }

        notifList.innerHTML = notifications.map(notif => `
            <div class="notif-item ${notif.lida ? 'read' : 'unread'}">
                <div class="notif-icon">
                    ${getNotifIcon(notif.tipo)}
                </div>
                <div class="notif-content">
                    <strong>${notif.titulo}</strong>
                    <p>${notif.mensagem}</p>
                    <small>${formatNotifTime(notif.criadoEm)}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        notifList.innerHTML = '<p class="empty-message">Erro ao carregar notificações</p>';

        // Hide badge on error
        if (notifBadge) {
            notifBadge.style.display = 'none';
        }
    }
}

function getNotifIcon(tipo) {
    const icons = {
        'agendamento': '📅',
        'confirmacao': '✓',
        'cancelamento': '✗',
        'lembrete': '🔔',
        'sistema': 'ℹ'
    };
    return icons[tipo] || '🔔';
}

function formatNotifTime(dateTimeStr) {
    if (!dateTimeStr) return '';

    try {
        const date = new Date(dateTimeStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        if (days < 7) return `${days}d atrás`;

        return date.toLocaleDateString('pt-BR');
    } catch {
        return '';
    }
}

// ===================================
// MODAL DE HORÁRIOS
// ===================================

function initEditBarbeiroModal() {
    const modal = document.getElementById('editBarbeiroModal');
    const closeBtn = document.getElementById('closeEditBarbeiroModal');
    const cancelBtn = document.getElementById('cancelEditBarbeiro');
    const saveBtn = document.getElementById('saveEditBarbeiro');

    // Fechar modal
    const closeModal = () => {
        modal?.classList.remove('active');
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Fechar ao clicar fora
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Salvar alterações
    saveBtn?.addEventListener('click', async () => {
        const id = document.getElementById('edit-barber-id').value;
        const formData = {
            nome: document.getElementById('edit-barber-name').value,
            email: document.getElementById('edit-barber-email').value,
            telefone: document.getElementById('edit-barber-phone').value,
            sexo: document.getElementById('edit-barber-gender').value,
            especialidade: document.getElementById('edit-barber-specialty').value,
            descricao: document.getElementById('edit-barber-description').value
        };

        if (!formData.nome || !formData.email || !formData.sexo) {
            showToast('Preencha todos os campos obrigatórios (*)', 'warning');
            return;
        }

        // Adicionar foto se houver
        if (currentBarbeiroPhoto) {
            formData.foto = currentBarbeiroPhoto;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';

            const response = await fetch(`/api/v1/barbeiros/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showToast('Barbeiro atualizado com sucesso!', 'success');
                closeModal();
                loadBarbeiros(); // Recarregar lista
                currentBarbeiroPhoto = null; // Resetar foto
            } else {
                const error = await response.text();
                showToast(`Erro ao atualizar: ${error}`, 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('Erro ao atualizar barbeiro. Tente novamente.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar Alterações';
        }
    });
}

function initHorariosModal() {
    const modal = document.getElementById('horariosModal');
    const closeBtn = document.getElementById('closeHorariosModal');
    const cancelBtn = document.getElementById('cancelHorariosModal');
    const saveBtn = document.getElementById('saveHorarios');

    // Fechar modal
    const closeModal = () => {
        modal?.classList.remove('active');
        currentBarbeiroId = null;
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Fechar ao clicar fora do modal
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Event listeners para checkboxes
    for (let dia = 0; dia <= 6; dia++) {
        const checkbox = document.getElementById(`dia-${dia}`);
        const inicioInput = document.getElementById(`inicio-${dia}`);
        const fimInput = document.getElementById(`fim-${dia}`);

        checkbox?.addEventListener('change', (e) => {
            if (inicioInput && fimInput) {
                inicioInput.disabled = !e.target.checked;
                fimInput.disabled = !e.target.checked;
            }
        });
    }

    // Salvar horários
    saveBtn?.addEventListener('click', async () => {
        if (!currentBarbeiroId) {
            showToast('Erro: Barbeiro não selecionado', 'error');
            return;
        }

        const horarios = [];

        for (let dia = 0; dia <= 6; dia++) {
            const checkbox = document.getElementById(`dia-${dia}`);
            if (checkbox?.checked) {
                const horaInicio = document.getElementById(`inicio-${dia}`).value;
                const horaFim = document.getElementById(`fim-${dia}`).value;

                if (!horaInicio || !horaFim) {
                    showToast(`Por favor, preencha os horários para ${getDiaNome(dia)}`, 'warning');
                    return;
                }

                if (horaInicio >= horaFim) {
                    showToast(`Horário inválido para ${getDiaNome(dia)}: início deve ser antes do fim`, 'warning');
                    return;
                }

                horarios.push({
                    barbeiro_id: currentBarbeiroId,
                    dia_semana: dia,
                    hora_inicio: horaInicio,
                    hora_fim: horaFim
                });
            }
        }

        if (horarios.length === 0) {
            showToast('Selecione pelo menos um dia da semana', 'warning');
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';

            const response = await fetch(`/api/v1/barbeiros/${currentBarbeiroId}/horarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ horarios })
            });

            if (response.ok) {
                showToast('Horários salvos com sucesso!', 'success');
                closeModal();
            } else {
                const error = await response.text();
                showToast(`Erro ao salvar horários: ${error}`, 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('Erro ao salvar horários. Tente novamente.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar Horários';
        }
    });
}

function getDiaNome(dia) {
    const dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    return dias[dia] || '';
}

// ===================================
// TOAST NOTIFICATION SYSTEM
// ===================================

function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    const titles = {
        success: title || 'Sucesso!',
        error: title || 'Erro!',
        warning: title || 'Atenção!',
        info: title || 'Informação'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// ===================================
// PHOTO UPLOAD HANDLERS
// ===================================

let currentBarbeiroPhoto = null; // Base64 da foto do barbeiro
let currentPerfilPhoto = null; // Base64 da foto do perfil

// Upload de foto no modal de editar barbeiro
function initBarbeiroPhotoUpload() {
    const uploadArea = document.getElementById('edit-photo-upload');
    const fileInput = document.getElementById('edit-barber-photo');
    const previewImg = document.getElementById('edit-preview-img');
    const placeholder = document.getElementById('edit-photo-placeholder');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tamanho máximo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('A imagem deve ter no máximo 5MB', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            currentBarbeiroPhoto = base64;
            previewImg.src = base64;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
            showToast('Imagem carregada com sucesso', 'success');
        } catch (error) {
            console.error('[BARBEIRO] Erro ao processar imagem:', error);
            showToast(error.message || 'Erro ao processar imagem', 'error');
        }
    });
}

// Upload de foto no modal de perfil admin
function initPerfilPhotoUpload() {
    const uploadArea = document.getElementById('perfil-photo-upload');
    const fileInput = document.getElementById('perfil-admin-photo');
    const previewImg = document.getElementById('perfil-preview-img');
    const placeholder = document.getElementById('perfil-photo-placeholder');

    console.log('[PERFIL ADMIN] Inicializando upload de foto');
    console.log('[PERFIL ADMIN] Elementos encontrados:', {
        uploadArea: !!uploadArea,
        fileInput: !!fileInput,
        previewImg: !!previewImg,
        placeholder: !!placeholder
    });

    if (!uploadArea || !fileInput) {
        console.error('[PERFIL ADMIN] Elementos de upload não encontrados!');
        return;
    }

    uploadArea.addEventListener('click', () => {
        console.log('[PERFIL ADMIN] Área de upload clicada, abrindo seletor de arquivo');
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        console.log('[PERFIL ADMIN] Arquivo selecionado:', file);

        if (!file) {
            console.warn('[PERFIL ADMIN] Nenhum arquivo selecionado');
            return;
        }

        console.log('[PERFIL ADMIN] Detalhes do arquivo:', {
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            tamanhoMB: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        });

        // Validar tamanho máximo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            console.error('[PERFIL ADMIN] Arquivo muito grande:', file.size);
            showToast('A imagem deve ter no máximo 5MB', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            console.error('[PERFIL ADMIN] Arquivo não é uma imagem:', file.type);
            showToast('Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }

        console.log('[PERFIL ADMIN] Iniciando leitura do arquivo...');

        try {
            const base64 = await fileToBase64(file);

            console.log('[PERFIL ADMIN] Arquivo convertido para base64');
            console.log('[PERFIL ADMIN] Tamanho do base64:', base64.length, 'caracteres');

            currentPerfilPhoto = base64;
            previewImg.src = base64;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';

            console.log('[PERFIL ADMIN] Preview atualizado com sucesso');
            showToast('Imagem carregada com sucesso', 'success');
        } catch (error) {
            console.error('[PERFIL ADMIN] Erro ao processar imagem:', error);
            showToast(error.message || 'Erro ao processar imagem', 'error');
        }
    });
}

// ===================================
// MODAL DE PERFIL DO ADMINISTRADOR
// ===================================

function initPerfilAdminModal() {
    const modal = document.getElementById('perfilAdminModal');
    const closeBtn = document.getElementById('closePerfilAdminModal');
    const cancelBtn = document.getElementById('cancelPerfilAdmin');
    const saveBtn = document.getElementById('savePerfilAdmin');
    const perfilMenuItem = document.querySelector('.profile-menu-item[href="#"]');

    // Abrir modal ao clicar em "Meu Perfil"
    if (perfilMenuItem) {
        perfilMenuItem.addEventListener('click', (e) => {
            e.preventDefault();
            openPerfilAdminModal();
        });
    }

    // Fechar modal
    const closeModal = () => {
        modal?.classList.remove('active');
        currentPerfilPhoto = null;
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Fechar ao clicar fora
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Salvar perfil
    saveBtn?.addEventListener('click', async () => {
        await savePerfilAdmin();
    });
}

function openPerfilAdminModal() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Preencher formulário com dados atuais
        document.getElementById('perfil-admin-name').value = user.nome || '';
        document.getElementById('perfil-admin-email').value = user.email || '';
        document.getElementById('perfil-admin-phone').value = user.telefone || '';

        // Limpar campos de senha
        document.getElementById('perfil-admin-senha-atual').value = '';
        document.getElementById('perfil-admin-senha-nova').value = '';
        document.getElementById('perfil-admin-senha-confirmar').value = '';

        // Resetar preview de foto
        const previewImg = document.getElementById('perfil-preview-img');
        const placeholder = document.getElementById('perfil-photo-placeholder');

        if (user.foto) {
            previewImg.src = user.foto;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            previewImg.style.display = 'none';
            placeholder.style.display = 'flex';
        }

        currentPerfilPhoto = user.foto || null;

        // Abrir modal
        document.getElementById('perfilAdminModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao abrir perfil:', error);
        showToast('Erro ao carregar dados do perfil', 'error');
    }
}

async function savePerfilAdmin() {
    const nome = document.getElementById('perfil-admin-name').value;
    const email = document.getElementById('perfil-admin-email').value;
    const telefone = document.getElementById('perfil-admin-phone').value;
    const senhaAtual = document.getElementById('perfil-admin-senha-atual').value;
    const senhaNova = document.getElementById('perfil-admin-senha-nova').value;
    const senhaConfirmar = document.getElementById('perfil-admin-senha-confirmar').value;

    if (!nome || !email) {
        showToast('Preencha todos os campos obrigatórios (*)', 'warning');
        return;
    }

    // Validar senha se estiver tentando mudar
    if (senhaAtual || senhaNova || senhaConfirmar) {
        if (!senhaAtual) {
            showToast('Digite a senha atual para alterá-la', 'warning');
            return;
        }
        if (!senhaNova || senhaNova.length < 6) {
            showToast('A nova senha deve ter no mínimo 6 caracteres', 'warning');
            return;
        }
        if (senhaNova !== senhaConfirmar) {
            showToast('As senhas não coincidem', 'warning');
            return;
        }
    }

    const formData = {
        nome,
        email,
        telefone,
        foto: currentPerfilPhoto
    };

    // Adicionar senha se estiver mudando
    if (senhaAtual && senhaNova) {
        formData.senhaAtual = senhaAtual;
        formData.senhaNova = senhaNova;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        console.log('[PERFIL ADMIN] Enviando atualização de perfil para o servidor...');
        const response = await fetch(`/api/v1/usuarios/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar perfil');
        }

        const data = await response.json();
        console.log('[PERFIL ADMIN] Perfil atualizado no servidor:', data);

        // Atualizar localStorage com dados do servidor
        localStorage.setItem('user', JSON.stringify(data.user));

        console.log('[PERFIL ADMIN] Perfil atualizado. Chamando loadUserInfo()');
        showToast('Perfil atualizado com sucesso!', 'success');
        loadUserInfo(); // Atualizar info no menu
        document.getElementById('perfilAdminModal').classList.remove('active');
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        showToast(error.message || 'Erro ao atualizar perfil. Tente novamente.', 'error');
    }
}

// ===================================
// ATUALIZAR FUNÇÕES EXISTENTES COM TOAST
// ===================================

// ===================================
// COMANDA DO AGENDAMENTO
// ===================================

let agendamentoComandaAtual = {
    id: null,
    clienteNome: '',
    barbeiroId: null,
    itens: [],
    total: 0
};

async function abrirComandaAgendamento(agendamentoId, clienteNome, barbeiroId) {
    try {
        // Buscar dados completos do agendamento
        const response = await fetch(`/api/v1/horarios`);
        const horarios = await response.json();
        const agendamento = horarios.find(h => h.id === agendamentoId);

        if (!agendamento) {
            showToast('Agendamento não encontrado', 'error');
            return;
        }

        // Validar status do agendamento
        if (agendamento.status === 'cancelado') {
            showToast('Agendamento cancelado. Não é possível abrir comanda.', 'error');
            return;
        }

        if (agendamento.status === 'concluido') {
            showToast('Agendamento já foi concluído. Use a aba "Comandas" para gerenciar comandas.', 'info');
            return;
        }

        // Buscar dados do serviço - OBRIGATÓRIO para abrir comanda
        let servico = null;
        if (agendamento.servicoID) {
            try {
                const servicoResponse = await fetch(`/api/v1/servicos/${agendamento.servicoID}`);
                if (servicoResponse.ok) {
                    servico = await servicoResponse.json();
                } else {
                    console.warn(`Serviço ID ${agendamento.servicoID} não encontrado (deletado ou inativo)`);
                    showToast('Serviço do agendamento não está mais disponível. Use a aba "Comandas" para criar uma nova comanda.', 'warning');
                    return; // NÃO abre modal se serviço não existe
                }
            } catch (err) {
                console.error('Erro ao buscar serviço:', err);
                showToast('Erro ao buscar serviço. Tente novamente.', 'error');
                return;
            }
        } else {
            showToast('Agendamento sem serviço vinculado. Use a aba "Comandas" para criar uma nova comanda.', 'warning');
            return;
        }

        // Se chegou aqui, agendamento é válido e serviço existe
        agendamentoComandaAtual = {
            id: agendamentoId,
            clienteNome: clienteNome,
            barbeiroId: barbeiroId,
            servico: {
                id: servico.id,
                nome: servico.nome,
                preco: servico.preco
            },
            itens: [],
            total: servico.preco
        };

        // Preencher informações
        document.getElementById('comanda-agend-cliente').textContent = clienteNome;
        document.getElementById('comanda-agend-id').textContent = agendamentoId;
        document.getElementById('comanda-agend-servico').textContent = servico.nome;
        document.getElementById('comanda-agend-servico-preco').textContent = servico.preco.toFixed(2);

        // Carregar produtos disponíveis
        await carregarProdutosComanda();

        // Limpar lista de itens
        atualizarListaItensAgendamento();

        // Abrir modal
        document.getElementById('comandaAgendamentoModal').style.display = 'flex';
    } catch (error) {
        console.error('Erro ao abrir comanda:', error);
        showToast('Erro ao carregar dados do agendamento', 'error');
    }
}

function closeComandaAgendamentoModal() {
    document.getElementById('comandaAgendamentoModal').style.display = 'none';
    agendamentoComandaAtual = { id: null, clienteNome: '', barbeiroId: null, itens: [], total: 0 };
}

async function carregarProdutosComanda() {
    try {
        const response = await fetch('/api/v1/servicos');
        const servicos = await response.json();

        const select = document.getElementById('comanda-agend-produto');
        select.innerHTML = '<option value="">Selecione</option>';

        servicos
            .filter(s => s.tipo === 'produto' && s.ativo)
            .forEach(produto => {
                select.innerHTML += `<option value="${produto.id}" data-preco="${produto.preco}" data-nome="${produto.nome}">${produto.nome} - R$ ${produto.preco.toFixed(2)}</option>`;
            });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showToast('Erro ao carregar produtos', 'error');
    }
}

function adicionarProdutoAgendamento() {
    const select = document.getElementById('comanda-agend-produto');
    const qtd = parseInt(document.getElementById('comanda-agend-qtd').value);

    if (!select.value) {
        showToast('Selecione um produto', 'warning');
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const produtoId = parseInt(select.value);
    const nome = selectedOption.dataset.nome;
    const preco = parseFloat(selectedOption.dataset.preco);
    const subtotal = preco * qtd;

    // Verificar se já existe
    const existente = agendamentoComandaAtual.itens.find(i => i.id === produtoId);
    if (existente) {
        existente.quantidade += qtd;
        existente.subtotal = existente.quantidade * existente.preco;
    } else {
        agendamentoComandaAtual.itens.push({
            id: produtoId,
            nome: nome,
            preco: preco,
            quantidade: qtd,
            subtotal: subtotal
        });
    }

    // Recalcular total (serviço + produtos)
    const totalProdutos = agendamentoComandaAtual.itens.reduce((sum, item) => sum + item.subtotal, 0);
    const servicoPreco = agendamentoComandaAtual.servico ? agendamentoComandaAtual.servico.preco : 0;
    agendamentoComandaAtual.total = servicoPreco + totalProdutos;

    // Atualizar lista
    atualizarListaItensAgendamento();

    // Resetar form
    select.value = '';
    document.getElementById('comanda-agend-qtd').value = 1;

    showToast('Produto adicionado!', 'success');
}

function removerItemAgendamento(index) {
    agendamentoComandaAtual.itens.splice(index, 1);
    const totalProdutos = agendamentoComandaAtual.itens.reduce((sum, item) => sum + item.subtotal, 0);
    const servicoPreco = agendamentoComandaAtual.servico ? agendamentoComandaAtual.servico.preco : 0;
    agendamentoComandaAtual.total = servicoPreco + totalProdutos;
    atualizarListaItensAgendamento();
}

function atualizarListaItensAgendamento() {
    const container = document.getElementById('comanda-agend-itens-list');
    const totalEl = document.getElementById('comanda-agend-total');
    const totalProdutosEl = document.getElementById('comanda-agend-total-produtos');
    const servicoPrecoResumoEl = document.getElementById('comanda-agend-servico-preco-resumo');

    const totalProdutos = agendamentoComandaAtual.itens.reduce((sum, item) => sum + item.subtotal, 0);

    // Atualizar totais no resumo financeiro
    if (totalProdutosEl) {
        totalProdutosEl.textContent = totalProdutos.toFixed(2);
    }
    if (servicoPrecoResumoEl) {
        const servicoPreco = agendamentoComandaAtual.servico ? agendamentoComandaAtual.servico.preco : 0;
        servicoPrecoResumoEl.textContent = servicoPreco.toFixed(2);
    }
    totalEl.textContent = agendamentoComandaAtual.total.toFixed(2);

    // Renderizar lista de produtos
    if (agendamentoComandaAtual.itens.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum produto extra adicionado</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid rgba(13, 124, 164, 0.2);">
                    <th style="text-align: left; padding: 8px;">Produto</th>
                    <th style="text-align: center; padding: 8px;">Qtd</th>
                    <th style="text-align: right; padding: 8px;">Subtotal</th>
                    <th style="text-align: center; padding: 8px;">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${agendamentoComandaAtual.itens.map((item, index) => `
                    <tr style="border-bottom: 1px solid rgba(13, 124, 164, 0.1);">
                        <td style="padding: 12px 8px;">${item.nome}</td>
                        <td style="text-align: center; padding: 12px 8px;">${item.quantidade}</td>
                        <td style="text-align: right; padding: 12px 8px; font-weight: 600;">R$ ${item.subtotal.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'})}</td>
                        <td style="text-align: center; padding: 12px 8px;">
                            <button class="btn-icon delete" onclick="removerItemAgendamento(${index})" style="padding: 6px;" title="Remover produto">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

async function finalizarComandaAgendamento() {
    try {
        // Solicitar forma de pagamento
        const formaPagamento = await showFormaPagamentoModal();
        if (!formaPagamento) return; // Usuário cancelou

        // Criar comanda no backend
        const comandaData = {
            clienteNome: agendamentoComandaAtual.clienteNome,
            barbeiroId: agendamentoComandaAtual.barbeiroId
        };

        const createResponse = await fetch('/api/v1/comandas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comandaData)
        });

        if (!createResponse.ok) {
            throw new Error('Erro ao criar comanda');
        }

        const { id: comandaId } = await createResponse.json();

        // Adicionar serviço agendado como primeiro item (se existir)
        if (agendamentoComandaAtual.servico) {
            const servicoItem = {
                tipo: 'servico',
                itemId: agendamentoComandaAtual.servico.id,
                nome: agendamentoComandaAtual.servico.nome,
                quantidade: 1,
                precoUnitario: agendamentoComandaAtual.servico.preco
            };

            await fetch(`/api/v1/comandas/${comandaId}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(servicoItem)
            });
        }

        // Adicionar produtos extras
        for (const item of agendamentoComandaAtual.itens) {
            const produtoItem = {
                tipo: 'produto',
                itemId: item.id,
                nome: item.nome,
                quantidade: item.quantidade,
                precoUnitario: item.preco
            };

            await fetch(`/api/v1/comandas/${comandaId}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoItem)
            });
        }

        // Fechar comanda
        const fecharData = {
            formaPagamento: formaPagamento.metodo,
            observacoesPgto: formaPagamento.observacoes || ''
        };

        const fecharResponse = await fetch(`/api/v1/comandas/${comandaId}/fechar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fecharData)
        });

        if (!fecharResponse.ok) {
            throw new Error('Erro ao fechar comanda');
        }

        // Atualizar status do agendamento para "concluído"
        await fetch(`/api/v1/horarios/${agendamentoComandaAtual.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'concluido' })
        });

        showToast('Atendimento finalizado com sucesso! 💈', 'success');
        closeComandaAgendamentoModal();
        loadHorarios(); // Recarregar lista de horários

    } catch (error) {
        console.error('Erro ao finalizar comanda:', error);
        showToast('Erro ao finalizar atendimento', 'error');
    }
}

async function showFormaPagamentoModal() {
    return new Promise((resolve) => {
        const html = `
            <div class="modal-overlay" id="tempFormaPagModal" style="display: flex;">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2>Forma de Pagamento</h2>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Método de Pagamento *</label>
                            <select id="temp-forma-pag" required>
                                <option value="">Selecione...</option>
                                <option value="dinheiro">💵 Dinheiro</option>
                                <option value="pix">📱 PIX</option>
                                <option value="cartao">💳 Cartão</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Observações</label>
                            <textarea id="temp-obs-pag" rows="2" placeholder="Ex: Troco para R$ 100"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn-secondary" id="temp-cancel-pag">Cancelar</button>
                        <button class="btn-primary" id="temp-confirm-pag">Confirmar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const modal = document.getElementById('tempFormaPagModal');
        const selectEl = document.getElementById('temp-forma-pag');
        const obsEl = document.getElementById('temp-obs-pag');

        document.getElementById('temp-confirm-pag').addEventListener('click', () => {
            if (!selectEl.value) {
                showToast('Selecione a forma de pagamento', 'warning');
                return;
            }
            modal.remove();
            resolve({
                metodo: selectEl.value,
                observacoes: obsEl.value
            });
        });

        document.getElementById('temp-cancel-pag').addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });
    });
}

// ===================================
// SISTEMA DE CONFIRMAÇÃO CUSTOMIZADO
// ===================================

let confirmCallback = null;

function showConfirm(message, title = 'Confirmar') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('confirmModalTitle');
        const modalMessage = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalBtn');

        if (!modal) {
            console.error('Modal de confirmação não encontrado');
            resolve(false);
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = 'flex';

        // Remover listeners anteriores
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        // Adicionar novo listener
        newConfirmBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resolve(true);
        });

        // Callback global para fechar
        confirmCallback = () => {
            modal.style.display = 'none';
            resolve(false);
        };
    });
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
}

// ===================================
// MODAL DE EDIÇÃO DE SERVIÇO
// ===================================

function initEditServicoModal() {
    const modal = document.getElementById('editServicoModal');
    const closeBtn = document.getElementById('closeEditServicoModal');
    const cancelBtn = document.getElementById('cancelEditServico');
    const saveBtn = document.getElementById('saveEditServico');

    // Fechar modal
    const closeModal = () => {
        modal.style.display = 'none';
        editServiceFotoBase64 = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Fechar ao clicar fora
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Upload de foto
    const photoInput = document.getElementById('edit-service-photo');
    const removePhotoBtn = document.getElementById('edit-remove-service-photo');

    photoInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Selecione um arquivo de imagem válido', 'error');
            return;
        }

        const base64 = await fileToBase64(file);
        editServiceFotoBase64 = base64;

        const preview = document.getElementById('edit-service-photo-preview');
        const img = document.getElementById('edit-service-photo-img');
        if (preview && img) {
            img.src = base64;
            preview.style.display = 'flex';
            preview.style.alignItems = 'center';
            preview.style.gap = '12px';
        }
    });

    removePhotoBtn?.addEventListener('click', () => {
        editServiceFotoBase64 = '';
        document.getElementById('edit-service-photo').value = '';
        document.getElementById('edit-service-photo-preview').style.display = 'none';
        document.getElementById('edit-service-photo-img').src = '';
    });

    // Salvar alterações
    saveBtn?.addEventListener('click', async () => {
        const id = document.getElementById('edit-service-id').value;
        const formData = {
            nome: document.getElementById('edit-service-name').value,
            tipo: document.getElementById('edit-service-type').value,
            preco: parseFloat(document.getElementById('edit-service-price').value),
            duracao: parseInt(document.getElementById('edit-service-duration').value) || 0,
            descricao: document.getElementById('edit-service-description').value,
            foto: editServiceFotoBase64
        };

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';

            const response = await fetch(`/api/v1/servicos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showToast('Serviço/Produto atualizado com sucesso!', 'success');
                closeModal();
                loadServicos();
            } else {
                showToast('Erro ao salvar', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('Erro ao salvar', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar Alterações';
        }
    });
}

// Chamar as novas funções de inicialização
document.addEventListener('DOMContentLoaded', () => {
    initBarbeiroPhotoUpload();
    initPerfilPhotoUpload();
    initPerfilAdminModal();
    initEditServicoModal();
    initComandaAgendamentoModal();
});

// ===================================
// MODAL DE COMANDA DO AGENDAMENTO
// ===================================

function initComandaAgendamentoModal() {
    const closeBtn = document.getElementById('closeComandaAgendamentoModal');
    const modal = document.getElementById('comandaAgendamentoModal');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            closeComandaAgendamentoModal();
        });

        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeComandaAgendamentoModal();
            }
        });
    }
}
