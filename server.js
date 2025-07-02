const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const helmet = require('helmet');


const { body, validationResult } = require('express-validator');

// Redireciona console.log e console.error para um arquivo de log
const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
console.log = function(d) { logStream.write(d + '\n'); process.stdout.write(d + '\n'); };
console.error = function(d) { logStream.write(d + '\n'); process.stderr.write(d + '\n'); };

const { db, initializeDatabase, runAsync, getAsync, allAsync } = require('./database');
const AppError = require('./utils/AppError');
const notificationService = require('./utils/notificationService');
const whatsappService = require('./utils/whatsappService');


const app = express();
const PORT = 3005;

// Configura o EJS como motor de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());
app.use(session({
    secret: 'barbershop-secret-key-super-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Inicializa o banco de dados
initializeDatabase();

// Função para renderizar páginas com o template
const renderPage = (res, req, pagePath, options = {}) => {
    const defaults = {
        TITLE: 'Barbearia Silva',
        USER_TYPE: req.session.isAdmin ? 'Administrador' : 'Cliente',
        isAdmin: req.session.isAdmin // Pass isAdmin to the template
    };

    const finalData = { ...defaults, ...options };

    res.render('template', { ...finalData, contentPage: pagePath });
};

// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        return next(new AppError('Acesso negado. Você precisa ser um administrador.', 403));
    }
    next();
};

// Rotas de Autenticação
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect(req.session.isAdmin ? '/admin/dashboard' : '/home');
    }
    renderPage(res, req, 'auth/login.html', { TITLE: 'Login', DRAWER_ITEMS: '', BOTTOM_NAV: '' });
});

app.get('/register', (req, res) => {
    renderPage(res, req, 'auth/register.html', { TITLE: 'Cadastro', DRAWER_ITEMS: '', BOTTOM_NAV: '' });
});

app.get('/forgot-password', (req, res) => {
    renderPage(res, req, 'auth/forgot-password.html', { TITLE: 'Recuperar Senha', DRAWER_ITEMS: '', BOTTOM_NAV: '' });
});

// Rotas do Usuário
app.get('/home', requireAuth, (req, res) => {
    renderPage(res, req, 'user/home.html', { TITLE: 'Início' });
});

app.get('/booking', requireAuth, (req, res) => {
    renderPage(res, req, 'user/booking.html', { TITLE: 'Novo Agendamento' });
});

app.get('/appointments', requireAuth, (req, res) => {
    renderPage(res, req, 'user/appointments.html', { TITLE: 'Meus Agendamentos' });
});

app.get('/profile', requireAuth, (req, res) => {
    renderPage(res, req, 'user/profile.html', { TITLE: 'Meu Perfil' });
});

app.get('/gallery', requireAuth, (req, res) => {
    renderPage(res, req, 'user/gallery.html', { TITLE: 'Galeria' });
});

app.get('/reviews', requireAuth, (req, res) => {
    renderPage(res, req, 'user/reviews.html', { TITLE: 'Avaliações' });
});

// Rotas do Admin
app.get('/admin/dashboard', requireAuth, requireAdmin, (req, res) => {
    renderPage(res, req, 'admin/dashboard.html', { TITLE: 'Dashboard' });
});

app.get('/admin/add-barber', requireAuth, requireAdmin, (req, res) => {
    renderPage(res, req, 'admin/add-barber.html', { TITLE: 'Adicionar Barbeiro' });
});

app.get('/admin/add-service', requireAuth, requireAdmin, (req, res) => {
    renderPage(res, req, 'admin/add-service.html', { TITLE: 'Adicionar Serviço' });
});

app.get('/admin/barber-hours', requireAuth, requireAdmin, (req, res) => {
    renderPage(res, req, 'admin/barber-hours.html', { TITLE: 'Horários dos Barbeiros' });
});

app.get('/admin/manage-barbers', requireAuth, requireAdmin, (req, res) => {
    renderPage(res, req, 'admin/manage-barbers.html', { TITLE: 'Gerenciar Barbeiros' });
});

app.get('/admin/manage-services', requireAuth, requireAdmin, (req, res) => {
    renderPage(res, req, 'screens/admin/manage-services', { TITLE: 'Gerenciar Serviços' });
});

app.get('/admin/appointments', requireAuth, requireAdmin, (req, res) => {
    renderPage(res, req, 'screens/admin/admin-appointments.ejs', { TITLE: 'Todos Agendamentos' });
});

