/**
 * Error Handling Types
 * Comprehensive error types for API and application errors
 */

// Error Severity Levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error Categories
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'server'
  | 'client'
  | 'offline'
  | 'sync'
  | 'conflict'
  | 'unknown';

// Enhanced Error Interface
export interface AppError extends Error {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  details?: any;
  timestamp: string;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
  recoverable: boolean;
  retryable: boolean;
  silent?: boolean; // Don't show to user
}

// Error Handler Configuration
export interface ErrorHandlerConfig {
  showToast: boolean;
  logToConsole: boolean;
  reportToService: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackMessage: string;
}

// Error Actions
export interface ErrorAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Error Display Options
export interface ErrorDisplayOptions {
  title?: string;
  message?: string;
  severity?: ErrorSeverity;
  actions?: ErrorAction[];
  duration?: number;
  persistent?: boolean;
  icon?: 'auto' | 'success' | 'info' | 'warning' | 'danger';
  silent?: boolean;
}

// Error Context Information
export interface ErrorContext {
  screen?: string;
  component?: string;
  action?: string;
  userId?: string;
  tripId?: string;
  additionalData?: Record<string, any>;
}

// Error Recovery Strategy
export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'redirect' | 'ignore';
  retryAttempts?: number;
  retryDelay?: number;
  fallbackAction?: () => void;
  redirectPath?: string;
  ignoreUntil?: Date;
}

// Network Error Details
export interface NetworkErrorDetails {
  url?: string;
  method?: string;
  statusCode?: number;
  timeout?: boolean;
  offline?: boolean;
}

// Validation Error Details
export interface ValidationErrorDetails {
  field?: string;
  value?: any;
  rule?: string;
  message?: string;
}

// Sync Error Details
export interface SyncErrorDetails {
  entityType?: string;
  entityId?: string;
  operation?: string;
  localVersion?: number;
  remoteVersion?: number;
}

// Error Report (for analytics/logging)
export interface ErrorReport {
  error: AppError;
  context: ErrorContext;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
  stackTrace?: string;
  breadcrumbs?: string[];
  timestamp: string;
}
