const request = require('supertest');
const app = require('../server'); // Assuming your Express app is exported from server.js

describe('API Routes', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123',
                locationId: 1
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Cadastro realizado com sucesso!');
    });

    it('should login a user', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'test@example.com',
                password: 'password123',
                isAdmin: false
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.redirect).toBe('/home');
    });
});