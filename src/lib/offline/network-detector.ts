/**
 * Network Detection and Management
 * Comprehensive network awareness for offline-first architecture
 */

import React from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'wimax' | 'vpn' | 'other' | 'unknown' | 'none';
  isExpensive: boolean; // True for cellular/limited data plans
  bandwidth: 'high' | 'medium' | 'low' | 'unknown';
  latency: number; // milliseconds
  lastConnectedAt: string;
  wasEverConnected: boolean;
}

interface NetworkState {
  current: NetworkStatus;
  history: NetworkEvent[];
  preferences: NetworkPreferences;
  
  // Actions
  updateStatus: (status: NetworkStatus) => void;
  addEvent: (event: NetworkEvent) => void;
  updatePreferences: (prefs: Partial<NetworkPreferences>) => void;
  clearHistory: () => void;
}

interface NetworkEvent {
  timestamp: string;
  type: 'connected' | 'disconnected' | 'type_changed';
  fromState?: string;
  toState?: string;
  duration?: number;
}

interface NetworkPreferences {
  allowCellularSync: boolean;
  allowBackgroundSync: boolean;
  maxCellularUsageMB: number;
  wifiOnlyFeatures: string[]; // Features that require WiFi
  lowBandwidthMode: boolean;
}

const _useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      current: {
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'unknown',
        isExpensive: false,
        bandwidth: 'unknown',
        latency: 0,
        lastConnectedAt: new Date().toISOString(),
        wasEverConnected: false,
      },
      
      history: [],
      
      preferences: {
        allowCellularSync: false, // Conservative default
        allowBackgroundSync: true,
        maxCellularUsageMB: 50,
        wifiOnlyFeatures: ['image_upload', 'backup_sync', 'bulk_operations'],
        lowBandwidthMode: false,
      },
      
      updateStatus: (status: NetworkStatus) => {
        const previousState = get().current;
        
        // Add event if connection state changed
        if (status.isConnected !== previousState.isConnected) {
          const event: NetworkEvent = {
            timestamp: new Date().toISOString(),
            type: status.isConnected ? 'connected' : 'disconnected',
            fromState: previousState.connectionType,
            toState: status.connectionType,
          };
          
          get().addEvent(event);
        }
        
        set({ current: status });
      },
      
      addEvent: (event: NetworkEvent) => {
        set((state) => ({
          history: [event, ...state.history.slice(0, 49)], // Keep last 50 events
        }));
      },
      
      updatePreferences: (prefs: Partial<NetworkPreferences>) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
      },
      
      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: '@trip-sync/network',
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
      partialize: (state) => ({
        preferences: state.preferences,
        history: state.history.slice(0, 10), // Keep last 10 events
      }),
    }
  )
);

export const useNetworkStore = createSelectors(_useNetworkStore);

/**
 * Network detection service
 */
export class NetworkDetector {
  private static instance: NetworkDetector;
  private subscription: NetInfoSubscription | null = null;
  
  static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  async initialize(): Promise<void> {
    // Get initial network state
    const initialState = await NetInfo.fetch();
    this.updateNetworkStatus(initialState);
    
    // Subscribe to network changes
    this.subscription = NetInfo.addEventListener((state) => {
      this.updateNetworkStatus(state);
    });
    
    console.log('🌐 Network detector initialized');
  }

  private updateNetworkStatus(state: NetInfoState): void {
    const bandwidth = this.estimateBandwidth(state);
    
    const networkStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      connectionType: this.mapConnectionType(state.type),
      isExpensive: this.isExpensiveConnection(state),
      bandwidth,
      latency: this.estimateLatency(state),
      lastConnectedAt: state.isConnected 
        ? new Date().toISOString()
        : useNetworkStore.getState().current.lastConnectedAt,
      wasEverConnected: state.isConnected || useNetworkStore.getState().current.wasEverConnected,
    };
    