// API Routes (com mensagens traduzidas)
app.post('/api/register', [
    body('firstName').notEmpty().withMessage('O primeiro nome é obrigatório.'),
    body('lastName').notEmpty().withMessage('O sobrenome é obrigatório.'),
    body('email').isEmail().withMessage('O e-mail deve ser válido.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres.'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('ID da localização inválido.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }
    try {
        const { firstName, lastName, email, password, locationId = 1 } = req.body; // Default to 1
        const existingUser = await getAsync("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser) {
            return next(new AppError('Este e-mail já está cadastrado.', 400));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await runAsync("INSERT INTO users (firstName, lastName, email, password, locationId) VALUES (?, ?, ?, ?, ?)",
            [firstName, lastName, email, hashedPassword, locationId]);
        res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        next(error);
    }
});

app.post('/api/login', [
    body('email').isEmail().withMessage('O e-mail deve ser válido.').normalizeEmail(),
    body('password').notEmpty().withMessage('A senha é obrigatória.')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError(errors.array()[0].msg, 400));
        }

        const { email, password, isAdmin } = req.body;

        const table = isAdmin ? 'admins' : 'users';
        const query = `SELECT * FROM ${table} WHERE email = ?`;

        const user = await getAsync(query, [email]);

        if (!user || !await bcrypt.compare(password, user.password)) {
            return next(new AppError('E-mail ou senha inválidos.', 401));
        }

        req.session.userId = user.id;
        req.session.isAdmin = isAdmin;
        req.session.locationId = user.locationId || 1; // Store locationId in session

        if (!isAdmin) {
            req.session.userName = `${user.firstName} ${user.lastName}`;
        }

        const redirectUrl = isAdmin ? '/admin/dashboard' : '/home';
        res.json({ redirect: redirectUrl });
    } catch (error) {
        next(error);
    }
});

app.post('/api/logout', async (req, res, next) => {
    try {
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        res.json({ message: 'Logout realizado com sucesso.' });
    } catch (err) {
        return next(new AppError('Não foi possível fazer logout.', 500));
    }
});

app.get('/api/user', requireAuth, async (req, res, next) => {
    try {
        const user = await getAsync("SELECT id, firstName, lastName, email, phone, birthdate, profilePhoto, locationId FROM users WHERE id = ?",
            [req.session.userId]);
        if (!user) {
            return next(new AppError('Usuário não encontrado.', 404));
        }
        res.json(user);
    } catch (err) {
        return next(new AppError('Erro ao buscar usuário.', 500));
    }
});

app.put('/api/user', requireAuth, upload.single('profilePhoto'), [
    body('firstName').optional().notEmpty().withMessage('O primeiro nome não pode ser vazio.'),
    body('lastName').optional().notEmpty().withMessage('O sobrenome não pode ser vazio.'),
    body('phone').optional().isMobilePhone('any').withMessage('Telefone inválido.'),
    body('birthdate').optional().isISO8601().toDate().withMessage('Data de nascimento inválida.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { firstName, lastName, phone, birthdate } = req.body;
        let query = "UPDATE users SET firstName = ?, lastName = ?, phone = ?, birthdate = ?";
        let params = [firstName, lastName, phone, birthdate];

        // Fetch current user data to get old profile photo path
        const user = await getAsync("SELECT profilePhoto FROM users WHERE id = ?", [req.session.userId]);

        if (req.file) {
            // If a new photo is uploaded, delete the old one if it exists
            if (user && user.profilePhoto) {
                const oldPhotoPath = path.join(__dirname, 'public', user.profilePhoto);
                fs.unlink(oldPhotoPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Erro ao deletar foto de perfil antiga:', unlinkErr);
                    }
                });
            }
            query += ", profilePhoto = ?";
            params.push('/uploads/' + req.file.filename);
        }
        query += " WHERE id = ?";
        params.push(req.session.userId);

        await runAsync(query, params);
        req.session.userName = `${firstName} ${lastName}`;
        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
        next(new AppError('Erro ao atualizar o perfil.', 500));
    }
});

app.get('/api/services', async (req, res, next) => {
    try {
        let query = "SELECT * FROM services";
        const params = [];

        if (!req.session.isAdmin) {
            query += " WHERE locationId = ?";
            params.push(req.session.locationId);
        }

        const services = await allAsync(query, params);
        res.json(services);
    } catch (err) {
        return next(new AppError('Erro ao buscar os serviços.', 500));
    }
});

