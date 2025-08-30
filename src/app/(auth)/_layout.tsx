import { Stack } from 'expo-router';
import React from 'react';

import { GuestGuard } from '@/lib/auth/route-guards';

/**
 * Layout for authentication routes (login, register, onboarding)
 * Protected with GuestGuard to redirect authenticated users
 */
export default function AuthLayout() {
  return (
    <GuestGuard>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: 'Sign In',
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: 'Create Account',
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: 'Reset Password',
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            title: 'Welcome',
          }}
        />
      </Stack>
    </GuestGuard>
  );
}
