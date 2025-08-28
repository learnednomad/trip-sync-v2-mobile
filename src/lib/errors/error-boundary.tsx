/**
 * Error Boundary Components
 * React Error Boundary for catching and handling React errors
 */

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import errorHandler from './error-handler';
import type { ErrorContext } from './types';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: ErrorContext;
}

/**
 * Default Error Fallback Component
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  context,
}) => {
  const appError = errorHandler.handleError(error, context, { silent: true });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          {appError.recoverable
            ? "We've encountered an unexpected error. You can try again or go back."
            : "We've encountered a critical error. Please restart the app."}
        </Text>

        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>Error: {error.name}</Text>
            <Text style={styles.debugText}>Message: {error.message}</Text>
            <Text style={styles.debugText}>Code: {appError.code}</Text>
            <Text style={styles.debugText}>Category: {appError.category}</Text>
            <Text style={styles.debugText}>Severity: {appError.severity}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {appError.recoverable && (
            <TouchableOpacity style={styles.primaryButton} onPress={resetError}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // Would implement navigation to home/safe screen
              console.log('Would navigate to home screen');
            }}
          >
            <Text style={styles.secondaryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  context?: ErrorContext;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Application Error Boundary
 */
export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({
  children,
  fallback = ErrorFallback,
  context,
  onError,
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Add breadcrumb
    errorHandler.addBreadcrumb(
      `React Error Boundary caught error: ${error.name}`,
      'react'
    );

    // Handle error with context
    const enhancedContext: ErrorContext = {
      ...context,
      component: 'ErrorBoundary',
      additionalData: {
        componentStack: errorInfo.componentStack || 'Unknown',
      },
    };

    errorHandler.handleError(error, enhancedContext, { silent: true });

    // Call custom error handler
    onError?.(error, errorInfo);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={(props) => {
        const FallbackComponent = fallback;
        return (
          <FallbackComponent
            {...props}
            resetError={props.resetErrorBoundary}
            context={context}
          />
        );
      }}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
};

/**
 * Screen-level Error Boundary
 */
interface ScreenErrorBoundaryProps extends AppErrorBoundaryProps {
  screenName: string;
}

export const ScreenErrorBoundary: React.FC<ScreenErrorBoundaryProps> = ({
  screenName,
  children,
  ...props
}) => {
  const context: ErrorContext = {
    ...props.context,
    screen: screenName,
  };

  return (
    <AppErrorBoundary {...props} context={context}>
      {children}
    </AppErrorBoundary>
  );
};

/**
 * Component-level Error Boundary for specific components
 */
interface ComponentErrorBoundaryProps extends AppErrorBoundaryProps {
  componentName: string;
}

export const ComponentErrorBoundary: React.FC<ComponentErrorBoundaryProps> = ({
  componentName,
  children,
  ...props
}) => {
  const context: ErrorContext = {
    ...props.context,
    component: componentName,
  };

  return (
    <AppErrorBoundary {...props} context={context}>
      {children}
    </AppErrorBoundary>
  );
};

/**
 * HOC for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
  fallback?: React.ComponentType<ErrorFallbackProps>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ComponentErrorBoundary
      componentName={
        componentName || Component.displayName || Component.name || 'Component'
      }
      fallback={fallback}
    >
      <Component {...(props as P)} ref={ref} />
    </ComponentErrorBoundary>
  ));
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  debugInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