app.post('/api/admin/services', requireAuth, requireAdmin, [
    body('name').notEmpty().withMessage('O nome do serviço é obrigatório.'),
    body('duration').isInt({ min: 1 }).withMessage('A duração deve ser um número inteiro positivo.'),
    body('price').isFloat({ min: 0 }).withMessage('O preço deve ser um número positivo.'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('ID da localização inválido.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { name, description, duration, price, locationId = req.session.locationId } = req.body;
        const result = await runAsync("INSERT INTO services (name, description, duration, price, locationId) VALUES (?, ?, ?, ?, ?)",
            [name, description, duration, price, locationId]);
        res.json({ message: 'Serviço adicionado com sucesso!', id: result.lastID });
    } catch (err) {
        return next(new AppError('Erro ao adicionar o serviço.', 500));
    }
});

app.put('/api/admin/services/:id', requireAuth, requireAdmin, [
    body('name').notEmpty().withMessage('O nome do serviço é obrigatório.'),
    body('duration').isInt({ min: 1 }).withMessage('A duração deve ser um número inteiro positivo.'),
    body('price').isFloat({ min: 0 }).withMessage('O preço deve ser um número positivo.'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('ID da localização inválido.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { id } = req.params;
        const { name, description, duration, price, locationId } = req.body;
        let query = "UPDATE services SET name = ?, description = ?, duration = ?, price = ?";
        let params = [name, description, duration, price];
        if (locationId) {
            query += ", locationId = ?";
            params.push(locationId);
        }
        query += " WHERE id = ?";
        params.push(id);

        await runAsync(query, params);
        res.json({ message: 'Serviço atualizado com sucesso!' });
    } catch (err) {
        return next(new AppError('Erro ao atualizar o serviço.', 500));
    }
});

app.delete('/api/admin/services/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const { id } = req.params;
    try {
        await runAsync("DELETE FROM services WHERE id = ?", [id]);
        res.json({ message: 'Serviço deletado com sucesso!' });
    } catch (err) {
        return next(new AppError('Erro ao deletar o serviço.', 500));
    }
});

app.get('/api/barbers', async (req, res, next) => {
    try {
        let query = "SELECT * FROM barbers";
        const params = [];

        if (!req.session.isAdmin) {
            query += " WHERE locationId = ?";
            params.push(req.session.locationId);
        }

        const barbers = await allAsync(query, params);
        res.json(barbers);
    } catch (err) {
        return next(new AppError('Erro ao buscar os barbeiros.', 500));
    }
});

app.post('/api/admin/barbers', requireAuth, requireAdmin, [
    body('name').notEmpty().withMessage('O nome do barbeiro é obrigatório.'),
    body('contact').optional().isMobilePhone('any').withMessage('Contato inválido.'),
    body('specialties').optional().notEmpty().withMessage('Especialidades não podem ser vazias.'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('ID da localização inválido.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { name, contact, specialties, locationId = req.session.locationId } = req.body;
        const result = await runAsync("INSERT INTO barbers (name, contact, specialties, locationId) VALUES (?, ?, ?, ?)",
            [name, contact, specialties, locationId]);
        res.json({ message: 'Barbeiro adicionado com sucesso!', id: result.lastID });
    } catch (err) {
        return next(new AppError('Erro ao adicionar o barbeiro.', 500));
    }
});

app.put('/api/admin/barbers/:id', requireAuth, requireAdmin, [
    body('name').notEmpty().withMessage('O nome do barbeiro é obrigatório.'),
    body('contact').optional().isMobilePhone('any').withMessage('Contato inválido.'),
    body('specialties').optional().notEmpty().withMessage('Especialidades não podem ser vazias.'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('ID da localização inválido.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { id } = req.params;
        const { name, contact, specialties, locationId } = req.body;
        let query = "UPDATE barbers SET name = ?, contact = ?, specialties = ?";
        let params = [name, contact, specialties];
        if (locationId) {
            query += ", locationId = ?";
            params.push(locationId);
        }
        query += " WHERE id = ?";
        params.push(id);

        await runAsync(query, params);
        res.json({ message: 'Barbeiro atualizado com sucesso!' });
    } catch (err) {
        return next(new AppError('Erro ao atualizar o barbeiro.', 500));
    }
});

app.delete('/api/admin/barbers/:id', requireAuth, requireAdmin, async (req, res, next) => {
    const { id } = req.params;
    try {
        await runAsync("DELETE FROM barbers WHERE id = ?", [id]);
        res.json({ message: 'Barbeiro deletado com sucesso!' });
    } catch (err) {
        return next(new AppError('Erro ao deletar o barbeiro.', 500));
    }
});

app.post('/api/appointments', requireAuth, [
    body('service').notEmpty().withMessage('O serviço é obrigatório.'),
    body('date').isISO8601().toDate().withMessage('Data inválida.'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida (formato HH:MM).'),
    body('barberId').isInt({ min: 1 }).withMessage('Barbeiro inválido.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { service, date, time, barberId } = req.body;
        const locationId = req.session.locationId; // Get locationId from session
        await runAsync(`INSERT INTO appointments (userId, userName, userEmail, service, date, time, barberId, locationId) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, // Add locationId to insert statement
            [req.session.userId, req.session.userName, req.session.userEmail, service, date, time, barberId, locationId]
        );
        await runAsync("UPDATE services SET count = count + 1 WHERE name = ?", [service]);
        await runAsync("UPDATE barbers SET services = services + 1 WHERE id = ?", [barberId]);
        // Envia notificação de novo agendamento
        notificationService.sendEmail(
            req.session.userEmail,
            'Agendamento Confirmado - Barbearia Silva',
            `Olá ${req.session.userName},

Seu agendamento para ${service} com o barbeiro ${barberId} em ${date} às ${time} foi confirmado.

Atenciosamente,
Equipe Barbearia Silva`
        );
        // Envia notificação WhatsApp de novo agendamento
        whatsappService.sendMessage(
            req.session.userPhone, // Assumindo que userPhone está na sessão ou pode ser buscado
            `Olá ${req.session.userName}, seu agendamento para ${service} com o barbeiro ${barberId} em ${date} às ${time} foi confirmado. Barbearia Silva.`
        );
        res.json({ message: 'Agendamento realizado com sucesso!', id: this.lastID });
    } catch (err) {
        return next(new AppError('Erro ao criar o agendamento.', 500));
    }
});

app.get('/api/appointments', requireAuth, async (req, res, next) => {
    try {
        let query = `SELECT a.*, b.name as barberName FROM appointments a LEFT JOIN barbers b ON a.barberId = b.id`;
        const params = [];

        if (req.session.isAdmin) {
            // Admins can see all appointments or filter by locationId if provided
            if (req.query.locationId) {
                query += ` WHERE a.locationId = ?`;
                params.push(req.query.locationId);
            }
        } else {
            // Regular users only see their appointments for their location
            query += ` WHERE a.userId = ? AND a.locationId = ?`;
            params.push(req.session.userId, req.session.locationId);
        }

        query += ` ORDER BY a.date DESC, a.time DESC`;

        const appointments = await allAsync(query, params);
        res.json(appointments);
    } catch (err) {
        return next(new AppError('Erro ao buscar agendamentos.', 500));
    }
});

app.put('/api/appointments/:id/status', requireAuth, requireAdmin, [
    body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Status inválido.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { status } = req.body;
        await runAsync("UPDATE appointments SET status = ? WHERE id = ?", [status, req.params.id]);
        res.json({ message: 'Status atualizado com sucesso!' });
    } catch (err) {
        return next(new AppError('Erro ao atualizar o status.', 500));
    }
});

app.get('/api/admin/reports/appointments-by-barber', requireAuth, requireAdmin, [
    body('startDate').optional().isISO8601().toDate().withMessage('Data de início inválida.'),
    body('endDate').optional().isISO8601().toDate().withMessage('Data de fim inválida.')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    try {
        const { startDate, endDate } = req.query; // Use req.query for GET requests
        let query = `
            SELECT
                b.name AS barberName,
                COUNT(a.id) AS totalAppointments
            FROM
                appointments a
            JOIN
                barbers b ON a.barberId = b.id
        `;
        const params = [];

        if (startDate && endDate) {
            query += ` WHERE a.date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            query += ` WHERE a.date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            query += ` WHERE a.date <= ?`;
            params.push(endDate);
        }

        query += ` GROUP BY b.name ORDER BY totalAppointments DESC`;

        const rows = await allAsync(query, params);
        res.json(rows);
    } catch (err) {
        return next(new AppError('Erro ao gerar relatório de agendamentos por barbeiro.', 500));
    }
});

// Rotas para Avaliações e Comentários
app.get('/api/reviews/:barberId', (req, res, next) => {
    const { barberId } = req.params;
    let query = "SELECT * FROM reviews WHERE barberId = ?";
    const params = [barberId];

    if (!req.session.isAdmin) {
        // If not admin, filter by user's locationId
        query += " AND locationId = ?";
        params.push(req.session.locationId);
    }

    query += " ORDER BY createdAt DESC";

    db.all(query, params, (err, reviews) => {
        if (err) {
            return next(new AppError('Erro ao buscar avaliações.', 500));
        }
        res.json(reviews);
    });
});

app.post('/api/reviews', requireAuth, [
    body('barberId').isInt({ min: 1 }).withMessage('Barbeiro inválido.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('A avaliação deve ser um número entre 1 e 5.'),
    body('comment').optional().isLength({ max: 500 }).withMessage('O comentário não pode exceder 500 caracteres.')
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    const { barberId, rating, comment } = req.body;
    const locationId = req.session.locationId; // Get locationId from session
    db.run("INSERT INTO reviews (userId, userName, barberId, rating, comment, locationId) VALUES (?, ?, ?, ?, ?, ?)",
        [req.session.userId, req.session.userName, barberId, rating, comment, locationId],
        function(err) {
            if (err) {
                return next(new AppError('Erro ao adicionar avaliação.', 500));
            }
            res.json({ message: 'Avaliação adicionada com sucesso!', id: this.lastID });
        });
});

// Rotas para Galeria de Imagens (simuladas)
app.get('/api/gallery', (req, res, next) => {
    let query = "SELECT * FROM gallery_images";
    const params = [];

    if (!req.session.isAdmin) {
        query += " WHERE locationId = ?";
        params.push(req.session.locationId);
    }

    query += " ORDER BY createdAt DESC";

    db.all(query, params, (err, images) => {
        if (err) {
            return next(new AppError('Erro ao buscar imagens da galeria.', 500));
        }
        res.json(images);
    });
});

app.post('/api/admin/gallery', requireAuth, requireAdmin, upload.single('image'), [
    body('alt').optional().isLength({ max: 255 }).withMessage('O texto alternativo não pode exceder 255 caracteres.'),
    body('category').optional().isLength({ max: 100 }).withMessage('A categoria não pode exceder 100 caracteres.'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('ID da localização inválido.')
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    if (!req.file) {
        return next(new AppError('Nenhuma imagem enviada.', 400));
    }
    const { alt, category, locationId = req.session.locationId } = req.body;
    const src = '/uploads/' + req.file.filename;
    db.run("INSERT INTO gallery_images (src, alt, category, locationId) VALUES (?, ?, ?, ?)",
        [src, alt, category, locationId], function(err) {
            if (err) {
                return next(new AppError('Erro ao adicionar imagem à galeria.', 500));
            }
            res.json({ message: 'Imagem adicionada com sucesso!', id: this.lastID, src, alt, category });
        });
});

app.delete('/api/admin/gallery/:id', requireAuth, requireAdmin, (req, res, next) => {
    const { id } = req.params;
    db.get("SELECT src FROM gallery_images WHERE id = ? AND locationId = ?", [id, req.session.locationId], (err, row) => {
        if (err) return next(new AppError('Erro ao buscar imagem.', 500));
        if (!row) {
            return next(new AppError('Imagem não encontrada ou não pertence à sua localização.', 404));
        }
        const imagePath = path.join(__dirname, 'public', row.src);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Erro ao deletar arquivo de imagem:', err);
                // Continue para deletar do DB mesmo que o arquivo não seja encontrado
            }
            db.run("DELETE FROM gallery_images WHERE id = ? AND locationId = ?", [id, req.session.locationId], function(err) {
                if (err) {
                    return next(new AppError('Erro ao deletar imagem da galeria.', 500));
                }
                res.json({ message: 'Imagem deletada com sucesso!' });
            });
        });
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Ocorreu um erro inesperado no servidor.',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`
✅ Banco de dados SQLite configurado!`);
    console.log(`
📧 Credenciais de Admin:`);
    console.log(`   Email: admin@barbearia.com`);
    console.log(`   Senha: admin123`);
    console.log(`
💡 Dica: Coloque sua logo.png na pasta public/images/`);
});

module.exports = app;