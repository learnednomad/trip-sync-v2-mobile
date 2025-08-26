/**
 * Error Handling React Hooks
 * React integration for error handling and recovery
 */

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import errorHandler from './error-handler';
import type {
  AppError,
  ErrorAction,
  ErrorContext,
  ErrorDisplayOptions,
  ErrorRecoveryStrategy,
} from './types';

/**
 * Hook to handle errors with automatic classification and display
 */
export const useErrorHandler = () => {
  const handleError = useCallback((
    error: Error | AppError,
    context?: ErrorContext,
    options?: Partial<ErrorDisplayOptions>
  ): AppError => {
    return errorHandler.handleError(error, context, options);
  }, []);

  const addBreadcrumb = useCallback((message: string, category?: string) => {
    errorHandler.addBreadcrumb(message, category);
  }, []);

  const clearErrors = useCallback(() => {
    errorHandler.clearErrors();
  }, []);

  return {
    handleError,
    addBreadcrumb,
    clearErrors,
  };
};

/**
 * Hook to create and manage specialized error types
 */
export const useErrorFactory = () => {
  const createNetworkError = useCallback((message: string, details?: any) => {
    return errorHandler.createNetworkError(message, details);
  }, []);

  const createValidationError = useCallback((message: string, details?: any) => {
    return errorHandler.createValidationError(message, details);
  }, []);

  const createSyncError = useCallback((message: string, details?: any) => {
    return errorHandler.createSyncError(message, details);
  }, []);

  const createConflictError = useCallback((message: string, details?: any) => {
    return errorHandler.createConflictError(message, details);
  }, []);

  return {
    createNetworkError,
    createValidationError,
    createSyncError,
    createConflictError,
  };
};

/**
 * Hook to handle API mutation errors with automatic retry
 */
export const useApiErrorHandler = <TData = any, TError = Error, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    onSuccess?: (data: TData) => void;
    onError?: (error: AppError) => void;
    context?: ErrorContext;
  }
) => {
  const { handleError } = useErrorHandler();
  const [retryCount, setRetryCount] = useState(0);

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      setRetryCount(0);
      options?.onSuccess?.(data);
    },
    onError: (error: TError) => {
      const appError = handleError(error as Error, options?.context);
      
      // Check if we should retry
      const shouldRetry = errorHandler.shouldRetry(appError, retryCount + 1);
      const maxRetries = options?.maxRetries || 3;
      
      if (shouldRetry && retryCount < maxRetries) {
        const delay = errorHandler.getRetryDelay(retryCount + 1);
        setRetryCount(prev => prev + 1);
        
        setTimeout(() => {
          // Retry mutation (this would need to be implemented based on use case)
        }, delay);
      } else {
        setRetryCount(0);
        options?.onError?.(appError);
      }
    },
  });
};

/**
 * Hook to handle error recovery strategies
 */
export const useErrorRecovery = () => {
  const [recoveryAttempts, setRecoveryAttempts] = useState<Map<string, number>>(new Map());

  const executeRecovery = useCallback(async (
    errorCode: string,
    strategy: ErrorRecoveryStrategy
  ): Promise<boolean> => {
    const attempts = recoveryAttempts.get(errorCode) || 0;

    switch (strategy.type) {
      case 'retry':
        if (attempts < (strategy.retryAttempts || 3)) {
          setRecoveryAttempts(prev => new Map(prev).set(errorCode, attempts + 1));
          
          if (strategy.retryDelay) {
            await new Promise(resolve => setTimeout(resolve, strategy.retryDelay));
          }
          
          return true; // Signal to retry
        }
        return false;

      case 'fallback':
        strategy.fallbackAction?.();
        return true;

      case 'redirect':
        // Would implement navigation here
        console.log('Would navigate to:', strategy.redirectPath);
        return true;

      case 'ignore':
        if (strategy.ignoreUntil && new Date() < strategy.ignoreUntil) {
          return true; // Ignore error
        }
        return false;

      default:
        return false;
    }
  }, [recoveryAttempts]);

  const resetRecoveryAttempts = useCallback((errorCode: string) => {
    setRecoveryAttempts(prev => {
      const newMap = new Map(prev);
      newMap.delete(errorCode);
      return newMap;
    });
  }, []);

  return {
    executeRecovery,
    resetRecoveryAttempts,
    getAttempts: (errorCode: string) => recoveryAttempts.get(errorCode) || 0,
  };
};

/**
 * Hook to display custom error dialogs and handle user actions
 */
export const useErrorDialog = () => {
  const [activeError, setActiveError] = useState<{
    error: AppError;
    options: ErrorDisplayOptions;
  } | null>(null);

  const showErrorDialog = useCallback((
    error: AppError,
    options: ErrorDisplayOptions
  ) => {
    setActiveError({ error, options });
  }, []);

  const hideErrorDialog = useCallback(() => {
    setActiveError(null);
  }, []);

  const executeAction = useCallback((action: ErrorAction) => {
    action.onPress();
    hideErrorDialog();
  }, [hideErrorDialog]);

  return {
    activeError,
    showErrorDialog,
    hideErrorDialog,
    executeAction,
  };
};

/**
 * Hook to integrate error handling with TanStack Query
 */
export const useQueryErrorHandler = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  // Global error handler for queries
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'queryError' && event.query.state.error) {
        const error = event.query.state.error as Error;
        const context: ErrorContext = {
          action: 'query',
          additionalData: {
            queryKey: event.query.queryKey,
            queryHash: event.query.queryHash,
          },
        };

        handleError(error, context, { silent: true }); // Silent to avoid duplicate toasts
      }
    });

    return unsubscribe;
  }, [queryClient, handleError]);

  // Global error handler for mutations
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'mutationError' && event.mutation.state.error) {
        const error = event.mutation.state.error as Error;
        const context: ErrorContext = {
          action: 'mutation',
          additionalData: {
            mutationKey: event.mutation.options.mutationKey,
            variables: event.mutation.state.variables,
          },
        };

        handleError(error, context);
      }
    });

    return unsubscribe;
  }, [queryClient, handleError]);

  return {
    queryClient,
  };
};

/**
 * Hook to monitor error statistics and health
 */
export const useErrorMonitoring = () => {
  const [stats, setStats] = useState(errorHandler.getErrorStats());

  const refreshStats = useCallback(() => {
    setStats(errorHandler.getErrorStats());
  }, []);

  useEffect(() => {
    // Refresh stats periodically
    const interval = setInterval(refreshStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  const reportErrors = useCallback(async () => {
    try {
      await errorHandler.reportErrors();
      refreshStats();
    } catch (error) {
      console.error('Failed to report errors:', error);
    }
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    reportErrors,
    hasErrors: stats.queueLength > 0,
  };
};