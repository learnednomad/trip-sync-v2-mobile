#!/usr/bin/env node

/**
 * Authentication Debug Script
 * Test the mobile app's API client authentication flow
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testAuthentication() {
  console.log('🔍 Testing Authentication Flow...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing API health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check response:', healthResponse.status);
    console.log('   Status:', healthResponse.data?.status);

    // Test 2: Protected endpoint without auth (should get 401)
    console.log('\n2. Testing protected endpoint without auth...');
    try {
      const tripsResponse = await axios.get(`${API_BASE_URL}/api/v2/trips`);
      console.log('❌ Unexpected success - should have failed with 401');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly received 401 Unauthorized');
        console.log('   Error message:', error.response.data?.error?.message);
      } else {
        console.log(
          '❌ Unexpected error:',
          error.response?.status,
          error.message
        );
      }
    }

    // Test 3: Test JWT config endpoint (should be public)
    console.log('\n3. Testing JWT config endpoint...');
    try {
      const configResponse = await axios.get(
        `${API_BASE_URL}/api/v2/auth/config`
      );
      console.log('✅ JWT config response:', configResponse.status);
      if (configResponse.data?.success) {
        console.log('   Config available:', !!configResponse.data.data);
      }
    } catch (error) {
      console.log(
        '❌ JWT config failed:',
        error.response?.status,
        error.response?.data?.error?.message
      );
    }

    // Test 4: Try to create a test user (registration)
    console.log('\n4. Testing user registration...');
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
    };

    try {
      const registerResponse = await axios.post(
        `${API_BASE_URL}/api/v2/auth/register`,
        testUser
      );
      console.log('✅ Registration response:', registerResponse.status);

      if (registerResponse.data?.success && registerResponse.data.data) {
        const tokens = registerResponse.data.data.tokens;
        console.log('   Access token received:', !!tokens?.access);
        console.log('   Refresh token received:', !!tokens?.refresh);

        if (tokens?.access) {
          // Test 5: Use the access token to access protected endpoint
          console.log('\n5. Testing protected endpoint WITH auth token...');
          try {
            const authenticatedTripsResponse = await axios.get(
              `${API_BASE_URL}/api/v2/trips`,
              {
                headers: {
                  Authorization: `Bearer ${tokens.access}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            console.log(
              '✅ Authenticated trips request successful:',
              authenticatedTripsResponse.status
            );
            console.log(
              '   Response data:',
              authenticatedTripsResponse.data?.success ? 'Success' : 'Failed'
            );
          } catch (error) {
            console.log(
              '❌ Authenticated trips request failed:',
              error.response?.status
            );
            console.log('   Error:', error.response?.data?.error?.message);
          }
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(
          'ℹ️  User already exists - this is expected if run multiple times'
        );

        // Try login instead
        console.log('\n4b. Trying login with existing user...');
        try {
          const loginResponse = await axios.post(
            `${API_BASE_URL}/api/v2/auth/login`,
            {
              email: testUser.email,
              password: testUser.password,
            }
          );
          console.log('✅ Login response:', loginResponse.status);

          if (loginResponse.data?.success && loginResponse.data.data) {
            const tokens = loginResponse.data.data.tokens;
            console.log('   Access token received:', !!tokens?.access);
            console.log('   Refresh token received:', !!tokens?.refresh);

            if (tokens?.access) {
              // Test 5: Use the access token to access protected endpoint
              console.log('\n5. Testing protected endpoint WITH auth token...');
              try {
                const authenticatedTripsResponse = await axios.get(
                  `${API_BASE_URL}/api/v2/trips`,
                  {
                    headers: {
                      Authorization: `Bearer ${tokens.access}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                console.log(
                  '✅ Authenticated trips request successful:',
                  authenticatedTripsResponse.status
                );
                console.log(
                  '   Response data:',
                  authenticatedTripsResponse.data?.success
                    ? 'Success'
                    : 'Failed'
                );
                console.log(
                  '   Trips count:',
                  authenticatedTripsResponse.data?.data?.trips?.length || 0
                );
              } catch (error) {
                console.log(
                  '❌ Authenticated trips request failed:',
                  error.response?.status
                );
                console.log('   Error:', error.response?.data?.error?.message);
              }
            }
          }
        } catch (loginError) {
          console.log('❌ Login failed:', loginError.response?.status);
          console.log('   Error:', loginError.response?.data?.error?.message);
        }
      } else {
        console.log('❌ Registration failed:', error.response?.status);
        console.log('   Error:', error.response?.data?.error?.message);
      }
    }

    console.log('\n🎉 Authentication flow test completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAuthentication();
