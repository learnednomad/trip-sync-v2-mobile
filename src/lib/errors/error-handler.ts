/**
 * Error Handler Service
 * Centralized error processing, classification, and handling
 */

import { showMessage } from 'react-native-flash-message';

import {
  ApiClientError,
  AuthenticationError,
  NetworkError,
  ValidationError,
} from '@/api/common/types';

import type {
  AppError,
  ErrorCategory,
  ErrorContext,
  ErrorDisplayOptions,
  ErrorHandlerConfig,
  ErrorReport,
  ErrorSeverity,
  NetworkErrorDetails,
  SyncErrorDetails,
  ValidationErrorDetails,
} from './types';

class ErrorHandlerService {
  private config: ErrorHandlerConfig = {
    showToast: true,
    logToConsole: __DEV__,
    reportToService: !__DEV__,
    maxRetries: 3,
    retryDelay: 1000,
    fallbackMessage: 'An unexpected error occurred. Please try again.',
  };

  private errorQueue: ErrorReport[] = [];
  private breadcrumbs: string[] = [];
  private maxBreadcrumbs = 50;

  private log(...args: any[]) {
    if (this.config.logToConsole) {
      console.error('[ErrorHandler]', ...args);
    }
  }

  updateConfig(newConfig: Partial<ErrorHandlerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category?: string) {
    const timestamp = new Date().toISOString();
    const breadcrumb = `[${timestamp}] ${category ? `[${category}] ` : ''}${message}`;

    this.breadcrumbs.push(breadcrumb);

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // Main error handling entry point
  handleError(
    error: Error | AppError,
    context?: ErrorContext,
    options?: Partial<ErrorDisplayOptions>
  ): AppError {
    const appError = this.classifyError(error, context);

    this.log('Handling error:', appError);

    // Add to breadcrumbs
    this.addBreadcrumb(
      `Error: ${appError.code} - ${appError.message}`,
      appError.category
    );

    // Create error report
    const errorReport = this.createErrorReport(appError, context || {});

    // Queue for reporting (if enabled)
    if (this.config.reportToService) {
      this.errorQueue.push(errorReport);
    }

    // Display error to user (if not silent)
    if (!appError.silent && this.config.showToast) {
      this.displayError(appError, options);
    }

    return appError;
  }

  // Classify and enhance errors
  private classifyError(
    error: Error | AppError,
    context?: ErrorContext
  ): AppError {
    // If already an AppError, return as-is
    if ('category' in error && 'severity' in error) {
      return error as AppError;
    }

    const now = new Date().toISOString();
    let appError: AppError;

    // Classify by error type/constructor
    if (error instanceof NetworkError || error.name === 'NetworkError') {
      appError = {
        ...error,
        code: 'NETWORK_ERROR',
        category: 'network',
        severity: 'medium',
        timestamp: now,
        recoverable: true,
        retryable: true,
        context,
      };
    } else if (
      error instanceof AuthenticationError ||
      error.name === 'AuthenticationError'
    ) {
      appError = {
        ...error,
        code: 'AUTHENTICATION_ERROR',
        category: 'authentication',
        severity: 'high',
        timestamp: now,
        recoverable: true,
        retryable: false,
        context,
      };
    } else if (
      error instanceof ValidationError ||
      error.name === 'ValidationError'
    ) {
      appError = {
        ...error,
        code: 'VALIDATION_ERROR',
        category: 'validation',
        severity: 'low',
        timestamp: now,
        recoverable: true,
        retryable: false,
        context,
      };
    } else if (
      error instanceof ApiClientError ||
      error.name === 'ApiClientError'
    ) {
      const apiError = error as ApiClientError;
      appError = {
        ...error,
        code: apiError.code || 'API_ERROR',
        category: this.categorizeApiError(apiError.status),
        severity: this.getSeverityFromStatus(apiError.status),
        timestamp: now,
        recoverable: apiError.status !== 401 && apiError.status !== 403,
        retryable: apiError.status ? apiError.status >= 500 : false,
        context,
      };
    } else {
      // Generic error
      appError = {
        ...error,
        name: error.name || 'Error',
        code: 'UNKNOWN_ERROR',
        category: 'unknown',
        severity: 'medium',
        timestamp: now,
        recoverable: false,
        retryable: false,
        context,
      };
    }

    return appError;
  }

  private categorizeApiError(status?: number): ErrorCategory {
    if (!status) return 'unknown';

    if (status === 401) return 'authentication';
    if (status === 403) return 'authorization';
    if (status >= 400 && status < 500) return 'client';
    if (status >= 500) return 'server';
    return 'unknown';
  }

  private getSeverityFromStatus(status?: number): ErrorSeverity {
    if (!status) return 'medium';

    if (status === 401 || status === 403) return 'high';
    if (status >= 500) return 'high';
    if (status === 404) return 'low';
    if (status >= 400 && status < 500) return 'medium';
    return 'low';
  }

  private createErrorReport(
    error: AppError,
    context: ErrorContext
  ): ErrorReport {
    return {
      error,
      context,
      userAgent: navigator.userAgent,
      breadcrumbs: [...this.breadcrumbs],
      timestamp: new Date().toISOString(),
      stackTrace: error.stack,
    };
  }

  // Display error to user
  private displayError(
    error: AppError,
    options?: Partial<ErrorDisplayOptions>
  ) {
    const displayOptions = this.getDisplayOptions(error, options);

    showMessage({
      message: displayOptions.title || 'Error',
      description: displayOptions.message || error.message,
      type: this.getMessageType(displayOptions.severity || error.severity),
      duration:
        displayOptions.duration || this.getDurationBySeverity(error.severity),
      floating: true,
      autoHide: !displayOptions.persistent,
      icon: displayOptions.icon || this.getIconBySeverity(error.severity),
    });
  }

  private getDisplayOptions(
    error: AppError,
    options?: Partial<ErrorDisplayOptions>
  ): ErrorDisplayOptions {
    const defaultOptions = this.getDefaultDisplayOptions(error);
    return { ...defaultOptions, ...options };
  }

  private getDefaultDisplayOptions(error: AppError): ErrorDisplayOptions {
    switch (error.category) {
      case 'network':
        return {
          title: 'Connection Problem',
          message: 'Please check your internet connection and try again.',
          severity: 'medium',
        };

      case 'authentication':
        return {
          title: 'Authentication Required',
          message: 'Please sign in to continue.',
          severity: 'high',
        };

      case 'authorization':
        return {
          title: 'Access Denied',
          message: "You don't have permission to perform this action.",
          severity: 'high',
        };

      case 'validation':
        return {
          title: 'Invalid Input',
          message: error.message || 'Please check your input and try again.',
          severity: 'low',
        };

      case 'server':
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          severity: 'high',
        };

      case 'offline':
        return {
          title: "You're Offline",
          message:
            "Your changes will be saved and synced when you're back online.",
          severity: 'medium',
        };

      case 'sync':
        return {
          title: 'Sync Problem',
          message: "We couldn't sync your data. We'll try again automatically.",
          severity: 'medium',
        };

      case 'conflict':
        return {
          title: 'Data Conflict',
          message:
            'Your data conflicts with recent changes. Please review and merge.',
          severity: 'high',
          persistent: true,
        };

      default:
        return {
          title: 'Something Went Wrong',
          message: this.config.fallbackMessage,
          severity: 'medium',
        };
    }
  }

