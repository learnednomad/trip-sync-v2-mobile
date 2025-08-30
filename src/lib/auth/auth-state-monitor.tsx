/**
 * Authentication State Monitor
 * Ensures proper auth state initialization and provides debugging
 */

import React from 'react';

import { useAuth } from './index';
import { getToken } from './utils';

interface AuthStateInfo {
  storeStatus: string;
  storeHasToken: boolean;
  storageHasToken: boolean;
  tokensMatch: boolean;
  accessTokenLength: number;
  refreshTokenLength: number;
  lastChecked: string;
}

export const AuthStateMonitor: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authState = useAuth();
  const [stateInfo, setStateInfo] = React.useState<AuthStateInfo | null>(null);
  const [initializationComplete, setInitializationComplete] =
    React.useState(false);
  const [lastLogTime, setLastLogTime] = React.useState<number>(0);
  const [stableStateCount, setStableStateCount] = React.useState<number>(0);

  // Monitor auth state changes
  React.useEffect(() => {
    const updateStateInfo = () => {
      const storageToken = getToken();
      const storeToken = authState.token;

      const info: AuthStateInfo = {
        storeStatus: authState.status,
        storeHasToken: !!storeToken,
        storageHasToken: !!storageToken,
        tokensMatch:
          !!storageToken &&
          !!storeToken &&
          storageToken.access === storeToken.access,
        accessTokenLength: storageToken?.access?.length || 0,
        refreshTokenLength: storageToken?.refresh?.length || 0,
        lastChecked: new Date().toISOString(),
      };

      setStateInfo(info);

      if (__DEV__) {
        // Debounce logging - only log if state changed or every 60 seconds
        const now = Date.now();
        const stateChanged = !stateInfo || 
          stateInfo.storeStatus !== info.storeStatus ||
          stateInfo.tokensMatch !== info.tokensMatch;
        const timeSinceLastLog = now - lastLogTime;
        
        if (stateChanged || timeSinceLastLog > 60000) { // 60 seconds
          console.log('🔍 Auth State Monitor Update:', {
            status: info.storeStatus,
            storeToken: info.storeHasToken,
            storageToken: info.storageHasToken,
            tokensMatch: info.tokensMatch,
            accessLength: info.accessTokenLength,
            refreshLength: info.refreshTokenLength,
          });
          setLastLogTime(now);
        }

        // Check for potential issues
        if (info.storeHasToken && !info.storageHasToken) {
          console.warn(
            "⚠️  Store has token but storage doesn't - storage may have been cleared"
          );
        }

        if (info.storageHasToken && !info.storeHasToken) {
          console.warn(
            "⚠️  Storage has token but store doesn't - hydration may have failed"
          );
        }

        if (info.storeHasToken && info.storageHasToken && !info.tokensMatch) {
          console.warn(
            "⚠️  Tokens exist in both places but don't match - sync issue detected"
          );
        }
      }
    };

    // Initial check
    updateStateInfo();

    // Set up optimized periodic monitoring
    const interval = setInterval(updateStateInfo, 30000); // Check every 30 seconds (reduced from 5s)

    return () => clearInterval(interval);
  }, [authState.status, authState.token]);

  // Monitor initialization completion
  React.useEffect(() => {
    // Consider initialization complete when:
    // 1. Status is not 'idle' (hydration has run)
    // 2. Store and storage are in sync
    const isComplete =
      authState.status !== 'idle' && stateInfo?.tokensMatch !== false; // not false (could be true or null)

    if (!initializationComplete && isComplete) {
      setInitializationComplete(true);
      if (__DEV__) {
        console.log('✅ Authentication initialization complete');
        console.log('Final state:', {
          status: authState.status,
          authenticated: authState.status === 'signIn',
          hasValidTokens: !!(
            stateInfo?.storeHasToken && stateInfo?.storageHasToken
          ),
        });
      }
    }
  }, [authState.status, stateInfo?.tokensMatch, initializationComplete]);

  // Handle authentication warnings
  React.useEffect(() => {
    if (stateInfo && initializationComplete) {
      // Warn about potential authentication issues
      if (
        authState.status === 'signIn' &&
        (!stateInfo.storeHasToken || !stateInfo.storageHasToken)
      ) {
        console.error('🚨 Authentication inconsistency detected:');
        console.error('  - Status says signed in but tokens are missing');
        console.error('  - This will cause 401 errors on API calls');
      }

      if (
        authState.status === 'signOut' &&
        (stateInfo.storeHasToken || stateInfo.storageHasToken)
      ) {
        console.warn('⚠️  Status says signed out but tokens still exist');
        console.warn('  - This could indicate incomplete sign out process');
      }
    }
  }, [authState.status, stateInfo, initializationComplete]);

  // Show loading during initialization if in development
  if (__DEV__ && !initializationComplete) {
    if (__DEV__) {
      console.log('⏳ Authentication initializing...', {
        status: authState.status,
        stateInfo: stateInfo
          ? {
              storeToken: stateInfo.storeHasToken,
              storageToken: stateInfo.storageHasToken,
              tokensMatch: stateInfo.tokensMatch,
            }
          : null,
      });
    }
  }

  return (
    <>
      {children}
      {__DEV__ && stateInfo && <AuthDebugInfo stateInfo={stateInfo} />}
    </>
  );
};

// Development-only debug info overlay
const AuthDebugInfo: React.FC<{ stateInfo: AuthStateInfo }> = ({
  stateInfo,
}) => {
  const [showDebug, setShowDebug] = React.useState(false);

  if (!__DEV__ || !showDebug) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '200px',
      }}
    >
      <div
        onClick={() => setShowDebug(false)}
        style={{ cursor: 'pointer', textAlign: 'right' }}
      >
        ✕
      </div>
      <div>Status: {stateInfo.storeStatus}</div>
      <div>Store: {stateInfo.storeHasToken ? '✅' : '❌'}</div>
      <div>Storage: {stateInfo.storageHasToken ? '✅' : '❌'}</div>
      <div>Match: {stateInfo.tokensMatch ? '✅' : '❌'}</div>
      <div>Access: {stateInfo.accessTokenLength}</div>
      <div>Refresh: {stateInfo.refreshTokenLength}</div>
      <div style={{ fontSize: '8px', marginTop: '4px' }}>
        {new Date(stateInfo.lastChecked).toLocaleTimeString()}
      </div>
    </div>
  );
};

/**
 * Hook to check if authentication is properly initialized
 */
export const useAuthInitialization = () => {
  const authState = useAuth();
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const checkInitialization = () => {
      const storageToken = getToken();
      const storeToken = authState.token;

      // Consider initialized when:
      // 1. Status is not 'idle'
      // 2. If tokens exist, they should be in sync
      const statusInitialized = authState.status !== 'idle';
      const tokensInSync =
        !storageToken ||
        !storeToken ||
        storageToken.access === storeToken.access;

      const initialized = statusInitialized && tokensInSync;

      if (initialized !== isInitialized) {
        setIsInitialized(initialized);
        if (__DEV__ && initialized) {
          console.log(
            '✅ useAuthInitialization: Authentication initialization complete'
          );
        }
      }
    };

    checkInitialization();
  }, [authState.status, authState.token, isInitialized]);

  return {
    isInitialized,
    authStatus: authState.status,
    hasToken: !!authState.token,
    isAuthenticated: authState.status === 'signIn' && !!authState.token,
  };
};
