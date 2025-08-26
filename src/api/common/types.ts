/**
 * Backend API Response Types
 * Matching the Hono API response format from Backend-3.1
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
  requestId: string;
}

export interface ApiMetadata {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * HTTP Error Status Codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * API Client Error Types
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}