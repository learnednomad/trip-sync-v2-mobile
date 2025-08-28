/**
 * Test Authentication Component
 * Add this to your app temporarily to test authentication
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { setToken } from './utils';
import { AuthDebugger } from './debug-utils';
import { Env } from '@env';

export const TestLogin: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123');
  const [loading, setLoading] = useState(false);

  const handleTestLogin = async () => {
    setLoading(true);
    console.log('🧪 Starting test login...');
    
    try {
      // Test API connectivity first
      await AuthDebugger.testApiConnectivity();
      
      // Attempt login
      const response = await fetch(`${Env.API_URL}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': `test-login-${Date.now()}`
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log('🔐 Login response status:', response.status);
      const data = await response.json();
      console.log('📥 Login response data:', data);
      
      if (data.success && data.data?.session) {
        // Store tokens
        const tokens = {
          access: data.data.session.accessToken,
          refresh: data.data.session.refreshToken
        };
        
        setToken(tokens);
        console.log('✅ Tokens stored successfully');
        
        // Verify storage
        AuthDebugger.diagnoseToken();
        
        Alert.alert('Success', 'Login successful! Now try your API call.');
      } else {
        console.error('❌ Login failed:', data.error);
        Alert.alert('Login Failed', data.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('🚨 Login error:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiCall = async () => {
    console.log('🧪 Testing authenticated API call...');
    
    // Run diagnostics first
    AuthDebugger.diagnoseToken();
    
    try {
      // Import the client here to use current token
      const { client } = await import('@/api/common/client');
      
      const response = await client.get('/api/v2/trips');
      console.log('✅ API call successful:', response.data);
      Alert.alert('Success', 'API call worked!');
    } catch (error) {
      console.error('❌ API call failed:', error);
      Alert.alert('API Error', `API call failed: ${error}`);
    }
  };

  const handleRunDiagnostics = () => {
    AuthDebugger.diagnoseToken();
    AuthDebugger.diagnoseStorage();
  };

  const handleClearAuth = () => {
    AuthDebugger.clearAuthData();
    Alert.alert('Cleared', 'Authentication data cleared');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Authentication Debugger</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleTestLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : '🔐 Test Login'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test API Call</Text>
        <TouchableOpacity style={styles.button} onPress={handleTestApiCall}>
          <Text style={styles.buttonText}>📡 Test /api/v2/trips</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnostics</Text>
        <TouchableOpacity style={styles.button} onPress={handleRunDiagnostics}>
          <Text style={styles.buttonText}>🔍 Run Diagnostics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={handleClearAuth}>
          <Text style={styles.buttonText}>🧹 Clear Auth Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          1. Try "Test Login" first{'\n'}
          2. Check console logs for detailed output{'\n'}
          3. Try "Test API Call" after successful login{'\n'}
          4. Use diagnostics to troubleshoot issues
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  info: {
    backgroundColor: '#e7f4ff',
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    color: '#333',
    lineHeight: 20,
  },
});