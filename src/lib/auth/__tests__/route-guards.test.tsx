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

// Mock the auth store
const mockStatus = jest.fn();
const mockToken = jest.fn();

const mockUseAuth = {
  use: {
    status: () => mockStatus(),
    token: () => mockToken(),
  },
};

jest.mock('../index', () => ({
  useAuth: mockUseAuth,
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
      mockStatus.mockReturnValue('idle');
      mockToken.mockReturnValue(null);

      render(
        <AuthGuard>
          <Text>Protected content</Text>
        </AuthGuard>
      );

      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('redirects to login when user is signed out', () => {
      mockUseAuth.use.status.mockReturnValue('signOut');
      mockUseAuth.use.token.mockReturnValue(null);

      render(
        <AuthGuard>
          <Text>Protected content</Text>
        </AuthGuard>
      );

      expect(screen.getByText('Redirecting to /login')).toBeTruthy();
    });

    it('redirects to custom route when specified', () => {
      mockUseAuth.use.status.mockReturnValue('signOut');
      mockUseAuth.use.token.mockReturnValue(null);

      render(
        <AuthGuard fallbackRoute="/(auth)/register">
          <Text>Protected content</Text>
        </AuthGuard>
      );

      expect(screen.getByText('Redirecting to /(auth)/register')).toBeTruthy();
    });

    it('renders protected content when user is authenticated', () => {
      mockUseAuth.use.status.mockReturnValue('signIn');
      mockUseAuth.use.token.mockReturnValue({
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
      mockUseAuth.use.status.mockReturnValue('signIn');
      mockUseAuth.use.token.mockReturnValue({
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
      mockUseAuth.use.status.mockReturnValue('signOut');
      mockUseAuth.use.token.mockReturnValue(null);

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
      mockUseAuth.use.status.mockReturnValue('signIn');
      mockUseAuth.use.token.mockReturnValue({
        access: 'token',
        refresh: 'refresh',
      });

      const TestComponent = () => <Text>Protected component</Text>;
      const ProtectedComponent = withAuth(TestComponent);

      render(<ProtectedComponent />);

      expect(screen.getByText('Protected component')).toBeTruthy();
    });

    it('withGuest protects component for guests only', () => {
      mockUseAuth.use.status.mockReturnValue('signOut');
      mockUseAuth.use.token.mockReturnValue(null);

      const TestComponent = () => <Text>Guest component</Text>;
      const GuestComponent = withGuest(TestComponent);

      render(<GuestComponent />);

      expect(screen.getByText('Guest component')).toBeTruthy();
    });
  });

  describe('useAuthStatus', () => {
    it('returns correct authentication status', () => {
      mockUseAuth.use.status.mockReturnValue('signIn');
      mockUseAuth.use.token.mockReturnValue({
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
      mockUseAuth.use.status.mockReturnValue('idle');
      mockUseAuth.use.token.mockReturnValue(null);

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
