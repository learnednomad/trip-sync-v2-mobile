import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { Button, ControlledInput, Text, View } from '@/components/ui';

const schema = z.object({
  name: z.string().optional(),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email format'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(6, 'Password must be at least 6 characters'),
});

export type FormType = z.infer<typeof schema>;

export type LoginFormProps = {
  onSubmit?: SubmitHandler<FormType>;
  isLoading?: boolean;
  error?: Error | null;
};

// Helper functions for user-friendly error messages
const getErrorTitle = (error: Error): string => {
  const message = error.message || '';
  
  if (message.includes('Too many requests') || message.includes('RATE_LIMIT_EXCEEDED')) {
    return 'Please wait a moment ⏳';
  }
  
  if (message.includes('Invalid credentials') || message.includes('INVALID_CREDENTIALS')) {
    return "Let's try that again 🔄";
  }
  
  if (message.includes('Network') || message.includes('NETWORK_ERROR')) {
    return 'Connection issue 📶';
  }
  
  return 'Oops! Something went wrong 😅';
};

const getErrorMessage = (error: Error): string => {
  const message = error.message || '';
  
  if (message.includes('Too many requests') || message.includes('RATE_LIMIT_EXCEEDED')) {
    return 'We\'re seeing lots of login attempts. Please wait a few minutes before trying again.';
  }
  
  if (message.includes('Invalid credentials') || message.includes('INVALID_CREDENTIALS')) {
    return 'Your email or password didn\'t match our records. Please double-check and try again.';
  }
  
  if (message.includes('Network') || message.includes('NETWORK_ERROR')) {
    return 'Please check your internet connection and try again.';
  }
  
  return 'We\'re having a technical issue. Please try again in a moment.';
};

const getRetryInfo = (error: Error): string | null => {
  const message = error.message || '';
  
  if (message.includes('Too many requests')) {
    // Extract retry time if available
    const retryMatch = message.match(/retryAfter[":]\s*(\d+)/);
    if (retryMatch) {
      const seconds = parseInt(retryMatch[1], 10);
      const minutes = Math.ceil(seconds / 60);
      return `You can try again in about ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
    }
    return 'You can try again in a few minutes.';
  }
  
  return null;
};

export const LoginForm = ({
  onSubmit = () => {},
  isLoading = false,
  error,
}: LoginFormProps) => {
  const { handleSubmit, control } = useForm<FormType>({
    resolver: zodResolver(schema),
  });
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text
            testID="form-title"
            className="pb-6 text-center text-4xl font-bold"
          >
            Sign In
          </Text>

          <Text className="mb-6 max-w-xs text-center text-gray-500">
            Welcome! 👋 Sign in with your Trip Sync account to continue.
          </Text>

          {error && (
            <View className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
              <Text className="text-center font-medium text-red-700 dark:text-red-300">
                {getErrorTitle(error)}
              </Text>
              <Text className="mt-1 text-center text-sm text-red-600 dark:text-red-400">
                {getErrorMessage(error)}
              </Text>
              {getRetryInfo(error) && (
                <Text className="mt-2 text-center text-xs text-red-500 dark:text-red-500">
                  {getRetryInfo(error)}
                </Text>
              )}
            </View>
          )}
        </View>

        <ControlledInput
          testID="name"
          control={control}
          name="name"
          label="Name"
        />

        <ControlledInput
          testID="email-input"
          control={control}
          name="email"
          label="Email"
        />
        <ControlledInput
          testID="password-input"
          control={control}
          name="password"
          label="Password"
          placeholder="***"
          secureTextEntry={true}
        />
        <Button
          testID="login-button"
          label={isLoading ? 'Signing you in...' : 'Login'}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          accessibilityLabel={isLoading ? 'Signing you in, please wait' : 'Sign in to your account'}
          accessibilityHint={isLoading ? 'Please wait while we sign you in' : 'Tap to sign in with your credentials'}
          variant="primary"
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
};
