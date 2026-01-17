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

function init() {
    initNavigation();
    initMobileMenu();
    initProfileDropdown();
    initNotifications();
    initEditBarbeiroModal(); // Modal de edição de barbeiro
    initEditServicoModal(); // Modal de edição de serviço/produto
    initHorariosModal(); // Modal de horários de trabalho
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
        'galeria': 'Galeria de Imagens'
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
        const statHoje = document.getElementById('stat-hoje');
        const statSemana = document.getElementById('stat-semana');
        const statMes = document.getElementById('stat-mes');

        if (statHoje) statHoje.textContent = todayBookings.length;
        if (statSemana) statSemana.textContent = weekBookings.length;
        if (statMes) statMes.textContent = monthBookings.length;

        // Calculate revenue (assuming average price of R$ 35)
        // COMENTADO: Card de receita não está sendo usado no momento
        // const revenue = monthBookings.filter(h => h.status === 'concluido').length * 35;
        // const statTotal = document.getElementById('stat-total');
        // if (statTotal) statTotal.textContent = `R$ ${revenue}`;

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
        especialidade: document.getElementById('barber-specialty').value
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
    if (!confirm('Deseja realmente excluir este barbeiro?')) return;

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
    // const pending = horarios.filter(h => h.status === 'pendente'); // COMENTADO: Aprovação automática
    // displayPendingBookings(pending); // COMENTADO: Aprovação automática
    displayAllBookings(horarios);
}

