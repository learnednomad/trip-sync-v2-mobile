/**
 * Authentication Debug Panel Component
 * Add this component to your app temporarily to debug authentication issues
 *
 * Usage:
 * Import and add <AuthDebugPanel /> to your main screen
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { client } from '@/api/common/client';
import { AuthDebugger } from '@/lib/auth/debug-utils';
import { getToken } from '@/lib/auth/utils';

interface DebugLog {
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
}

export const AuthDebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<
    'none' | 'present' | 'checking'
  >('checking');

  const addLog = (
    message: string,
    type: 'info' | 'success' | 'error' = 'info'
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  };

  const clearLogs = () => setLogs([]);

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const checkTokenStatus = () => {
    const token = getToken();
    setTokenStatus(token ? 'present' : 'none');
    addLog(
      `Token status: ${token ? 'Present' : 'None'}`,
      token ? 'success' : 'error'
    );
  };

  const runFullDiagnostics = () => {
    addLog('Running full authentication diagnostics...', 'info');

    // Run all diagnostic functions
    setTimeout(() => {
      AuthDebugger.diagnoseToken();
      AuthDebugger.diagnoseStorage();
      checkTokenStatus();
      addLog('Diagnostics complete - check console for details', 'success');
    }, 100);
  };

  const testApiConnectivity = async () => {
    setLoading(true);
    addLog('Testing API connectivity...', 'info');

    try {
      await AuthDebugger.testApiConnectivity();
      addLog('API connectivity test complete - check console', 'success');
    } catch (error) {
      addLog(`API test failed: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testTripApiCall = async () => {
    if (tokenStatus === 'none') {
      Alert.alert('No Token', 'Please login first or create a test token');
      return;
    }

    setLoading(true);
    addLog('Testing /api/v2/trips endpoint...', 'info');

    try {
      const response = await client.get('/api/v2/trips');
      addLog('✅ Trip API call successful!', 'success');
      console.log('Trip API Response:', response.data);
    } catch (error) {
      addLog(`❌ Trip API call failed: ${error}`, 'error');
      console.error('Trip API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestToken = () => {
    const testToken = AuthDebugger.createTestToken();
    setTokenStatus('present');
    addLog('Test token created - this will NOT work with real API', 'info');
  };

  const clearAuth = () => {
    AuthDebugger.clearAuthData();
    setTokenStatus('none');
    addLog('Authentication data cleared', 'info');
  };

  const getStatusColor = () => {
    switch (tokenStatus) {
      case 'present':
        return '#4CAF50';
      case 'none':
        return '#F44336';
      case 'checking':
        return '#FF9800';
    }
  };

  const getStatusText = () => {
    switch (tokenStatus) {
      case 'present':
        return '✅ Token Present';
      case 'none':
        return '❌ No Token';
      case 'checking':
        return '🔍 Checking...';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <TouchableOpacity
          onPress={checkTokenStatus}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Actions</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={runFullDiagnostics}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔍 Run Full Diagnostics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testApiConnectivity}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🌐 Test API Connectivity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            tokenStatus === 'none' && styles.buttonDisabled,
          ]}
          onPress={testTripApiCall}
          disabled={loading || tokenStatus === 'none'}
        >
          <Text style={styles.buttonText}>📡 Test Trip API Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={createTestToken}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🧪 Create Test Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={clearAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🧹 Clear Auth Data</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Running test...</Text>
        </View>
      )}

      {/* Logs Section */}
      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>📋 Debug Logs</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearLogsButton}>
            <Text style={styles.clearLogsText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsContainer}>
          {logs.length === 0 ? (
            <Text style={styles.noLogsText}>No logs yet - run some tests!</Text>
          ) : (
            logs.map((log, index) => {
              const logStyleKey =
                `log${log.type.charAt(0).toUpperCase() + log.type.slice(1)}` as keyof typeof styles;
              const logStyle = styles[logStyleKey] || {};
              return (
                <View key={index} style={[styles.logItem, logStyle as any]}>
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  <Text style={styles.logMessage}>{log.message}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Instructions</Text>
        <Text style={styles.instructionText}>
          1. Run "Full Diagnostics" to check current auth state{'\n'}
          2. Check console logs for detailed output{'\n'}
          3. Use "Test API Connectivity" to verify backend is reachable{'\n'}
          4. Try "Test Trip API Call" to reproduce the 401 error{'\n'}
          5. All detailed logs appear in React Native console
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearLogsButton: {
    padding: 8,
  },
  clearLogsText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  logsContainer: {
    maxHeight: 300,
  },
  noLogsText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  logItem: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    borderLeftWidth: 4,
  },
  logInfo: {
    backgroundColor: '#e7f4ff',
    borderLeftColor: '#007AFF',
  },
  logSuccess: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#4CAF50',
  },
  logError: {
    backgroundColor: '#ffeaea',
    borderLeftColor: '#F44336',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  instructionText: {
    color: '#666',
    lineHeight: 20,
  },
});
