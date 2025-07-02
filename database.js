const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'barbershop.db'));

// Helper functions for async/await
const runAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const getAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const allAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Initialize database
async function initializeDatabase() {
    await runAsync(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        birthdate TEXT,
        profilePhoto TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runAsync(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runAsync(`CREATE TABLE IF NOT EXISTS barbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT,
        specialties TEXT,
        services INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runAsync(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER,
        price REAL,
        count INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runAsync(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        userName TEXT,
        userEmail TEXT,
        service TEXT,
        date TEXT,
        time TEXT,
        barberId INTEGER,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (barberId) REFERENCES barbers (id)
    )`);

    await runAsync(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        userName TEXT NOT NULL,
        barberId INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (barberId) REFERENCES barbers (id)
    )`);

    await runAsync(`CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        address TEXT,
        phone TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Add locationId to barbers table if it doesn't exist
    const barberColumns = await allAsync("PRAGMA table_info(barbers)");
    const barberLocationIdExists = barberColumns.some(col => col.name === 'locationId');
    if (!barberLocationIdExists) {
        await runAsync("ALTER TABLE barbers ADD COLUMN locationId INTEGER DEFAULT 1 REFERENCES locations(id)");
    }

    // Add locationId to services table if it doesn't exist
    const serviceColumns = await allAsync("PRAGMA table_info(services)");
    const serviceLocationIdExists = serviceColumns.some(col => col.name === 'locationId');
    if (!serviceLocationIdExists) {
        await runAsync("ALTER TABLE services ADD COLUMN locationId INTEGER DEFAULT 1 REFERENCES locations(id)");
    }

    // Add locationId to appointments table if it doesn't exist
    const appointmentColumns = await allAsync("PRAGMA table_info(appointments)");
    const appointmentLocationIdExists = appointmentColumns.some(col => col.name === 'locationId');
    if (!appointmentLocationIdExists) {
        await runAsync("ALTER TABLE appointments ADD COLUMN locationId INTEGER DEFAULT 1 REFERENCES locations(id)");
    }

    // Create indexes for frequently queried columns
    await runAsync('CREATE INDEX IF NOT EXISTS idx_appointments_userId ON appointments (userId)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_appointments_barberId ON appointments (barberId)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments (date, time DESC)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_reviews_barberId ON reviews (barberId)');

    // Insert default data
    await insertDefaultData();
}

async function insertDefaultData() {
    // Check if admin exists
    const admin = await getAsync("SELECT * FROM admins WHERE email = ?", ['admin@barbearia.com']);
    if (!admin) {
        const adminPassword = bcrypt.hashSync('admin123', 10);
        await runAsync("INSERT INTO admins (email, password) VALUES (?, ?)", 
            ['admin@barbearia.com', adminPassword]);
    }

    // Check if default location exists
    const locationCount = await getAsync("SELECT COUNT(*) as count FROM locations");
    if (!locationCount || locationCount.count === 0) {
        await runAsync("INSERT INTO locations (name, address, phone) VALUES (?, ?, ?)",
            ['Matriz', 'Rua Principal, 123', '(11) 1234-5678']);
    }

    // Check if barbers exist
    const barberCount = await getAsync("SELECT COUNT(*) as count FROM barbers");
    if (!barberCount || barberCount.count === 0) {
        // Insert only Alisom Silva as default barber
        await runAsync("INSERT INTO barbers (name, contact, specialties, services) VALUES (?, ?, ?, ?)",
            ['Alisom Silva', '(11) 98765-4321', 'Cortes clássicos, Degradê', 1]);
    }

    // Check if services exist
    const serviceCount = await getAsync("SELECT COUNT(*) as count FROM services");
    if (!serviceCount || serviceCount.count === 0) {
        // Insert only one default service
        await runAsync("INSERT INTO services (name, description, duration, price, count) VALUES (?, ?, ?, ?, ?)",
            ['Corte de Cabelo', 'Corte profissional com acabamento', 30, 30, 1]);
    }
}

module.exports = {
    db,
    initializeDatabase
};