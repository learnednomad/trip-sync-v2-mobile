import { create } from 'zustand';

import { createSelectors } from '../utils';
import type { TokenType } from './utils';
import { getToken, removeToken, setToken } from './utils';

interface AuthState {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: TokenType) => void;
  signOut: () => void;
  hydrate: () => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: (token) => {
    console.log('🔐 Auth store signIn called with:', {
      access: token?.access?.length
        ? `${token.access.substring(0, 20)}...`
        : 'MISSING',
      refresh: token?.refresh?.length
        ? `${token.refresh.substring(0, 20)}...`
        : 'MISSING',
    });

    setToken(token);
    set({ status: 'signIn', token });

    // Verify storage immediately after setting
    setTimeout(() => {
      const storedToken = getToken();
      console.log('💾 Token verification after storage:', {
        stored: !!storedToken,
        accessLength: storedToken?.access?.length || 0,
        refreshLength: storedToken?.refresh?.length || 0,
      });
    }, 100);
  },
  signOut: () => {
    removeToken();
    set({ status: 'signOut', token: null });
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      if (userToken !== null) {
        get().signIn(userToken);
      } else {
        get().signOut();
      }
    } catch (e) {
      // only to remove eslint error, handle the error properly
      console.error(e);
      // catch error here
      // Maybe sign_out user!
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (token: TokenType) => _useAuth.getState().signIn(token);
export const hydrateAuth = () => _useAuth.getState().hydrate();
