/**
 * Offline Authentication State Management
 * Handles auth token validation and offline user data
 */

import { storage } from '@/lib/storage';
import type { User, AuthTokens } from '@/api/auth/types';

interface OfflineAuthState {
  user: User | null;
  tokens: AuthTokens | null;
  lastValidation: string;
  isOfflineMode: boolean;
  offlineCapabilities: string[];
}

const AUTH_STATE_KEY = '@trip-sync/offline-auth';
const TOKEN_VALIDATION_KEY = '@trip-sync/token-validation';

export class OfflineAuthManager {
  private static instance: OfflineAuthManager;
  
  static getInstance(): OfflineAuthManager {
    if (!OfflineAuthManager.instance) {
      OfflineAuthManager.instance = new OfflineAuthManager();
    }
    return OfflineAuthManager.instance;
  }

  /**
   * Store authentication state for offline access
   */
  async storeAuthState(user: User, tokens: AuthTokens): Promise<void> {
    const authState: OfflineAuthState = {
      user,
      tokens,
      lastValidation: new Date().toISOString(),
      isOfflineMode: false,
      offlineCapabilities: [
        'view_trips',
        'create_trips',
        'edit_trips',
        'view_participants',
        'basic_navigation',
      ],
    };

    storage.set(AUTH_STATE_KEY, JSON.stringify(authState));
    
    // Store token validation timestamp
    this.storeTokenValidation(tokens.access);
  }

  /**
   * Get cached authentication state
   */
  getOfflineAuthState(): OfflineAuthState | null {
    const stored = storage.getString(AUTH_STATE_KEY);
    
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing offline auth state:', error);
      return null;
    }
  }

  /**
   * Check if user can perform action offline
   */
  canPerformOfflineAction(action: string): boolean {
    const authState = this.getOfflineAuthState();
    
    if (!authState) return false;
    
    // Check if action is in offline capabilities
    return authState.offlineCapabilities.includes(action);
  }

  /**
   * Validate cached tokens without network
   */
  validateOfflineTokens(): {
    isValid: boolean;
    expiresIn: number;
    needsRefresh: boolean;
  } {
    const authState = this.getOfflineAuthState();
    
    if (!authState?.tokens) {
      return { isValid: false, expiresIn: 0, needsRefresh: true };
    }

    const validation = this.getTokenValidation();
    if (!validation) {
      return { isValid: false, expiresIn: 0, needsRefresh: true };
    }

    const now = Date.now();
    const expiresAt = validation.validUntil;
    const expiresIn = Math.max(0, expiresAt - now);
    const needsRefresh = expiresIn < 5 * 60 * 1000; // Refresh if <5 minutes left

    return {
      isValid: expiresIn > 0,
      expiresIn,
      needsRefresh,
    };
  }

  /**
   * Store token validation info for offline checking
   */
  private storeTokenValidation(accessToken: string): void {
    try {
      // Parse JWT payload (basic validation - not cryptographic)
      const payload = this.parseJWTPayload(accessToken);
      
      if (payload?.exp) {
        const validation = {
          validUntil: payload.exp * 1000, // Convert to milliseconds
          issuedAt: Date.now(),
          tokenHash: this.hashToken(accessToken),
        };
        
        storage.set(TOKEN_VALIDATION_KEY, JSON.stringify(validation));
      }
    } catch (error) {
      console.error('Error storing token validation:', error);
    }
  }

  private getTokenValidation(): { validUntil: number; issuedAt: number; tokenHash: string } | null {
    const stored = storage.getString(TOKEN_VALIDATION_KEY);
    
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing token validation:', error);
      return null;
    }
  }

  private parseJWTPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT payload:', error);
      return null;
    }
  }

  private hashToken(token: string): string {
    // Simple hash for token identification (not security)
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Enable offline mode
   */
  enableOfflineMode(): void {
    const authState = this.getOfflineAuthState();
    if (authState) {
      authState.isOfflineMode = true;
      storage.set(AUTH_STATE_KEY, JSON.stringify(authState));
    }
  }

  /**
   * Disable offline mode (back online)
   */
  disableOfflineMode(): void {
    const authState = this.getOfflineAuthState();
    if (authState) {
      authState.isOfflineMode = false;
      storage.set(AUTH_STATE_KEY, JSON.stringify(authState));
    }
  }

  /**
   * Clear offline authentication data
   */
  clearOfflineAuth(): void {
    storage.delete(AUTH_STATE_KEY);
    storage.delete(TOKEN_VALIDATION_KEY);
  }

  /**
   * Get offline user capabilities
   */
  getOfflineCapabilities(): string[] {
    const authState = this.getOfflineAuthState();
    return authState?.offlineCapabilities || [];
  }

  /**
   * Check if specific feature is available offline
   */
  isFeatureAvailableOffline(feature: string): boolean {
    const capabilities = this.getOfflineCapabilities();
    return capabilities.includes(feature);
  }
}

// Singleton instance
export const offlineAuthManager = OfflineAuthManager.getInstance();

// React hook for offline authentication
export const useOfflineAuth = () => {
  const [authState, setAuthState] = React.useState<OfflineAuthState | null>(null);
  const [validation, setValidation] = React.useState<{
    isValid: boolean;
    expiresIn: number;
    needsRefresh: boolean;
  } | null>(null);

  React.useEffect(() => {
    const loadAuthState = () => {
      const state = offlineAuthManager.getOfflineAuthState();
      setAuthState(state);
      
      if (state) {
        const tokenValidation = offlineAuthManager.validateOfflineTokens();
        setValidation(tokenValidation);
      }
    };

    loadAuthState();
    
    // Check token validation every minute
    const interval = setInterval(loadAuthState, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    authState,
    validation,
    isAuthenticated: authState?.user != null && validation?.isValid === true,
    isOfflineMode: authState?.isOfflineMode || false,
    canPerformAction: (action: string) => offlineAuthManager.canPerformOfflineAction(action),
    getCapabilities: () => offlineAuthManager.getOfflineCapabilities(),
    enableOfflineMode: () => offlineAuthManager.enableOfflineMode(),
    disableOfflineMode: () => offlineAuthManager.disableOfflineMode(),
  };
};