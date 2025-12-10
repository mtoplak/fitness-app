import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { api } from '../api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          role: 'member',
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
    });

    it('should login a user', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: '123',
          email: 'test@example.com',
          fullName: 'John Doe',
          role: 'member',
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should include auth token in headers when available', async () => {
      localStorage.setItem('auth_token', 'my-token');

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', email: 'test@example.com', fullName: 'Test User', role: 'member' }),
      });

      await api.me();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(api.login({
        email: 'test@example.com',
        password: 'wrong',
      })).rejects.toThrow('Invalid credentials');
    });
  });
});
