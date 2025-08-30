import { Link } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { useForgotPassword } from '@/api/auth';
import { Button, Input, Text } from '@/components/ui';
import { withGuest } from '@/lib/auth/route-guards';

function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const forgotPassword = useForgotPassword();

  const handleSubmit = async () => {
    try {
      await forgotPassword.mutateAsync({ email });
      setSubmitted(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 justify-center bg-white px-6 dark:bg-neutral-900">
        <View className="mb-8 items-center">
          <View className="mb-4 size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Text className="text-2xl">✓</Text>
          </View>
          <Text className="mb-2 text-center text-2xl font-bold text-neutral-900 dark:text-white">
            Check your email
          </Text>
          <Text className="text-center text-neutral-600 dark:text-neutral-400">
            We've sent password reset instructions to {email}
          </Text>
        </View>

        <View className="space-y-4">
          <Button onPress={() => setSubmitted(false)} variant="secondary">
            Didn't receive email? Try again
          </Button>

          <View className="flex-row justify-center">
            <Link href="/(auth)/login" asChild>
              <Text className="font-medium text-blue-600 dark:text-blue-400">
                Back to Sign In
              </Text>
            </Link>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center bg-white px-6 dark:bg-neutral-900">
      <View className="mb-12">
        <Text className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">
          Reset Password
        </Text>
        <Text className="text-neutral-600 dark:text-neutral-400">
          Enter your email address and we'll send you instructions to reset your
          password
        </Text>
      </View>

      <View className="mb-6 space-y-4">
        <Input
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
      </View>

      <Button
        onPress={handleSubmit}
        disabled={!email || forgotPassword.isPending}
        loading={forgotPassword.isPending}
        className="mb-4"
      >
        Send Reset Instructions
      </Button>

      <View className="flex-row justify-center">
        <Text className="text-neutral-600 dark:text-neutral-400">
          Remember your password?{' '}
        </Text>
        <Link href="/(auth)/login" asChild>
          <Text className="font-medium text-blue-600 dark:text-blue-400">
            Sign In
          </Text>
        </Link>
      </View>
    </View>
  );
}

export default withGuest(ForgotPasswordScreen);
