/**
 * Backend Token Validation Test
 * Test if your backend can validate the Supabase JWT tokens
 */

import { Env } from '@env';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getToken } from './utils';

export const BackendTokenTest: React.FC = () => {
  const testTokenValidation = async () => {
    console.log('\n🔬 === BACKEND TOKEN VALIDATION TEST ===');

    const token = getToken();
    if (!token?.access) {
      console.log('❌ No access token available - please login first');
      return;
    }

    console.log('🔑 Testing token:', token.access.substring(0, 50) + '...');

    try {
      // Test the token verification endpoint
      console.log('🧪 Testing /api/v2/auth/verify endpoint...');
      const verifyResponse = await fetch(`${Env.API_URL}/api/v2/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.access}`,
        },
        body: JSON.stringify({ token: token.access }),
      });

      console.log('📊 Verify response status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('📥 Verify response data:', verifyData);

      if (verifyResponse.ok) {
        console.log('✅ Token is valid according to backend');
      } else {
        console.log('❌ Token rejected by backend:', verifyData.error?.message);
      }

      // Test a protected endpoint directly
      console.log('\n🛡️ Testing protected endpoint /api/v2/trips...');
      const tripsResponse = await fetch(`${Env.API_URL}/api/v2/trips`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.access}`,
        },
      });

      console.log('📊 Trips response status:', tripsResponse.status);
      const tripsData = await tripsResponse.json();
      console.log('📥 Trips response data:', tripsData);

      if (tripsResponse.ok) {
        console.log('✅ Protected endpoint accessible with current token');
      } else {
        console.log(
          '❌ Protected endpoint rejected token:',
          tripsData.error?.message
        );

        // Check if it's a token format issue
        if (tripsData.error?.message?.includes('Invalid or expired token')) {
          console.log('\n🔍 TOKEN FORMAT ANALYSIS:');

          // Decode the JWT payload (client-side, no verification)
          try {
            const parts = token.access.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(
                atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
              );
              console.log('📄 JWT Payload:', {
                issuer: payload.iss,
                subject: payload.sub,
                audience: payload.aud,
                expiration: new Date(payload.exp * 1000),
                issuedAt: new Date(payload.iat * 1000),
                email: payload.email,
                role: payload.role,
              });

              // Check if token is expired
              const now = Date.now() / 1000;
              if (payload.exp < now) {
                console.log(
                  '⏰ TOKEN EXPIRED! Expiry:',
                  new Date(payload.exp * 1000)
                );
              } else {
                console.log(
                  '⏰ Token is still valid until:',
                  new Date(payload.exp * 1000)
                );
              }
            }
          } catch (decodeError) {
            console.error('❌ Could not decode JWT:', decodeError);
          }
        }
      }
    } catch (error) {
      console.error('🚨 Backend token test failed:', error);
    }

    console.log('🏁 === END BACKEND TOKEN TEST ===\n');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Backend Token Test</Text>
      <TouchableOpacity style={styles.button} onPress={testTokenValidation}>
        <Text style={styles.buttonText}>Test Current Token</Text>
      </TouchableOpacity>
      <Text style={styles.info}>
        Tests if your backend accepts the current Supabase JWT token
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#add8e6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4682b4',
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
