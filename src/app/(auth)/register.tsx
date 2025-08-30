import { Link } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { useRegister } from '@/api/auth';
import { Button, Checkbox, Input, Text } from '@/components/ui';
import { withGuest } from '@/lib/auth/route-guards';

function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const register = useRegister();

  const handleRegister = async () => {
    try {
      await register.mutateAsync({
        email,
        password,
        firstName: firstName.trim() || 'User',
        lastName: lastName.trim() || 'User',
        acceptTerms,
        ...(username.trim() && { username: username.trim() }),
      });
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6 dark:bg-neutral-900">
      <View className="mb-12">
        <Text className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">
          Create Account
        </Text>
        <Text className="text-neutral-600 dark:text-neutral-400">
          Join Trip Sync to start planning your adventures
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

        <Input
          placeholder="Username (optional)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
        />

        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Input
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="given-name"
              textContentType="givenName"
            />
          </View>
          <View className="flex-1">
            <Input
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoComplete="family-name"
              textContentType="familyName"
            />
          </View>
        </View>

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <View className="mt-2 flex-row items-start space-x-3">
          <Checkbox
            checked={acceptTerms}
            onChange={setAcceptTerms}
            accessibilityLabel="Accept terms and conditions"
            className="mt-1"
          />
          <Text className="flex-1 text-sm text-neutral-600 dark:text-neutral-400">
            I agree to the{' '}
            <Text className="text-blue-600 dark:text-blue-400">
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text className="text-blue-600 dark:text-blue-400">
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      <Button
        onPress={handleRegister}
        disabled={
          !email ||
          !password ||
          !firstName ||
          !lastName ||
          !acceptTerms ||
          register.isPending
        }
        loading={register.isPending}
        className="mb-4"
      >
        Create Account
      </Button>

      <View className="flex-row justify-center">
        <Text className="text-neutral-600 dark:text-neutral-400">
          Already have an account?{' '}
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

export default withGuest(RegisterScreen);
