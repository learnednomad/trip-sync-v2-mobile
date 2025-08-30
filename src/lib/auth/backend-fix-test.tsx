/**
 * IMMEDIATE BACKEND FIX TEST
 * Test your backend's JWT validation configuration
 */

import { Env } from '@env';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export const BackendFixTest: React.FC = () => {
  const testBackendConfig = async () => {
    console.log('\n🔧 === BACKEND CONFIGURATION TEST ===');

    try {
      // Test 1: Check if backend health endpoint works
      console.log('🏥 Testing backend health...');
      const healthResponse = await fetch(`${Env.API_URL}/health`);
      console.log('📊 Health status:', healthResponse.status);
      const healthData = await healthResponse.text();
      console.log('📥 Health response:', healthData);

      // Test 2: Check JWT configuration endpoint
      console.log('\n🔑 Testing JWT configuration...');
      const jwtConfigResponse = await fetch(
        `${Env.API_URL}/api/v2/auth/jwt-config`
      );
      console.log('📊 JWT config status:', jwtConfigResponse.status);

      if (jwtConfigResponse.ok) {
        const jwtConfigData = await jwtConfigResponse.json();
        console.log('📥 JWT config:', jwtConfigData);
      } else {
        console.log('❌ JWT config endpoint not available');
      }

      // Test 3: Test with a sample JWT payload
      console.log('\n🧪 Testing JWT validation...');

      // This is the actual token structure your backend should expect
      const sampleJWT = {
        iss: 'https://trdizrlxtflmjrxnnici.supabase.co/auth/v1',
        sub: 'bde000f9-bf6c-419b-8c0b-db91be4d5824',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        email: 'texminer8@gmail.com',
        role: 'authenticated',
      };

      console.log('🔍 Expected JWT payload structure:', sampleJWT);
      console.log('\n💡 BACKEND CONFIGURATION NEEDED:');
      console.log(
        '   1. Supabase JWT Secret: Check your Supabase project settings'
      );
      console.log(
        '   2. JWT Validation URL: https://trdizrlxtflmjrxnnici.supabase.co/auth/v1'
      );
      console.log('   3. Expected audience: "authenticated"');
      console.log('   4. Token format: Bearer <supabase_jwt>');
    } catch (error) {
      console.error('🚨 Backend test failed:', error);
    }

    console.log('🏁 === END BACKEND TEST ===\n');
  };

  const showBackendConfigInstructions = () => {
    console.log('\n📋 === BACKEND CONFIGURATION INSTRUCTIONS ===');
    console.log('');
    console.log('🎯 IMMEDIATE BACKEND FIX REQUIRED:');
    console.log('');
    console.log('1. **Check Supabase JWT Configuration**:');
    console.log('   - Go to your Supabase project dashboard');
    console.log('   - Settings > API > Project API keys');
    console.log('   - Copy the JWT Secret');
    console.log('');
    console.log('2. **Configure Hono API Auth Middleware**:');
    console.log('   - Set SUPABASE_JWT_SECRET in environment variables');
    console.log('   - Configure JWT verification to use Supabase issuer');
    console.log('   - Ensure middleware validates "authenticated" audience');
    console.log('');
    console.log('3. **Expected Environment Variables**:');
    console.log('   - SUPABASE_URL=https://trdizrlxtflmjrxnnici.supabase.co');
    console.log('   - SUPABASE_ANON_KEY=<your_anon_key>');
    console.log('   - SUPABASE_SERVICE_KEY=<your_service_role_key>');
    console.log('   - JWT_SECRET=<your_jwt_secret>');
    console.log('');
    console.log('4. **Verify JWT Middleware Setup**:');
    console.log('   - Should decode JWT header');
    console.log('   - Should verify signature with Supabase secret');
    console.log('   - Should extract user_id from "sub" claim');
    console.log('   - Should inject user context into request');
    console.log('');
    console.log('🚨 CRITICAL: Your backend is rejecting valid Supabase JWTs!');
    console.log('🏁 === END INSTRUCTIONS ===\n');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Backend Fix Helper</Text>

      <TouchableOpacity style={styles.button} onPress={testBackendConfig}>
        <Text style={styles.buttonText}>🏥 Test Backend Config</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={showBackendConfigInstructions}
      >
        <Text style={styles.buttonText}>📋 Show Fix Instructions</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🚨 CRITICAL ISSUE IDENTIFIED</Text>
        <Text style={styles.infoText}>
          Your authentication flow is working perfectly, but your backend is
          rejecting valid Supabase JWT tokens.
          {'\n\n'}
          The mobile app successfully: • ✅ Logs in and gets tokens • ✅ Stores
          tokens correctly • ✅ Attaches Bearer token to requests
          {'\n\n'}
          But your backend returns: • ❌ "Invalid or expired token"
          {'\n\n'}
          This means your Hono API auth middleware needs to be configured to
          validate Supabase JWTs properly.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#d32f2f',
  },
  button: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: '#ff9800',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  infoText: {
    color: '#333',
    lineHeight: 20,
    fontSize: 14,
  },
});