    useNetworkStore.getState().updateStatus(networkStatus);
  }

  private mapConnectionType(type: string): NetworkStatus['connectionType'] {
    switch (type) {
      case 'wifi': return 'wifi';
      case 'cellular': return 'cellular';
      case 'ethernet': return 'ethernet';
      case 'bluetooth': return 'bluetooth';
      case 'wimax': return 'wimax';
      case 'vpn': return 'vpn';
      case 'other': return 'other';
      case 'none': return 'none';
      default: return 'unknown';
    }
  }

  private isExpensiveConnection(state: NetInfoState): boolean {
    // Cellular connections are typically expensive/metered
    if (state.type === 'cellular') return true;
    
    // Check if connection has usage limits
    if (state.details && 'isConnectionExpensive' in state.details) {
      return state.details.isConnectionExpensive ?? false;
    }
    
    return false;
  }

  private estimateBandwidth(state: NetInfoState): NetworkStatus['bandwidth'] {
    if (!state.isConnected) return 'unknown';
    
    // Use NetInfo details if available
    if (state.details) {
      // WiFi bandwidth estimation
      if (state.type === 'wifi' && 'frequency' in state.details) {
        const frequency = state.details.frequency;
        if (frequency && frequency >= 5000) return 'high'; // 5GHz WiFi
        return 'medium'; // 2.4GHz WiFi
      }
      
      // Cellular bandwidth estimation
      if (state.type === 'cellular' && 'cellularGeneration' in state.details) {
        const generation = state.details.cellularGeneration;
        if (generation === '5g') return 'high';
        if (generation === '4g') return 'medium';
        return 'low'; // 3G or lower
      }
    }
    
    // Default estimation based on connection type
    switch (state.type) {
      case 'wifi':
      case 'ethernet':
        return 'high';
      case 'cellular':
        return 'medium';
      case 'bluetooth':
      case 'other':
        return 'low';
      default:
        return 'unknown';
    }
  }

  private estimateLatency(state: NetInfoState): number {
    if (!state.isConnected) return 0;
    
    // Rough latency estimates based on connection type
    switch (state.type) {
      case 'wifi':
      case 'ethernet':
        return 20; // Low latency
      case 'cellular':
        return 100; // Higher latency
      case 'bluetooth':
        return 200; // High latency
      default:
        return 50; // Default estimate
    }
  }

  async testConnectivity(): Promise<{
    reachable: boolean;
    latency: number;
    error?: string;
  }> {
    const testStartTime = Date.now();
    
    try {
      // Test actual internet connectivity with a lightweight request
      const response = await fetch('https://api.github.com/zen', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      const latency = Date.now() - testStartTime;
      
      return {
        reachable: response.ok,
        latency,
      };
    } catch (error: any) {
      return {
        reachable: false,
        latency: Date.now() - testStartTime,
        error: error.message,
      };
    }
  }

  dispose(): void {
    this.subscription?.();
    this.subscription = null;
  }
}

// Singleton instance
export const networkDetector = NetworkDetector.getInstance();

// React hooks for network management
export const useNetworkStatus = () => {
  const current = useNetworkStore.use.current();
  const history = useNetworkStore.use.history();
  const preferences = useNetworkStore.use.preferences();
  
  return {
    ...current,
    history,
    preferences,
    isOnline: current.isConnected && current.isInternetReachable,
    canSync: current.isConnected && (
      current.connectionType === 'wifi' || preferences.allowCellularSync
    ),
  };
};

export const useNetworkPreferences = () => {
  const preferences = useNetworkStore.use.preferences();
  const updatePreferences = useNetworkStore.use.updatePreferences();
  
  return {
    preferences,
    updatePreferences,
    
    // Convenience methods
    enableCellularSync: () => updatePreferences({ allowCellularSync: true }),
    disableCellularSync: () => updatePreferences({ allowCellularSync: false }),
    setMaxCellularUsage: (mb: number) => updatePreferences({ maxCellularUsageMB: mb }),
    toggleLowBandwidthMode: () => updatePreferences({ 
      lowBandwidthMode: !preferences.lowBandwidthMode 
    }),
  };
};

// Hook for network-dependent operations
export const useNetworkAwareOperation = () => {
  const networkStatus = useNetworkStatus();
  
  const executeWhenOnline = async <T>(
    operation: () => Promise<T>,
    options: {
      requireWifi?: boolean;
      offlineMessage?: string;
      retryOnReconnect?: boolean;
    } = {}
  ): Promise<T> => {
    const { requireWifi = false, offlineMessage, retryOnReconnect = true } = options;
    
    if (!networkStatus.isOnline) {
      const message = offlineMessage || 'This action requires an internet connection';
      throw new Error(message);
    }
    
    if (requireWifi && networkStatus.connectionType !== 'wifi') {
      throw new Error('This action requires a WiFi connection');
    }
    
    return operation();
  };
  
  return {
    isOnline: networkStatus.isOnline,
    canSync: networkStatus.canSync,
    connectionType: networkStatus.connectionType,
    bandwidth: networkStatus.bandwidth,
    executeWhenOnline,
  };
};

// Initialize network detection on module load
networkDetector.initialize().catch(console.error);