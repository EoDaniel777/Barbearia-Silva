const request = require('supertest');
const app = require('../server'); // Assuming your main app file is server.js

describe('Auth API', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Cadastro realizado com sucesso!');
    });
});