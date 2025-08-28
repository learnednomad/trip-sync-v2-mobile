/**
 * Enhanced Token Debugging Utility
 * Comprehensive diagnostics for authentication token flow
 */

import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { getToken } from './utils';
import { useAuth } from './index';
import { client } from '@/api/common/client';
import { Env } from '@env';

interface TokenDebugInfo {
  timestamp: string;
  source: string;
  tokenExists: boolean;
  accessTokenLength: number;
  refreshTokenLength: number;
  storeStatus: string;
  storageToken: any;
  error?: string;
}

export const TokenDebugger: React.FC = () => {
  const [debugLog, setDebugLog] = React.useState<TokenDebugInfo[]>([]);
  const authState = useAuth();

  const logTokenState = (source: string, additionalInfo?: any) => {
    try {
      const storageToken = getToken();
      const storeToken = authState.token;
      
      const debugInfo: TokenDebugInfo = {
        timestamp: new Date().toISOString(),
        source,
        tokenExists: !!storageToken,
        accessTokenLength: storageToken?.access?.length || 0,
        refreshTokenLength: storageToken?.refresh?.length || 0,
        storeStatus: authState.status,
        storageToken: storageToken ? {
          access: storageToken.access?.substring(0, 20) + '...',
          refresh: storageToken.refresh?.substring(0, 20) + '...',
        } : null,
      };

      if (additionalInfo?.error) {
        debugInfo.error = additionalInfo.error.toString();
      }

      setDebugLog(prev => [debugInfo, ...prev.slice(0, 19)]); // Keep last 20 entries
      
      console.log(`🔍 TOKEN DEBUG [${source}]:`, {
        storageToken: !!storageToken,
        storeToken: !!storeToken,
        accessLength: storageToken?.access?.length || 0,
        refreshLength: storageToken?.refresh?.length || 0,
        storeStatus: authState.status,
        additionalInfo,
      });
    } catch (error) {
      console.error('Token debug error:', error);
    }
  };

  const testTokenFlow = async () => {
    console.log('\n🧪 === COMPREHENSIVE TOKEN FLOW TEST ===');
    
    // 1. Check initial state
    logTokenState('INITIAL_CHECK');
    
    // 2. Test storage directly
    try {
      const directToken = getToken();
      logTokenState('DIRECT_STORAGE_CHECK', { directToken });
    } catch (error) {
      logTokenState('DIRECT_STORAGE_ERROR', { error });
    }

    // 3. Test axios client headers
    try {
      const testConfig = {
        method: 'GET',
        url: '/api/v2/auth/verify',
        headers: {},
      };

      // Manually trigger request interceptor logic
      const token = getToken();
      if (token?.access) {
        testConfig.headers['Authorization'] = `Bearer ${token.access}`;
        logTokenState('MANUAL_HEADER_SET', { headerSet: true });
      } else {
        logTokenState('MANUAL_HEADER_FAILED', { reason: 'No access token' });
      }
    } catch (error) {
      logTokenState('AXIOS_CONFIG_ERROR', { error });
    }

    // 4. Test actual API call
    try {
      console.log('🔄 Testing actual API call...');
      const response = await client.get('/api/v2/auth/verify');
      logTokenState('API_CALL_SUCCESS', { status: response.status });
    } catch (error) {
      logTokenState('API_CALL_ERROR', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    console.log('🏁 === TOKEN FLOW TEST COMPLETE ===\n');
  };

  const testTripsEndpoint = async () => {
    console.log('\n🎯 === TESTING TRIPS ENDPOINT ===');
    
    logTokenState('BEFORE_TRIPS_CALL');
    
    try {
      const response = await client.get('/api/v2/trips');
      logTokenState('TRIPS_CALL_SUCCESS', { 
        status: response.status,
        dataLength: response.data?.data?.trips?.length || 0,
      });
    } catch (error) {
      logTokenState('TRIPS_CALL_ERROR', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          headers: error.config?.headers?.Authorization ? 'PRESENT' : 'MISSING',
        },
      });
    }
    
    console.log('🏁 === TRIPS ENDPOINT TEST COMPLETE ===\n');
  };

  const clearDebugLog = () => {
    setDebugLog([]);
  };

  const exportDebugLog = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      environment: {
        apiUrl: Env.API_URL,
        appEnv: Env.APP_ENV,
      },
      authState: {
        status: authState.status,
        hasToken: !!authState.token,
      },
      debugEntries: debugLog,
    };
    
    Alert.alert(
      'Debug Log Export',
      `Log contains ${debugLog.length} entries. Check console for full data.`,
      [{ text: 'OK' }]
    );
    
    console.log('📊 EXPORTED DEBUG LOG:', JSON.stringify(logData, null, 2));
  };

  return (
    <View style={{ padding: 16, backgroundColor: '#f0f0f0', margin: 16, borderRadius: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
        🔍 Token Debugger
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => logTokenState('MANUAL_CHECK')}
          style={{ backgroundColor: '#007AFF', padding: 8, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Check Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testTokenFlow}
          style={{ backgroundColor: '#34C759', padding: 8, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Full Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testTripsEndpoint}
          style={{ backgroundColor: '#FF9500', padding: 8, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Test Trips</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={exportDebugLog}
          style={{ backgroundColor: '#5856D6', padding: 8, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Export Log</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={clearDebugLog}
          style={{ backgroundColor: '#FF3B30', padding: 8, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
        Current State:
      </Text>
      <Text style={{ fontSize: 12, marginBottom: 8 }}>
        Store Status: {authState.status} | Has Token: {authState.token ? 'Yes' : 'No'}
      </Text>

      {debugLog.length > 0 && (
        <>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            Debug Log ({debugLog.length}/20):
          </Text>
          <ScrollView style={{ maxHeight: 300, backgroundColor: 'white', padding: 8, borderRadius: 4 }}>
            {debugLog.map((entry, index) => (
              <View key={index} style={{ marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#333' }}>
                  {entry.timestamp} - {entry.source}
                </Text>
                <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                  Token: {entry.tokenExists ? '✅' : '❌'} | 
                  Access: {entry.accessTokenLength} chars | 
                  Refresh: {entry.refreshTokenLength} chars
                </Text>
                <Text style={{ fontSize: 10, color: '#666' }}>
                  Status: {entry.storeStatus}
                </Text>
                {entry.error && (
                  <Text style={{ fontSize: 10, color: '#FF3B30', marginTop: 2 }}>
                    Error: {entry.error}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
};

// Hook for easy debugging in components
export const useTokenDebug = () => {
  const authState = useAuth();
  
  const debugToken = React.useCallback((context: string) => {
    const token = getToken();
    console.log(`🔍 TOKEN DEBUG [${context}]:`, {
      storeStatus: authState.status,
      storeHasToken: !!authState.token,
      storageHasToken: !!token,
      accessLength: token?.access?.length || 0,
      refreshLength: token?.refresh?.length || 0,
      timestamp: new Date().toISOString(),
    });
    return token;
  }, [authState.status, authState.token]);

  return { debugToken };
};