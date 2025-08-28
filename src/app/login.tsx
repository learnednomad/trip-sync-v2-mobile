import React from 'react';

import type { LoginFormProps } from '@/components/login-form';
import { LoginForm } from '@/components/login-form';
import { FocusAwareStatusBar } from '@/components/ui';
import { useLogin } from '@/api/auth';
import { LoginDebugHelper } from '@/lib/auth/login-debug';
import { BackendTokenTest } from '@/lib/auth/backend-token-test';
import { BackendFixTest } from '@/lib/auth/backend-fix-test';
import { TokenDebugger } from '@/lib/auth/token-debugger';

export default function Login() {
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
    <>
      <FocusAwareStatusBar />
      
      {/* TEMPORARY DEBUG HELPERS - Remove after fixing */}
      {/* <LoginDebugHelper /> */}
      {/* <BackendTokenTest /> */}
      {/* <BackendFixTest /> */}
      <TokenDebugger />
      
      <LoginForm 
        onSubmit={onSubmit}
        isLoading={loginMutation.isPending}
        error={loginMutation.error}
      />
    </>
  );
}
