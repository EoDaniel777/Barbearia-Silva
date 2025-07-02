const request = require('supertest');
const app = require('../server');
const { db, initializeDatabase } = require('../database');

describe('API Routes', () => {
    beforeAll(async () => {
        // Re-initialize database before all tests to ensure a clean state
        await initializeDatabase();
    });

    afterAll(() => {
        // Close the database connection after all tests
        db.close();
    });

    it('should return 200 for GET /', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });

    it('should register a new user successfully', async () => {
        const newUser = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123',
            locationId: 1
        };
        const response = await request(app)
            .post('/api/register')
            .send(newUser);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Cadastro realizado com sucesso!');
    });

    it('should not register a user with existing email', async () => {
        const existingUser = {
            firstName: 'Existing',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123',
            locationId: 1
        };
        const response = await request(app)
            .post('/api/register')
            .send(existingUser);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Este e-mail já está cadastrado.');
    });

    it('should login a user successfully', async () => {
        const userCredentials = {
            email: 'test@example.com',
            password: 'password123',
            isAdmin: false
        };
        const response = await request(app)
            .post('/api/login')
            .send(userCredentials);
        expect(response.statusCode).toBe(200);
        expect(response.body.redirect).toBe('/home');
    });

    it('should not login with invalid credentials', async () => {
        const userCredentials = {
            email: 'test@example.com',
            password: 'wrongpassword',
            isAdmin: false
        };
        const response = await request(app)
            .post('/api/login')
            .send(userCredentials);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('E-mail ou senha inválidos.');
    });

    it('should login an admin successfully', async () => {
        // Register an admin first
        const adminUser = {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: 'adminpassword',
            locationId: 1
        };
        await request(app).post('/api/register').send(adminUser);

        const adminCredentials = {
            email: 'admin@example.com',
            password: 'adminpassword',
            isAdmin: true
        };
        const response = await request(app)
            .post('/api/login')
            .send(adminCredentials);
        expect(response.statusCode).toBe(200);
        expect(response.body.redirect).toBe('/admin/dashboard');
    });
});