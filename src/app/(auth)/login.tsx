import { Link } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useLogin } from '@/api/auth';
import type { LoginFormProps } from '@/components/login-form';
import { LoginForm } from '@/components/login-form';
import { FocusAwareStatusBar, Text } from '@/components/ui';
import { withGuest } from '@/lib/auth/route-guards';
import { TokenDebugger } from '@/lib/auth/token-debugger';

function Login() {
  const loginMutation = useLogin();

  const onSubmit: LoginFormProps['onSubmit'] = (data) => {
    console.log('Login attempt:', data);
    loginMutation.mutate({
      email: data.email,
      password: data.password,
      deviceId: 'mobile-app',
      deviceName: 'React Native App',
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* TEMPORARY DEBUG HELPERS - Remove after fixing */}
      <TokenDebugger />

      <LoginForm
        onSubmit={onSubmit}
        isLoading={loginMutation.isPending}
        error={loginMutation.error}
      />

      {/* Auth navigation links */}
      <View className="px-6 pb-8">
        <View className="mb-4 flex-row items-center justify-center">
          <Text className="text-neutral-600 dark:text-neutral-400">
            Don't have an account?{' '}
          </Text>
          <Link href="/(auth)/register" asChild>
            <Text className="font-medium text-blue-600 dark:text-blue-400">
              Sign Up
            </Text>
          </Link>
        </View>

        <View className="flex-row justify-center">
          <Link href="/(auth)/forgot-password" asChild>
            <Text className="font-medium text-blue-600 dark:text-blue-400">
              Forgot Password?
            </Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

export default withGuest(Login);
