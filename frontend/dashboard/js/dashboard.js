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
    loadUserInfo();
    loadDashboardData();
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
        document.getElementById('stat-hoje').textContent = todayBookings.length;
        document.getElementById('stat-semana').textContent = weekBookings.length;
        document.getElementById('stat-mes').textContent = monthBookings.length;

        // Calculate revenue (assuming average price of R$ 35)
        const revenue = monthBookings.filter(h => h.status === 'concluido').length * 35;
        document.getElementById('stat-total').textContent = `R$ ${revenue}`;

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
                            <button class="btn-icon edit" onclick="editBarbeiro(${barber.id})">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon delete" onclick="deleteBarbeiro(${barber.id})">
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
            alert('Barbeiro cadastrado com sucesso!');
            document.getElementById('barber-form').reset();
            loadBarbeiros();
        } else {
            alert('Erro ao cadastrar barbeiro');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar barbeiro');
    }
});

document.getElementById('clear-form')?.addEventListener('click', () => {
    document.getElementById('barber-form').reset();
});

async function editBarbeiro(id) {
    // Implementation for editing barber
    alert('Funcionalidade de edição em desenvolvimento');
}

async function deleteBarbeiro(id) {
    if (!confirm('Deseja realmente excluir este barbeiro?')) return;

    try {
        const response = await fetch(`/api/v1/barbeiros/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Barbeiro excluído com sucesso!');
            loadBarbeiros();
        } else {
            alert('Erro ao excluir barbeiro');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir barbeiro');
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
            alert('Status atualizado com sucesso!');
            loadHorarios();
        } else {
            alert('Erro ao atualizar status');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar status');
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

// Service Form
document.getElementById('service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nome: document.getElementById('service-name').value,
        tipo: document.getElementById('service-type').value,
        preco: parseFloat(document.getElementById('service-price').value),
        duracao: parseInt(document.getElementById('service-duration').value) || null,
        descricao: document.getElementById('service-description').value
    };

    try {
        const response = await fetch('/api/v1/servicos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Serviço/Produto cadastrado com sucesso!');
            document.getElementById('service-form').reset();
            loadServicos();
        } else {
            alert('Erro ao cadastrar');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar');
    }
});

document.getElementById('clear-service-form')?.addEventListener('click', () => {
    document.getElementById('service-form').reset();
});

async function editServico(id) {
    alert('Funcionalidade de edição em desenvolvimento');
}

async function deleteServico(id) {
    if (!confirm('Deseja realmente excluir este item?')) return;

    try {
        const response = await fetch(`/api/v1/servicos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Item excluído com sucesso!');
            loadServicos();
        } else {
            alert('Erro ao excluir');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir');
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
    const themeToggle = document.getElementById('theme-toggle-menu');

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

    // Theme toggle
    themeToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
    });
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

function loadUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Update profile info
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const profileInitial = document.querySelector('.profile-btn span');

        if (user.nome) {
            userName && (userName.textContent = user.nome);
            userEmail && (userEmail.textContent = user.email || '');
            profileInitial && (profileInitial.textContent = user.nome.charAt(0).toUpperCase());
        }

        // Update theme text
        updateThemeText();
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
}

function toggleTheme() {
    const body = document.body;
    const isLightMode = body.classList.contains('light-mode');

    if (isLightMode) {
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    }

    updateThemeText();
}

function updateThemeText() {
    const themeText = document.getElementById('theme-text');
    const isLightMode = document.body.classList.contains('light-mode');

    if (themeText) {
        themeText.textContent = isLightMode ? 'Tema Escuro' : 'Tema Claro';
    }
}

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
