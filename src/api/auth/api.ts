/**
 * Authentication API Service
 * Direct API calls to backend authentication endpoints
 */

import { client } from '@/api/common/client';

import type {
  JwtConfigApiResponse,
  LoginApiResponse,
  LoginRequest,
  LogoutApiResponse,
  LogoutRequest,
  PasswordResetApiResponse,
  PasswordResetRequest,
  RefreshTokenApiResponse,
  RefreshTokenRequest,
  RegisterApiResponse,
  RegisterRequest,
  TokenCheckApiResponse,
  UserProfileApiResponse,
  VerifyTokenApiResponse,
  VerifyTokenRequest,
} from './types';

const AUTH_BASE = '/api/v2/auth';

/**
 * Register a new user account
 */
export const register = async (
  data: RegisterRequest
): Promise<RegisterApiResponse> => {
  const response = await client.post<RegisterApiResponse>(
    `${AUTH_BASE}/register`,
    data
  );
  return response.data;
};

/**
 * Sign in with email and password
 */
export const login = async (data: LoginRequest): Promise<LoginApiResponse> => {
  const response = await client.post<LoginApiResponse>(
    `${AUTH_BASE}/login`,
    data
  );
  return response.data;
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (
  data: RefreshTokenRequest
): Promise<RefreshTokenApiResponse> => {
  const response = await client.post<RefreshTokenApiResponse>(
    `${AUTH_BASE}/refresh`,
    data
  );
  return response.data;
};

/**
 * Sign out user and invalidate tokens
 */
export const logout = async (
  data: LogoutRequest
): Promise<LogoutApiResponse> => {
  const response = await client.post<LogoutApiResponse>(
    `${AUTH_BASE}/logout`,
    data
  );
  return response.data;
};

/**
 * Request password reset email
 */
export const requestPasswordReset = async (
  data: PasswordResetRequest
): Promise<PasswordResetApiResponse> => {
  const response = await client.post<PasswordResetApiResponse>(
    `${AUTH_BASE}/password/reset`,
    data
  );
  return response.data;
};

/**
 * Get current user profile (requires authentication)
 */
export const getCurrentUser = async (): Promise<UserProfileApiResponse> => {
  const response = await client.get<UserProfileApiResponse>(`${AUTH_BASE}/me`);
  return response.data;
};

/**
 * Verify token validity
 */
export const verifyToken = async (
  data: VerifyTokenRequest
): Promise<VerifyTokenApiResponse> => {
  const response = await client.post<VerifyTokenApiResponse>(
    `${AUTH_BASE}/verify`,
    data
  );
  return response.data;
};

/**
 * Get JWT configuration (public endpoint)
 */
export const getJwtConfig = async (): Promise<JwtConfigApiResponse> => {
  const response = await client.get<JwtConfigApiResponse>(
    `${AUTH_BASE}/config`
  );
  return response.data;
};

/**
 * Check token expiration status
 */
export const checkTokenStatus = async (
  token: string
): Promise<TokenCheckApiResponse> => {
  const response = await client.post<TokenCheckApiResponse>(
    `${AUTH_BASE}/token/check`,
    { token }
  );
  return response.data;
};
