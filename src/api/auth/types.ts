/**
 * Authentication API Types
 * Matching the Hono API auth endpoints from Backend-2.1
 */

import type { ApiResponse } from '@/api/common/types';

// Request Types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  rememberMe?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
  allDevices?: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

// Response Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse extends AuthResponse {}

export interface LoginResponse extends AuthResponse {}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

export interface LogoutResponse {
  message: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
}

export interface UserProfileResponse {
  user: User;
}

export interface JwtConfigResponse {
  tokenExpiration: {
    accessToken: string;
    refreshToken: string;
    refreshThreshold: number;
  };
  issuer: string;
  audience: string;
  server: {
    environment: string;
    version: string;
    timestamp: string;
  };
}

export interface TokenCheckResponse {
  valid: boolean;
  expired: boolean;
  shouldRefresh: boolean;
  serverTime: string;
}

// API Response Wrappers
export type RegisterApiResponse = ApiResponse<RegisterResponse>;
export type LoginApiResponse = ApiResponse<LoginResponse>;
export type RefreshTokenApiResponse = ApiResponse<RefreshTokenResponse>;
export type LogoutApiResponse = ApiResponse<LogoutResponse>;
export type PasswordResetApiResponse = ApiResponse<PasswordResetResponse>;
export type VerifyTokenApiResponse = ApiResponse<VerifyTokenResponse>;
export type UserProfileApiResponse = ApiResponse<UserProfileResponse>;
export type JwtConfigApiResponse = ApiResponse<JwtConfigResponse>;
export type TokenCheckApiResponse = ApiResponse<TokenCheckResponse>;