  private getMessageType(
    severity: ErrorSeverity
  ): 'success' | 'info' | 'warning' | 'danger' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'danger';
      default:
        return 'warning';
    }
  }

  private getDurationBySeverity(severity: ErrorSeverity): number {
    switch (severity) {
      case 'low':
        return 3000;
      case 'medium':
        return 5000;
      case 'high':
        return 7000;
      case 'critical':
        return 10000;
      default:
        return 5000;
    }
  }

  private getIconBySeverity(
    severity: ErrorSeverity
  ): 'auto' | 'success' | 'info' | 'warning' | 'danger' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'danger';
      default:
        return 'auto';
    }
  }

  // Create specialized errors
  createNetworkError(message: string, details?: NetworkErrorDetails): AppError {
    return {
      name: 'NetworkError',
      message,
      code: 'NETWORK_ERROR',
      category: 'network',
      severity: 'medium',
      details,
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: true,
    };
  }

  createValidationError(
    message: string,
    details?: ValidationErrorDetails
  ): AppError {
    return {
      name: 'ValidationError',
      message,
      code: 'VALIDATION_ERROR',
      category: 'validation',
      severity: 'low',
      details,
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: false,
    };
  }

  createSyncError(message: string, details?: SyncErrorDetails): AppError {
    return {
      name: 'SyncError',
      message,
      code: 'SYNC_ERROR',
      category: 'sync',
      severity: 'medium',
      details,
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: true,
    };
  }

  createConflictError(message: string, details?: any): AppError {
    return {
      name: 'ConflictError',
      message,
      code: 'DATA_CONFLICT',
      category: 'conflict',
      severity: 'high',
      details,
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: false,
    };
  }

  // Error recovery helpers
  shouldRetry(error: AppError, attemptCount: number): boolean {
    if (!error.retryable) return false;
    if (attemptCount >= this.config.maxRetries) return false;

    // Don't retry client errors (4xx)
    if (error.category === 'client' || error.category === 'validation')
      return false;

    return true;
  }

  getRetryDelay(attemptCount: number): number {
    return this.config.retryDelay * Math.pow(2, attemptCount - 1);
  }

  // Error reporting
  async reportErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    try {
      // TODO: Implement error reporting service
      // await errorReportingService.report(this.errorQueue);
      this.log('Would report', this.errorQueue.length, 'errors');
      this.errorQueue = [];
    } catch (error) {
      this.log('Failed to report errors:', error);
    }
  }

  // Get error statistics
  getErrorStats(): {
    queueLength: number;
    breadcrumbCount: number;
    categoryCounts: Record<ErrorCategory, number>;
  } {
    const categoryCounts: Record<ErrorCategory, number> = {
      network: 0,
      authentication: 0,
      authorization: 0,
      validation: 0,
      server: 0,
      client: 0,
      offline: 0,
      sync: 0,
      conflict: 0,
      unknown: 0,
    };

    this.errorQueue.forEach((report) => {
      categoryCounts[report.error.category]++;
    });

    return {
      queueLength: this.errorQueue.length,
      breadcrumbCount: this.breadcrumbs.length,
      categoryCounts,
    };
  }

  // Clear error data
  clearErrors(): void {
    this.errorQueue = [];
    this.breadcrumbs = [];
    this.log('Cleared error queue and breadcrumbs');
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerService();
export default errorHandler;
