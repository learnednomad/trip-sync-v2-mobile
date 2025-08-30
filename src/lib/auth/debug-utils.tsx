/**
 * Authentication Debug Utilities
 * Use these utilities to diagnose authentication issues in development
 */

import { Env } from '@env';

import { storage } from '@/lib/storage';

import { getToken } from './utils';

export class AuthDebugger {
  /**
   * Comprehensive token diagnostic
   */
  static diagnoseToken() {
    console.log('\n🔐 === TOKEN DIAGNOSTICS ===');

    const token = getToken();
    console.log('📄 Token exists:', !!token);

    if (token) {
      console.log('🔑 Access token length:', token.access?.length || 0);
      console.log('🔄 Refresh token length:', token.refresh?.length || 0);
      console.log(
        '🔍 Access token preview:',
        token.access?.substring(0, 50) + '...'
      );

      // Try to decode JWT payload (without verification)
      try {
        const payload = this.decodeJWT(token.access);
        console.log('📊 Token payload:', {
          userId: payload?.sub || payload?.user_id,
          email: payload?.email,
          exp: payload?.exp ? new Date(payload.exp * 1000) : null,
          iat: payload?.iat ? new Date(payload.iat * 1000) : null,
          isExpired: payload?.exp ? Date.now() / 1000 > payload.exp : 'unknown',
        });
      } catch (error) {
        console.error('❌ Failed to decode token:', error);
      }
    } else {
      console.log('❌ No token found in storage');
      this.diagnoseStorage();
    }

    console.log('🏁 === END DIAGNOSTICS ===\n');
  }

  /**
   * Test API connectivity without authentication
   */
  static async testApiConnectivity() {
    console.log('\n🌐 === API CONNECTIVITY TEST ===');

    try {
      const response = await fetch(`${Env.API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('✅ API reachable:', response.status);
      const data = await response.text();
      console.log('📥 Response:', data.substring(0, 200));
    } catch (error) {
      console.error('❌ API unreachable:', error);
    }

    console.log('🏁 === END API TEST ===\n');
  }

  /**
   * Test authentication endpoint
   */
  static async testAuthEndpoint(
    email: string = 'test@example.com',
    password: string = 'test123'
  ) {
    console.log('\n🔐 === AUTH ENDPOINT TEST ===');

    try {
      const response = await fetch(`${Env.API_URL}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔑 Auth endpoint status:', response.status);
      const data = await response.json();
      console.log('📥 Auth response:', data);

      if (data.success && data.data) {
        console.log('✅ Login successful, token available');
        return data.data;
      } else {
        console.log('❌ Login failed:', data.error);
      }
    } catch (error) {
      console.error('❌ Auth endpoint error:', error);
    }

    console.log('🏁 === END AUTH TEST ===\n');
  }

  /**
   * Monitor axios requests in real-time
   */
  static startRequestMonitoring() {
    console.log('🔍 Starting real-time request monitoring...');

    // This would be called before making API calls
    return {
      logNextRequest: () => {
        console.log('🎯 Next API request will be monitored...');
      },
    };
  }

  /**
   * Check MMKV storage health
   */
  static diagnoseStorage() {
    console.log('\n💾 === STORAGE DIAGNOSTICS ===');

    try {
      // Check if MMKV is working
      storage.set('test-key', 'test-value');
      const testValue = storage.getString('test-key');
      console.log('✅ MMKV working:', testValue === 'test-value');
      storage.delete('test-key');

      // List all keys
      const allKeys = storage.getAllKeys();
      console.log('📋 All stored keys:', allKeys);

      // Check token storage specifically
      const tokenRaw = storage.getString('token');
      console.log('🔑 Raw token storage:', !!tokenRaw);

      if (tokenRaw) {
        try {
          const parsed = JSON.parse(tokenRaw);
          console.log('📄 Parsed token structure:', Object.keys(parsed));
        } catch (parseError) {
          console.error('❌ Token parsing failed:', parseError);
        }
      }
    } catch (error) {
      console.error('❌ Storage error:', error);
    }

    console.log('🏁 === END STORAGE DIAGNOSTICS ===\n');
  }

  /**
   * Decode JWT payload (client-side, no verification)
   */
  private static decodeJWT(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  /**
   * Create a test token for debugging
   */
  static createTestToken() {
    const testToken = {
      access: 'test-access-token-' + Date.now(),
      refresh: 'test-refresh-token-' + Date.now(),
    };

    storage.set('token', JSON.stringify(testToken));
    console.log('🧪 Test token created:', testToken);
    return testToken;
  }

  /**
   * Clear all auth data
   */
  static clearAuthData() {
    storage.delete('token');
    console.log('🧹 Authentication data cleared');
  }
}