/* FUNÇÃO COMENTADA - Aprovação automática de agendamentos está ativada
   Descomentar se quiser habilitar aprovação manual de agendamentos
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
*/

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
                </tr>
            </thead>
            <tbody>
                ${bookings.map(booking => `
                    <tr>
                        <td>${booking.nomeCliente || booking.cliente_nome}</td>
                        <td>${booking.telefone}</td>
                        <td>${formatDateTime(booking.dataHora || booking.data_hora)}</td>
                        <td><span class="status-badge ${booking.status}">${getStatusText(booking.status)}</span></td>
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
                        <td>${service.nome}</td>
                        <td>${service.tipo === 'servico' ? 'Serviço' : 'Produto'}</td>
                        <td>R$ ${service.preco}</td>
                        <td>${service.duracao ? service.duracao + ' min' : '-'}</td>
                        <td class="table-actions">
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
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Service Form (criação)
document.getElementById('service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nome: document.getElementById('service-name').value,
        tipo: document.getElementById('service-type').value,
        preco: parseFloat(document.getElementById('service-price').value),
        duracao: parseInt(document.getElementById('service-duration').value) || 0,
        descricao: document.getElementById('service-description').value
    };

    // Adicionar foto se houver
    if (currentServicoPhoto) {
        formData.foto = currentServicoPhoto;
    }

    try {
        const response = await fetch('/api/v1/servicos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showToast('Serviço/Produto cadastrado com sucesso!', 'success');
            document.getElementById('service-form').reset();

            // Resetar preview da foto
            currentServicoPhoto = null;
            const previewImg = document.getElementById('create-servico-preview-img');
            const placeholder = document.getElementById('create-servico-photo-placeholder');
            if (previewImg) previewImg.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';

            loadServicos();
        } else {
            showToast('Erro ao cadastrar', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao cadastrar', 'error');
    }
});

document.getElementById('clear-service-form')?.addEventListener('click', () => {
    document.getElementById('service-form').reset();

    // Resetar preview da foto
    currentServicoPhoto = null;
    const previewImg = document.getElementById('create-servico-preview-img');
    const placeholder = document.getElementById('create-servico-photo-placeholder');
    if (previewImg) previewImg.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
});

let currentServicoPhoto = null; // Base64 da foto do serviço (criação)
let currentServicoPhotoEdit = null; // Base64 da foto do serviço (edição)

// Função para EDITAR serviço/produto (abre modal)
async function editServico(id) {
    const servico = servicos.find(s => s.id === id);
    if (!servico) {
        showToast('Serviço/Produto não encontrado', 'error');
        return;
    }

    // Preencher formulário do modal com dados do serviço
    document.getElementById('edit-servico-id').value = servico.id;
    document.getElementById('edit-servico-name').value = servico.nome;
    document.getElementById('edit-servico-type').value = servico.tipo || 'servico';
    document.getElementById('edit-servico-price').value = servico.preco;
    document.getElementById('edit-servico-duration').value = servico.duracao || '';
    document.getElementById('edit-servico-description').value = servico.descricao || '';

    // Resetar preview de foto
    const previewImg = document.getElementById('edit-servico-preview-img');
    const placeholder = document.getElementById('edit-servico-photo-placeholder');

    if (servico.foto) {
        currentServicoPhotoEdit = servico.foto;
        previewImg.src = servico.foto;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        currentServicoPhotoEdit = null;
        previewImg.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    // Abrir modal de edição
    document.getElementById('editServicoModal').classList.add('active');
}

async function deleteServico(id) {
    if (!confirm('Deseja realmente excluir este item?')) return;

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
    const profileBtnDesktop = document.getElementById('profile-btn-desktop');
    const profileMenuDesktop = document.getElementById('profile-menu-desktop');

    // Toggle profile menu (mobile)
    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu?.classList.toggle('active');
    });

    // Toggle profile menu (desktop)
    profileBtnDesktop?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenuDesktop?.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-dropdown')) {
            profileMenu?.classList.remove('active');
            profileMenuDesktop?.classList.remove('active');
        }
    });
}

function initNotifications() {
    const notifBtn = document.getElementById('notif-btn');
    const notifBtnDesktop = document.getElementById('notif-btn-desktop');
    const notifPanel = document.getElementById('notifications-panel');
    const closeBtn = document.getElementById('close-notif');

    // Open notifications panel (mobile)
    notifBtn?.addEventListener('click', () => {
        notifPanel?.classList.add('active');
        loadNotifications();
    });

    // Open notifications panel (desktop)
    notifBtnDesktop?.addEventListener('click', () => {
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

function loadUserInfo() {
    console.log('[LOAD USER INFO] Carregando informações do usuário');
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('[LOAD USER INFO] Usuário carregado:', {
            id: user.id,
            nome: user.nome,
            email: user.email,
            temFoto: !!user.foto,
            tamanhoFoto: user.foto ? user.foto.length : 0
        });

        // Update profile info (mobile)
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const profilePhoto = document.getElementById('profile-btn-img');
        const profileIcon = document.getElementById('profile-btn-icon');

        // Update profile info (desktop)
        const userNameDesktop = document.getElementById('user-name-desktop');
        const userEmailDesktop = document.getElementById('user-email-desktop');
        const profilePhotoDesktop = document.getElementById('profile-btn-img-desktop');
        const profileIconDesktop = document.getElementById('profile-btn-icon-desktop');

        console.log('[LOAD USER INFO] Elementos encontrados:', {
            mobile: {
                userName: !!userName,
                userEmail: !!userEmail,
                profilePhoto: !!profilePhoto,
                profileIcon: !!profileIcon
            },
            desktop: {
                userNameDesktop: !!userNameDesktop,
                userEmailDesktop: !!userEmailDesktop,
                profilePhotoDesktop: !!profilePhotoDesktop,
                profileIconDesktop: !!profileIconDesktop
            }
        });

        if (user.nome) {
            userName && (userName.textContent = user.nome);
            userEmail && (userEmail.textContent = user.email || '');
            userNameDesktop && (userNameDesktop.textContent = user.nome);
            userEmailDesktop && (userEmailDesktop.textContent = user.email || '');
            console.log('[LOAD USER INFO] Nome e email atualizados');
        }

        // Update profile photo (mobile)
        if (user.foto && profilePhoto && profileIcon) {
            console.log('[LOAD USER INFO] Exibindo foto do perfil (mobile)');
            profilePhoto.src = user.foto;
            profilePhoto.style.display = 'block';
            profileIcon.style.display = 'none';
        } else if (profilePhoto && profileIcon) {
            console.log('[LOAD USER INFO] Exibindo ícone padrão (mobile)');
            profilePhoto.style.display = 'none';
            profileIcon.style.display = 'block';
        }

        // Update profile photo (desktop)
        if (user.foto && profilePhotoDesktop && profileIconDesktop) {
            console.log('[LOAD USER INFO] Exibindo foto do perfil (desktop)');
            profilePhotoDesktop.src = user.foto;
            profilePhotoDesktop.style.display = 'block';
            profileIconDesktop.style.display = 'none';
        } else if (profilePhotoDesktop && profileIconDesktop) {
            console.log('[LOAD USER INFO] Exibindo ícone padrão (desktop)');
            profilePhotoDesktop.style.display = 'none';
            profileIconDesktop.style.display = 'block';
        }
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
    const notifBadgeDesktop = document.getElementById('notif-badge-desktop');

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

        // Update badge count (mobile)
        const unreadCount = notifications.filter(n => !n.lida).length;
        if (notifBadge) {
            notifBadge.textContent = unreadCount;
            notifBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        // Update badge count (desktop)
        if (notifBadgeDesktop) {
            notifBadgeDesktop.textContent = unreadCount;
            notifBadgeDesktop.style.display = unreadCount > 0 ? 'flex' : 'none';
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
            especialidade: document.getElementById('edit-barber-specialty').value
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

// ===================================
// MODAL DE EDIÇÃO DE SERVIÇO/PRODUTO
// ===================================

function initEditServicoModal() {
    const modal = document.getElementById('editServicoModal');
    const closeBtn = document.getElementById('closeEditServicoModal');
    const cancelBtn = document.getElementById('cancelEditServico');
    const saveBtn = document.getElementById('saveEditServico');

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
        const id = document.getElementById('edit-servico-id').value;
        const formData = {
            nome: document.getElementById('edit-servico-name').value,
            tipo: document.getElementById('edit-servico-type').value,
            preco: parseFloat(document.getElementById('edit-servico-price').value),
            duracao: parseInt(document.getElementById('edit-servico-duration').value) || 0,
            descricao: document.getElementById('edit-servico-description').value
        };

        if (!formData.nome || !formData.tipo || !formData.preco) {
            showToast('Preencha todos os campos obrigatórios (*)', 'warning');
            return;
        }

        // Adicionar foto se houver
        if (currentServicoPhotoEdit) {
            formData.foto = currentServicoPhotoEdit;
        }

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
                loadServicos(); // Recarregar lista
                currentServicoPhotoEdit = null; // Resetar foto
            } else {
                const error = await response.text();
                showToast(`Erro ao atualizar: ${error}`, 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('Erro ao atualizar. Tente novamente.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar Alterações';
        }
    });
}

// ===================================
// MODAL DE HORÁRIOS
// ===================================

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

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentBarbeiroPhoto = e.target.result;
            previewImg.src = currentBarbeiroPhoto;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
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

    fileInput.addEventListener('change', (e) => {
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

        if (!file.type.startsWith('image/')) {
            console.error('[PERFIL ADMIN] Arquivo não é uma imagem:', file.type);
            showToast('Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }

        console.log('[PERFIL ADMIN] Iniciando leitura do arquivo...');
        const reader = new FileReader();

        reader.onload = (e) => {
            const base64 = e.target.result;
            console.log('[PERFIL ADMIN] Arquivo convertido para base64');
            console.log('[PERFIL ADMIN] Tamanho do base64:', base64.length, 'caracteres');
            console.log('[PERFIL ADMIN] Preview dos primeiros 100 chars:', base64.substring(0, 100));

            currentPerfilPhoto = base64;
            previewImg.src = base64;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';

            console.log('[PERFIL ADMIN] Preview atualizado com sucesso');
        };

        reader.onerror = (error) => {
            console.error('[PERFIL ADMIN] Erro ao ler arquivo:', error);
            showToast('Erro ao processar imagem', 'error');
        };

        reader.readAsDataURL(file);
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
    const perfilMenuItems = document.querySelectorAll('.profile-edit-link');

    // Abrir modal ao clicar em "Meu Perfil" (tanto mobile quanto desktop)
    perfilMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            openPerfilAdminModal();
        });
    });

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
    console.log('[PERFIL ADMIN] Abrindo modal de perfil');
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('[PERFIL ADMIN] Dados do usuário carregados:', {
            id: user.id,
            nome: user.nome,
            email: user.email,
            telefone: user.telefone,
            temFoto: !!user.foto,
            tamanhoFoto: user.foto ? user.foto.length : 0
        });

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
            console.log('[PERFIL ADMIN] Carregando foto existente do usuário');
            console.log('[PERFIL ADMIN] Preview da foto (100 chars):', user.foto.substring(0, 100));
            previewImg.src = user.foto;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            console.log('[PERFIL ADMIN] Usuário não possui foto, mostrando placeholder');
            previewImg.style.display = 'none';
            placeholder.style.display = 'flex';
        }

        currentPerfilPhoto = user.foto || null;
        console.log('[PERFIL ADMIN] currentPerfilPhoto definido:', !!currentPerfilPhoto);

        // Abrir modal
        document.getElementById('perfilAdminModal').classList.add('active');
        console.log('[PERFIL ADMIN] Modal aberto com sucesso');
    } catch (error) {
        console.error('[PERFIL ADMIN] Erro ao abrir perfil:', error);
        showToast('Erro ao carregar dados do perfil', 'error');
    }
}

async function savePerfilAdmin() {
    console.log('[PERFIL ADMIN] Iniciando salvamento do perfil');

    const nome = document.getElementById('perfil-admin-name').value;
    const email = document.getElementById('perfil-admin-email').value;
    const telefone = document.getElementById('perfil-admin-phone').value;
    const senhaAtual = document.getElementById('perfil-admin-senha-atual').value;
    const senhaNova = document.getElementById('perfil-admin-senha-nova').value;
    const senhaConfirmar = document.getElementById('perfil-admin-senha-confirmar').value;

    console.log('[PERFIL ADMIN] Dados do formulário:', {
        nome,
        email,
        telefone,
        temSenhaAtual: !!senhaAtual,
        temSenhaNova: !!senhaNova,
        temSenhaConfirmar: !!senhaConfirmar,
        temFoto: !!currentPerfilPhoto,
        tamanhoFoto: currentPerfilPhoto ? currentPerfilPhoto.length : 0
    });

    if (!nome || !email) {
        console.warn('[PERFIL ADMIN] Validação falhou: campos obrigatórios vazios');
        showToast('Preencha todos os campos obrigatórios (*)', 'warning');
        return;
    }

    // Validar senha se estiver tentando mudar
    if (senhaAtual || senhaNova || senhaConfirmar) {
        console.log('[PERFIL ADMIN] Validando alteração de senha');
        if (!senhaAtual) {
            console.warn('[PERFIL ADMIN] Senha atual não fornecida');
            showToast('Digite a senha atual para alterá-la', 'warning');
            return;
        }
        if (!senhaNova || senhaNova.length < 6) {
            console.warn('[PERFIL ADMIN] Senha nova inválida (< 6 caracteres)');
            showToast('A nova senha deve ter no mínimo 6 caracteres', 'warning');
            return;
        }
        if (senhaNova !== senhaConfirmar) {
            console.warn('[PERFIL ADMIN] Senhas não coincidem');
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
        console.log('[PERFIL ADMIN] Senha será atualizada');
    }

    console.log('[PERFIL ADMIN] Dados preparados para envio:', {
        ...formData,
        senhaAtual: formData.senhaAtual ? '***' : undefined,
        senhaNova: formData.senhaNova ? '***' : undefined,
        foto: formData.foto ? `${formData.foto.substring(0, 50)}... (${formData.foto.length} chars)` : null
    });

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('[PERFIL ADMIN] Usuário atual:', {
            id: user.id,
            nome: user.nome,
            email: user.email
        });

        // TODO: Implementar endpoint de atualização de perfil
        // const response = await fetch(`/api/v1/usuarios/${user.id}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });

        // if (!response.ok) throw new Error('Erro ao atualizar perfil');

        console.log('[PERFIL ADMIN] Atualizando localStorage (modo mock - endpoint não implementado)');

        // Atualizar localStorage (mock)
        user.nome = nome;
        user.email = email;
        user.telefone = telefone;
        if (currentPerfilPhoto) {
            console.log('[PERFIL ADMIN] Salvando foto no localStorage');
            user.foto = currentPerfilPhoto;
        } else {
            console.log('[PERFIL ADMIN] Nenhuma foto para salvar');
        }

        const userJson = JSON.stringify(user);
        console.log('[PERFIL ADMIN] Tamanho total do objeto user:', userJson.length, 'caracteres');

        localStorage.setItem('user', userJson);
        console.log('[PERFIL ADMIN] localStorage atualizado com sucesso');

        // Verificar se foi salvo corretamente
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('[PERFIL ADMIN] Verificação pós-salvamento:', {
            salvou: true,
            temFoto: !!savedUser.foto,
            tamanhoFoto: savedUser.foto ? savedUser.foto.length : 0
        });

        showToast('Perfil atualizado com sucesso!', 'success');
        loadUserInfo(); // Atualizar info no menu
        document.getElementById('perfilAdminModal').classList.remove('active');
        console.log('[PERFIL ADMIN] Perfil salvo e modal fechado');
    } catch (error) {
        console.error('[PERFIL ADMIN] Erro ao salvar perfil:', error);
        console.error('[PERFIL ADMIN] Stack trace:', error.stack);
        showToast('Erro ao atualizar perfil. Tente novamente.', 'error');
    }
}

