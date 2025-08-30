import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { Text } from '@/components/ui';

import {
  AuthGuard,
  GuestGuard,
  useAuthStatus,
  withAuth,
  withGuest,
} from '../route-guards';

// Mock NetInfo to prevent network-related errors
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}));

// Mock the auth store with proper Zustand selector structure
const createMockAuthStore = () => {
  let mockStatus = 'idle';
  let mockToken = null;
  
  return {
    use: {
      status: () => mockStatus,
      token: () => mockToken,
    },
    setState: (status: string, token: any) => {
      mockStatus = status;
      mockToken = token;
    },
    getState: () => ({ status: mockStatus, token: mockToken }),
  };
};

const mockAuthStore = createMockAuthStore();

jest.mock('../index', () => ({
  useAuth: mockAuthStore,
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const MockText = require('@/components/ui').Text;
    return <MockText testID="redirect">{`Redirecting to ${href}`}</MockText>;
  },
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('Route Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthGuard', () => {
    it('shows loading when auth status is idle', () => {
      mockAuthStore.setState('idle', null);

      render(
        <AuthGuard>
          <Text>Protected content</Text>
        </AuthGuard>
      );

      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('redirects to login when user is signed out', () => {
      mockAuthStore.setState('signOut');
      (null);

      render(
        <AuthGuard>
          <Text>Protected content</Text>
        </AuthGuard>
      );

      expect(screen.getByText('Redirecting to /login')).toBeTruthy();
    });

    it('redirects to custom route when specified', () => {
      mockAuthStore.setState('signOut');
      (null);

      render(
        <AuthGuard fallbackRoute="/(auth)/register">
          <Text>Protected content</Text>
        </AuthGuard>
      );

      expect(screen.getByText('Redirecting to /(auth)/register')).toBeTruthy();
    });

    it('renders protected content when user is authenticated', () => {
      mockAuthStore.setState('signIn');
      ({
        access: 'token',
        refresh: 'refresh',
      });

      render(
        <AuthGuard>
          <Text>Protected content</Text>
        </AuthGuard>
      );

      expect(screen.getByText('Protected content')).toBeTruthy();
    });
  });

  describe('GuestGuard', () => {
    it('redirects to app when user is authenticated', () => {
      mockAuthStore.setState('signIn');
      ({
        access: 'token',
        refresh: 'refresh',
      });

      render(
        <GuestGuard>
          <Text>Guest content</Text>
        </GuestGuard>
      );

      expect(screen.getByText('Redirecting to /(app)')).toBeTruthy();
    });

    it('renders guest content when user is not authenticated', () => {
      mockAuthStore.setState('signOut');
      (null);

      render(
        <GuestGuard>
          <Text>Guest content</Text>
        </GuestGuard>
      );

      expect(screen.getByText('Guest content')).toBeTruthy();
    });
  });

  describe('Higher-Order Components', () => {
    it('withAuth protects component correctly', () => {
      mockAuthStore.setState('signIn');
      ({
        access: 'token',
        refresh: 'refresh',
      });

      const TestComponent = () => <Text>Protected component</Text>;
      const ProtectedComponent = withAuth(TestComponent);

      render(<ProtectedComponent />);

      expect(screen.getByText('Protected component')).toBeTruthy();
    });

    it('withGuest protects component for guests only', () => {
      mockAuthStore.setState('signOut');
      (null);

      const TestComponent = () => <Text>Guest component</Text>;
      const GuestComponent = withGuest(TestComponent);

      render(<GuestComponent />);

      expect(screen.getByText('Guest component')).toBeTruthy();
    });
  });

  describe('useAuthStatus', () => {
    it('returns correct authentication status', () => {
      mockAuthStore.setState('signIn');
      ({
        access: 'token',
        refresh: 'refresh',
      });

      let authStatus: any;
      const TestComponent = () => {
        authStatus = useAuthStatus();
        return <Text>Test</Text>;
      };

      render(<TestComponent />);

      expect(authStatus.isAuthenticated).toBe(true);
      expect(authStatus.isLoading).toBe(false);
      expect(authStatus.isGuest).toBe(false);
    });

    it('handles idle status correctly', () => {
      mockAuthStore.setState('idle');
      (null);

      let authStatus: any;
      const TestComponent = () => {
        authStatus = useAuthStatus();
        return <Text>Test</Text>;
      };

      render(<TestComponent />);

      expect(authStatus.isAuthenticated).toBe(false);
      expect(authStatus.isLoading).toBe(true);
      expect(authStatus.isGuest).toBe(false);
    });
  });
});
