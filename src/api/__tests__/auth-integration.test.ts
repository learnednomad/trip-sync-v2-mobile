/**
 * Authentication API Integration Tests
 * Tests the full authentication flow with mock backend
 */

import MockAdapter from 'axios-mock-adapter';

import * as authApi from '../auth/api';
import type { LoginRequest, RegisterRequest } from '../auth/types';
import { client } from '../common/client';

describe('Authentication API Integration', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(client);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const registerData: RegisterRequest = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            emailVerified: false,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          tokens: {
            access: 'mock-access-token',
            refresh: 'mock-refresh-token',
            tokenType: 'Bearer' as const,
            expiresIn: 3600,
          },
        },
      };

      mockAxios.onPost('/api/v2/auth/register').reply(201, mockResponse);

      const result = await authApi.register(registerData);

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.tokens.access).toBe('mock-access-token');
    });

    it('should handle registration validation errors', async () => {
      const registerData: RegisterRequest = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
        acceptTerms: false,
      };

      const mockError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data',
          details: {
            email: 'Invalid email format',
            password: 'Password too weak',
            firstName: 'First name is required',
          },
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/auth/register',
          requestId: 'req-123',
        },
      };

      mockAxios.onPost('/api/v2/auth/register').reply(400, mockError);

      await expect(authApi.register(registerData)).rejects.toThrow();
    });
  });

  describe('User Login', () => {
    it('should login user successfully', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            emailVerified: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          tokens: {
            access: 'mock-access-token',
            refresh: 'mock-refresh-token',
            tokenType: 'Bearer' as const,
            expiresIn: 3600,
          },
        },
      };

      mockAxios.onPost('/api/v2/auth/login').reply(200, mockResponse);

      const result = await authApi.login(loginData);

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.tokens.access).toBe('mock-access-token');
    });

    it('should handle invalid credentials', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/auth/login',
          requestId: 'req-123',
        },
      };

      mockAxios.onPost('/api/v2/auth/login').reply(401, mockError);

      await expect(authApi.login(loginData)).rejects.toThrow();
    });
  });

  describe('Token Management', () => {
    it('should refresh tokens successfully', async () => {
      const refreshData = {
        refreshToken: 'mock-refresh-token',
      };

      const mockResponse = {
        success: true,
        data: {
          tokens: {
            access: 'new-access-token',
            refresh: 'new-refresh-token',
            tokenType: 'Bearer' as const,
            expiresIn: 3600,
          },
        },
      };

      mockAxios.onPost('/api/v2/auth/refresh').reply(200, mockResponse);

      const result = await authApi.refreshToken(refreshData);

      expect(result.success).toBe(true);
      expect(result.data?.tokens.access).toBe('new-access-token');
    });

    it('should handle expired refresh token', async () => {
      const refreshData = {
        refreshToken: 'expired-refresh-token',
      };

      const mockError = {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token has expired',
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/auth/refresh',
          requestId: 'req-123',
        },
      };

      mockAxios.onPost('/api/v2/auth/refresh').reply(401, mockError);

      await expect(authApi.refreshToken(refreshData)).rejects.toThrow();
    });
  });

  describe('User Profile', () => {
    it('should get current user profile', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            emailVerified: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        },
      };

      mockAxios.onGet('/api/v2/auth/me').reply(200, mockResponse);

      const result = await authApi.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
    });

    it('should handle unauthorized access', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/auth/me',
          requestId: 'req-123',
        },
      };

      mockAxios.onGet('/api/v2/auth/me').reply(401, mockError);

      await expect(authApi.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('Password Reset', () => {
    it('should request password reset successfully', async () => {
      const resetData = {
        email: 'test@example.com',
      };

      const mockResponse = {
        success: true,
        data: {
          message: 'Password reset email sent',
        },
      };

      mockAxios.onPost('/api/v2/auth/password/reset').reply(200, mockResponse);

      const result = await authApi.requestPasswordReset(resetData);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Password reset email sent');
    });
  });

  describe('Token Validation', () => {
    it('should verify valid token', async () => {
      const tokenData = {
        token: 'valid-token',
      };

      const mockResponse = {
        success: true,
        data: {
          valid: true,
          user: {
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            emailVerified: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        },
      };

      mockAxios.onPost('/api/v2/auth/verify').reply(200, mockResponse);

      const result = await authApi.verifyToken(tokenData);

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
    });

    it('should handle invalid token', async () => {
      const tokenData = {
        token: 'invalid-token',
      };

      const mockResponse = {
        success: true,
        data: {
          valid: false,
        },
      };

      mockAxios.onPost('/api/v2/auth/verify').reply(200, mockResponse);

      const result = await authApi.verifyToken(tokenData);

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
    });
  });
});