// ===================================
// ATUALIZAR FUNÇÕES EXISTENTES COM TOAST
// ===================================

// Upload de foto no formulário de CRIAR serviço/produto
function initCreateServicoPhotoUpload() {
    const uploadArea = document.getElementById('create-servico-photo-upload');
    const fileInput = document.getElementById('create-servico-photo');
    const previewImg = document.getElementById('create-servico-preview-img');
    const placeholder = document.getElementById('create-servico-photo-placeholder');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentServicoPhoto = e.target.result;
            previewImg.src = currentServicoPhoto;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });
}

// Upload de foto no modal de EDITAR serviço/produto
function initEditServicoPhotoUpload() {
    const uploadArea = document.getElementById('edit-servico-photo-upload');
    const fileInput = document.getElementById('edit-servico-photo');
    const previewImg = document.getElementById('edit-servico-preview-img');
    const placeholder = document.getElementById('edit-servico-photo-placeholder');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentServicoPhotoEdit = e.target.result;
            previewImg.src = currentServicoPhotoEdit;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });
}

// Chamar as novas funções de inicialização
document.addEventListener('DOMContentLoaded', () => {
    initBarbeiroPhotoUpload();
    initCreateServicoPhotoUpload(); // Upload no formulário de criação
    initEditServicoPhotoUpload(); // Upload no modal de edição
    initPerfilPhotoUpload();
    initPerfilAdminModal();
});
