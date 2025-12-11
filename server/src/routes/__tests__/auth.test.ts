import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRouter from '../../routes/auth';
import { User } from '../../models/User';

// Mock User model
jest.mock('../../models/User');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        role: 'member',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.fullName).toBe('John Doe');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should return 409 if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        email: 'existing@example.com',
        fullName: 'Existing User',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already in use');
    });

    it('should hash password before storing', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockImplementation(async (data) => {
        expect(data.passwordHash).not.toBe('password123');
        return {
          _id: 'user123',
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName,
          role: data.role,
        };
      });

      await request(app)
        .post('/auth/register')
        .send({
          email: 'hash@example.com',
          password: 'password123',
          firstName: 'Hash',
          lastName: 'Test',
        });

      expect(User.create).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user123',
        email: 'login@example.com',
        passwordHash: hashedPassword,
        fullName: 'Login Test',
        firstName: 'Login',
        lastName: 'Test',
        role: 'member',
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should return 401 with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user123',
        email: 'wrongpass@example.com',
        passwordHash: hashedPassword,
        fullName: 'Wrong Pass',
        role: 'member',
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 with non-existent email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing email or password');
    });
  });
});
