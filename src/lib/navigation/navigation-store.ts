import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  route?: string;
}

interface NavigationState {
  // Navigation history and breadcrumbs
  navigationHistory: string[];
  breadcrumbs: Breadcrumb[];

  // Global UI state
  activeModal: string | null;
  searchQuery: string;
  isSearchFocused: boolean;

  // Loading states
  globalLoading: boolean;
  loadingMessage?: string;

  // Notification state
  notifications: Notification[];
  unreadCount: number;

  // Theme and preferences
  sidebarOpen: boolean;

  // Actions
  pushRoute: (route: string) => void;
  popRoute: () => string | undefined;
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
  addBreadcrumb: (crumb: Breadcrumb) => void;

  // Modal management
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Search state
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;
  clearSearch: () => void;

  // Loading state
  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  markAllRead: () => void;

  // UI controls
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

const _useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      navigationHistory: [],
      breadcrumbs: [{ label: 'Home', route: '/(app)' }],

      activeModal: null,
      searchQuery: '',
      isSearchFocused: false,

      globalLoading: false,
      loadingMessage: undefined,

      notifications: [],
      unreadCount: 0,

      sidebarOpen: false,

      // Navigation actions
      pushRoute: (route: string) => {
        set((state) => ({
          navigationHistory: [...state.navigationHistory.slice(-9), route], // Keep last 10
        }));
      },

      popRoute: () => {
        const { navigationHistory } = get();
        if (navigationHistory.length === 0) return undefined;

        const lastRoute = navigationHistory[navigationHistory.length - 1];
        set((state) => ({
          navigationHistory: state.navigationHistory.slice(0, -1),
        }));

        return lastRoute;
      },

      setBreadcrumbs: (crumbs: Breadcrumb[]) => {
        set({ breadcrumbs: crumbs });
      },

      addBreadcrumb: (crumb: Breadcrumb) => {
        set((state) => ({
          breadcrumbs: [...state.breadcrumbs, crumb],
        }));
      },

      // Modal management
      openModal: (modalId: string) => {
        set({ activeModal: modalId });
      },

      closeModal: () => {
        set({ activeModal: null });
      },

      // Search state
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setSearchFocused: (focused: boolean) => {
        set({ isSearchFocused: focused });
      },

      clearSearch: () => {
        set({ searchQuery: '', isSearchFocused: false });
      },

      // Loading state
      showGlobalLoading: (message?: string) => {
        set({ globalLoading: true, loadingMessage: message });
      },

      hideGlobalLoading: () => {
        set({ globalLoading: false, loadingMessage: undefined });
      },

      // Notifications
      addNotification: (notification: Omit<Notification, 'id'>) => {
        const id = Date.now().toString();
        const newNotification: Notification = {
          ...notification,
          id,
          read: false,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications.slice(0, 49)], // Keep last 50
          unreadCount: state.unreadCount + 1,
        }));
      },

      removeNotification: (id: string) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount:
              notification && !notification.read
                ? state.unreadCount - 1
                : state.unreadCount,
          };
        });
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      // UI controls
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: '@trip-sync/navigation',
      storage: {
        getItem: (name) => {
          const value = storage.getString(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          storage.set(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          storage.delete(name);
        },
      },
      // Only persist certain values
      partialize: (state) => ({
        navigationHistory: state.navigationHistory.slice(-5), // Only keep last 5 routes
        searchQuery: state.searchQuery,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Create selectors for optimized access
export const useNavigationStore = createSelectors(_useNavigationStore);

// Exported actions for easy access
export const navigationActions = {
  pushRoute: () => _useNavigationStore.getState().pushRoute,
  popRoute: () => _useNavigationStore.getState().popRoute,
  setBreadcrumbs: () => _useNavigationStore.getState().setBreadcrumbs,
  openModal: () => _useNavigationStore.getState().openModal,
  closeModal: () => _useNavigationStore.getState().closeModal,
  setSearchQuery: () => _useNavigationStore.getState().setSearchQuery,
  clearSearch: () => _useNavigationStore.getState().clearSearch,
  showGlobalLoading: () => _useNavigationStore.getState().showGlobalLoading,
  hideGlobalLoading: () => _useNavigationStore.getState().hideGlobalLoading,
  addNotification: () => _useNavigationStore.getState().addNotification,
};

// Type exports
export type { Breadcrumb, NavigationState, Notification };
