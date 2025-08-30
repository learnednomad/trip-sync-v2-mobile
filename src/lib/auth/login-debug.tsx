/**
 * TEMPORARY DEBUG TOOL - Add this to your login to see exact response structure
 */

import { Env } from '@env';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { setToken } from './utils';

export const LoginDebugHelper: React.FC = () => {
  const debugLogin = async () => {
    try {
      console.log('\n🔬 === DETAILED LOGIN DEBUG ===');

      const response = await fetch(`${Env.API_URL}/api/v2/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `debug-login-${Date.now()}`,
        },
        body: JSON.stringify({
          email: 'texminer8@gmail.com',
          password: 'Pass1word',
          deviceId: 'mobile-app',
          deviceName: 'React Native App',
        }),
      });

      const data = await response.json();

      console.log('🏆 Raw Response Status:', response.status);
      console.log('📦 Raw Response Data:', JSON.stringify(data, null, 2));
      console.log('🔍 Response Structure Analysis:');
      console.log('  - success:', data.success);
      console.log('  - data exists:', !!data.data);

      if (data.data) {
        console.log('  - data.tokens exists:', !!data.data.tokens);
        console.log('  - data.user exists:', !!data.data.user);

        if (data.data.tokens) {
          console.log('  - tokens structure:', Object.keys(data.data.tokens));
          console.log('  - tokens.access exists:', !!data.data.tokens.access);
          console.log('  - tokens.refresh exists:', !!data.data.tokens.refresh);
          console.log(
            '  - access token length:',
            data.data.tokens.access?.length
          );
          console.log(
            '  - refresh token length:',
            data.data.tokens.refresh?.length
          );
        }
      }

      // Try to manually store tokens if they exist
      if (
        data.success &&
        data.data?.tokens?.access &&
        data.data?.tokens?.refresh
      ) {
        const tokenData = {
          access: data.data.tokens.access,
          refresh: data.data.tokens.refresh,
        };

        console.log('💾 Attempting to store tokens manually...');
        setToken(tokenData);
        console.log('✅ Tokens stored successfully!');

        Alert.alert('Debug Success', 'Tokens stored! Now try your API call.');
      } else {
        console.error('❌ Token structure not as expected');
        Alert.alert('Debug Issue', 'Token structure mismatch - check console');
      }

      console.log('🏁 === END LOGIN DEBUG ===\n');
    } catch (error) {
      console.error('🚨 Debug login failed:', error);
      Alert.alert('Debug Error', `Login failed: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔬 Login Debug Helper</Text>
      <TouchableOpacity style={styles.button} onPress={debugLogin}>
        <Text style={styles.buttonText}>Debug Login Structure</Text>
      </TouchableOpacity>
      <Text style={styles.info}>
        This will log the exact response structure from your backend
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
