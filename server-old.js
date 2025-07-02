const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'barbershop-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// In-memory database (replace with real database in production)
const users = [];
const appointments = [];
const barbers = [
    { id: 1, name: 'Ethan Carter', services: 100, specialties: 'Classic cuts, Fades' }
];
const services = [
    { id: 1, name: 'Haircut', price: 25, duration: 30, count: 40 },
    { id: 2, name: 'Beard Trim', price: 15, duration: 20, count: 30 },
    { id: 3, name: 'Hair Color', price: 50, duration: 60, count: 20 }
];

// Create default admin account
const defaultAdminPassword = bcrypt.hashSync('admin123', 10);
const admins = [
    { email: 'admin@barbershop.com', password: defaultAdminPassword }
];

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Routes
// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'auth', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'auth', 'register.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'auth', 'forgot-password.html'));
});

app.get('/home', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'user', 'home.html'));
});

app.get('/booking', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'user', 'booking.html'));
});

app.get('/appointments', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'user', 'appointments.html'));
});

app.get('/profile', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'user', 'profile.html'));
});

app.get('/admin/dashboard', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'admin', 'dashboard.html'));
});

app.get('/admin/add-barber', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'admin', 'add-barber.html'));
});

app.get('/admin/add-service', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'admin', 'add-service.html'));
});

app.get('/admin/barber-hours', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'admin', 'barber-hours.html'));
});

app.get('/admin/appointments', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'screens', 'admin', 'admin-appointments.html'));
});

// API Routes
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
        id: users.length + 1,
        firstName,
        lastName,
        email,
        password: hashedPassword
    };
    
    users.push(user);
    
    res.json({ message: 'Registration successful' });
});

app.post('/api/login', async (req, res) => {
    const { email, password, isAdmin } = req.body;
    
    if (isAdmin) {
        // Admin login
        const admin = admins.find(a => a.email === email);
        if (!admin || !await bcrypt.compare(password, admin.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = email; // Using email as admin ID
        req.session.isAdmin = true;
        return res.json({ message: 'Admin login successful', redirect: '/admin/dashboard' });
    } else {
        // User login
        const user = users.find(u => u.email === email);
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = user.id;
        req.session.isAdmin = false;
        req.session.userEmail = user.email;
        req.session.userName = `${user.firstName} ${user.lastName}`;
        return res.json({ message: 'Login successful', redirect: '/home' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/services', (req, res) => {
    res.json(services);
});

app.get('/api/barbers', (req, res) => {
    res.json(barbers);
});

app.post('/api/appointments', requireAuth, (req, res) => {
    const { service, date, time, barberId } = req.body;
    
    const appointment = {
        id: appointments.length + 1,
        userId: req.session.userId,
        userName: req.session.userName,
        userEmail: req.session.userEmail,
        service,
        date,
        time,
        barberId,
        status: 'pending',
        createdAt: new Date()
    };
    
    appointments.push(appointment);
    
    // Here you would send notification to admin in production
    console.log('New appointment:', appointment);
    
    res.json({ message: 'Appointment booked successfully', appointment });
});

app.get('/api/appointments', requireAuth, (req, res) => {
    if (req.session.isAdmin) {
        // Return all appointments for admin
        res.json(appointments);
    } else {
        // Return user's appointments
        const userAppointments = appointments.filter(a => a.userId === req.session.userId);
        res.json(userAppointments);
    }
});

app.post('/api/admin/barbers', requireAdmin, (req, res) => {
    const { name, contact, specialties } = req.body;
    
    const barber = {
        id: barbers.length + 1,
        name,
        contact,
        specialties,
        services: 0
    };
    
    barbers.push(barber);
    res.json({ message: 'Barber added successfully', barber });
});

app.post('/api/admin/services', requireAdmin, (req, res) => {
    const { name, description, duration, price } = req.body;
    
    const service = {
        id: services.length + 1,
        name,
        description,
        duration,
        price,
        count: 0
    };
    
    services.push(service);
    res.json({ message: 'Service added successfully', service });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const totalServices = services.reduce((sum, s) => sum + s.count, 0);
    const estimatedProfit = services.reduce((sum, s) => sum + (s.count * s.price), 0);
    
    res.json({
        totalServices,
        estimatedProfit,
        topBarbers: barbers.slice(0, 3),
        popularServices: services.slice(0, 3)
    });
});

app.put('/api/appointments/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = appointments.find(a => a.id === parseInt(id));
    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }
    
    appointment.status = status;
    res.json({ message: 'Status updated successfully', appointment });
});

// Serve images
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`\nAdmin Credentials:`);
    console.log(`Email: admin@barbershop.com`);
    console.log(`Password: admin123`);
});