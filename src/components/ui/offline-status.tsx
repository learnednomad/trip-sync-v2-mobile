/**
 * Offline Status UI Components
 * Shows sync status, network connectivity, and offline indicators
 */

import { MotiView } from 'moti';
import React from 'react';
import { View, Pressable } from 'react-native';

import { 
  Badge, 
  Button, 
  Text, 
  ActivityIndicator,
  Modal,
  Card
} from '@/components/ui';
import {
  Globe as WifiIcon,
  XCircle as WifiOffIcon,
  Settings as CloudIcon,
  X as CloudOffIcon,
  RotateCcw as SyncIcon,
  AlertTriangle as WarningIcon,
  CheckCircle as SuccessIcon,
  Clock as PendingIcon,
} from '@/components/ui/icons';
import { useNetworkStatus } from '@/lib/offline/network-detector';
import { useSyncEngine, useAutoSync } from '@/lib/offline/sync-engine';

/**
 * Compact sync status indicator for navigation bar
 */
export const SyncStatusIndicator: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const networkStatus = useNetworkStatus();
  const { isRunning, conflicts, lastSyncTime } = useSyncEngine();
  const { hasPendingOperations } = useAutoSync();

  // Determine status and color
  let status: 'online' | 'offline' | 'syncing' | 'conflicts' | 'pending';
  let color: string;
  let icon: React.ReactNode;

  if (!networkStatus.isOnline) {
    status = 'offline';
    color = '#f59e0b'; // warning yellow
    icon = <WifiOffIcon color={color} width={16} height={16} />;
  } else if (isRunning) {
    status = 'syncing';
    color = '#0ea5e9'; // primary blue
    icon = <SyncIcon color={color} width={16} height={16} />;
  } else if (conflicts.length > 0) {
    status = 'conflicts';
    color = '#ef4444'; // error red
    icon = <WarningIcon color={color} width={16} height={16} />;
  } else if (hasPendingOperations) {
    status = 'pending';
    color = '#f59e0b'; // warning yellow
    icon = <PendingIcon color={color} width={16} height={16} />;
  } else {
    status = 'online';
    color = '#22c55e'; // success green
    icon = <SuccessIcon color={color} width={16} height={16} />;
  }

  const statusLabels = {
    online: 'Synced',
    offline: 'Offline',
    syncing: 'Syncing...',
    conflicts: 'Conflicts',
    pending: 'Pending',
  };

  return (
    <View className={`flex-row items-center ${className}`}>
      {icon}
      <Text className="ml-2 text-xs font-medium" style={{ color }}>
        {statusLabels[status]}
      </Text>
    </View>
  );
};

/**
 * Detailed offline banner for screens
 */
export const OfflineBanner: React.FC = () => {
  const networkStatus = useNetworkStatus();
  const { hasPendingOperations, triggerSync } = useAutoSync();
  const { isRunning, syncProgress } = useSyncEngine();

  if (networkStatus.isOnline && !hasPendingOperations) return null;

  return (
    <MotiView
      from={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-warning-50 dark:bg-warning-900 border-b border-warning-200 dark:border-warning-700"
    >
      <View className="px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {!networkStatus.isOnline ? (
            <>
              <WifiOffIcon color="#f59e0b" width={20} height={20} />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-warning-800 dark:text-warning-200">
                  You're offline
                </Text>
                <Text className="text-xs text-warning-700 dark:text-warning-300">
                  Changes will sync when you're back online
                </Text>
              </View>
            </>
          ) : isRunning ? (
            <>
              <ActivityIndicator size="small" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-warning-800 dark:text-warning-200">
                  Syncing changes... {syncProgress}%
                </Text>
                <View className="mt-1 h-1 bg-warning-200 dark:bg-warning-700 rounded-full">
                  <View 
                    className="h-1 bg-warning-500 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <CloudIcon color="#f59e0b" width={20} height={20} />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-warning-800 dark:text-warning-200">
                  Pending changes
                </Text>
                <Text className="text-xs text-warning-700 dark:text-warning-300">
                  Tap to sync now
                </Text>
              </View>
            </>
          )}
        </View>

        {networkStatus.isOnline && !isRunning && (
          <Button
            variant="outline"
            size="sm"
            onPress={triggerSync}
            className="border-warning-400 bg-warning-100 dark:bg-warning-800"
          >
            <Text className="text-warning-700 dark:text-warning-300 text-xs font-medium">
              Sync Now
            </Text>
          </Button>
        )}
      </View>
    </MotiView>
  );
};

/**
 * Sync progress modal for detailed view
 */
export const SyncProgressModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { 
    isRunning, 
    currentOperation, 
    completedOperations, 
    failedOperations, 
    syncProgress,
    conflicts 
  } = useSyncEngine();

  return (
    <Modal visible={visible} onClose={onClose} size="md">
      <View className="p-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
            Sync Progress
          </Text>
          <Button variant="ghost" size="sm" onPress={onClose}>
            ✕
          </Button>
        </View>

        {isRunning ? (
          <View className="space-y-4">
            {/* Progress bar */}
            <View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                  Syncing data...
                </Text>
                <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                  {syncProgress}%
                </Text>
              </View>
              <View className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                <View 
                  className="h-2 bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </View>
            </View>

            {/* Current operation */}
            {currentOperation && (
              <Card variant="outlined">
                <Card.Body>
                  <Text className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    {currentOperation.type} {currentOperation.resourceType}
                  </Text>
                  <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                    ID: {currentOperation.resourceId}
                  </Text>
                </Card.Body>
              </Card>
            )}

            {/* Statistics */}
            <View className="flex-row space-x-4">
              <View className="items-center">
                <Text className="text-lg font-bold text-success-600 dark:text-success-400">
                  {completedOperations}
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  Completed
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-error-600 dark:text-error-400">
                  {failedOperations}
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  Failed
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-warning-600 dark:text-warning-400">
                  {conflicts.length}
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  Conflicts
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="items-center py-8">
            <SuccessIcon color="#22c55e" width={48} height={48} />
            <Text className="text-base font-medium text-neutral-900 dark:text-white mt-4 mb-2">
              Sync Complete
            </Text>
            <Text className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              All changes have been synchronized successfully
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

/**
 * Offline mode toggle component
 */
export const OfflineModeToggle: React.FC = () => {
  const networkStatus = useNetworkStatus();
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);

  const toggleOfflineMode = () => {
    if (isOfflineMode) {
      // Enable online mode
      setIsOfflineMode(false);
      // This would trigger sync when available
    } else {
      // Enable offline mode
      setIsOfflineMode(true);
      // This would pause sync operations
    }
  };

  return (
    <Pressable
      onPress={toggleOfflineMode}
      className="flex-row items-center p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
    >
      <View className="mr-3">
        {isOfflineMode ? (
          <CloudOffIcon color="#ef4444" width={24} height={24} />
        ) : (
          <CloudIcon color="#22c55e" width={24} height={24} />
        )}
      </View>
      
      <View className="flex-1">
        <Text className="text-base font-medium text-neutral-900 dark:text-white">
          {isOfflineMode ? 'Offline Mode' : 'Online Mode'}
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          {isOfflineMode 
            ? 'Working offline - changes will sync later'
            : networkStatus.isOnline 
              ? 'Connected and syncing'
              : 'No connection - working offline'
          }
        </Text>
      </View>
      
      <View className="ml-3">
        <Badge 
          variant={isOfflineMode ? 'warning' : 'success'} 
          size="sm"
        >
          {isOfflineMode ? 'Offline' : 'Online'}
        </Badge>
      </View>
    </Pressable>
  );
};

/**
 * Trip-specific sync status badge
 */
export const TripSyncStatus: React.FC<{ tripId: string; className?: string }> = ({
  tripId,
  className = '',
}) => {
  // This would use the offline storage to get trip sync status
  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'pending' | 'conflict' | 'error'>('synced');

  React.useEffect(() => {
    // Get trip sync status from offline storage
    // const trip = offlineStorage.getTrip(tripId);
    // setSyncStatus(trip?._metadata.syncStatus || 'synced');
  }, [tripId]);

  if (syncStatus === 'synced') return null;

  const statusConfig = {
    pending: { color: '#f59e0b', label: 'Pending sync', icon: '⏳' },
    conflict: { color: '#ef4444', label: 'Needs attention', icon: '⚠️' },
    error: { color: '#ef4444', label: 'Sync failed', icon: '❌' },
  };

  const config = statusConfig[syncStatus];

  return (
    <View className={`flex-row items-center ${className}`}>
      <Text className="mr-1">{config.icon}</Text>
      <Text className="text-xs font-medium" style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
};

/**
 * Conflict resolution UI component
 */
export const ConflictResolutionCard: React.FC<{
  conflict: any; // Would use proper Conflict type
  onResolve: (strategy: 'local' | 'remote' | 'merge') => void;
  onDismiss: () => void;
}> = ({ conflict, onResolve, onDismiss }) => {
  return (
    <Card variant="warning" className="mb-3">
      <Card.Header>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <WarningIcon color="#f59e0b" width={20} height={20} />
            <Text className="ml-2 font-semibold text-warning-800 dark:text-warning-200">
              Sync Conflict
            </Text>
          </View>
          <Button variant="ghost" size="sm" onPress={onDismiss}>
            ✕
          </Button>
        </View>
      </Card.Header>
      
      <Card.Body>
        <Text className="text-sm text-warning-700 dark:text-warning-300 mb-3">
          This trip was modified on another device. Choose how to resolve:
        </Text>
        
        <View className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => onResolve('local')}
            className="border-warning-400"
          >
            <Text className="text-warning-700 dark:text-warning-300">
              Keep My Changes
            </Text>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onPress={() => onResolve('remote')}
            className="border-warning-400"
          >
            <Text className="text-warning-700 dark:text-warning-300">
              Use Server Version
            </Text>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onPress={() => onResolve('merge')}
            className="border-warning-400"
          >
            <Text className="text-warning-700 dark:text-warning-300">
              Merge Both
            </Text>
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
};

/**
 * Storage usage indicator
 */
export const StorageUsageIndicator: React.FC = () => {
  const [storageStats, setStorageStats] = React.useState<{
    quotaUsage: number;
    totalTrips: number;
    totalSize: number;
  } | null>(null);

  React.useEffect(() => {
    // Load storage stats
    // const loadStats = async () => {
    //   const stats = await offlineStorage.getStorageStats();
    //   setStorageStats(stats);
    // };
    // loadStats();
  }, []);

  if (!storageStats || storageStats.quotaUsage < 80) return null;

  return (
    <Card variant="warning" className="m-4">
      <Card.Body>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-1">
              Storage Almost Full
            </Text>
            <Text className="text-xs text-warning-700 dark:text-warning-300">
              {Math.round(storageStats.quotaUsage)}% used • {storageStats.totalTrips} trips
            </Text>
          </View>
          
          <Button variant="outline" size="sm" className="border-warning-400">
            <Text className="text-warning-700 dark:text-warning-300 text-xs">
              Manage
            </Text>
          </Button>
        </View>
        
        <View className="mt-3 h-2 bg-warning-200 dark:bg-warning-700 rounded-full">
          <View 
            className="h-2 bg-warning-500 rounded-full"
            style={{ width: `${storageStats.quotaUsage}%` }}
          />
        </View>
      </Card.Body>
    </Card>
  );
};

/**
 * Network quality indicator
 */
export const NetworkQualityBadge: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const networkStatus = useNetworkStatus();

  if (!networkStatus.isOnline) return null;

  const qualityConfig = {
    high: { color: '#22c55e', label: 'Excellent', icon: '🟢' },
    medium: { color: '#f59e0b', label: 'Good', icon: '🟡' },
    low: { color: '#ef4444', label: 'Poor', icon: '🔴' },
    unknown: { color: '#737373', label: 'Unknown', icon: '⚪' },
  };

  const config = qualityConfig[networkStatus.bandwidth];

  return (
    <View className={`flex-row items-center ${className}`}>
      <Text className="mr-1">{config.icon}</Text>
      <Text className="text-xs text-neutral-600 dark:text-neutral-400">
        {config.label}
      </Text>
    </View>
  );
};

/**
 * Optimistic update feedback component
 */
export const OptimisticUpdateFeedback: React.FC<{
  isOptimistic: boolean;
  onRetry?: () => void;
  onCancel?: () => void;
}> = ({ isOptimistic, onRetry, onCancel }) => {
  if (!isOptimistic) return null;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-2 right-2 bg-warning-100 dark:bg-warning-900 rounded-lg p-2 border border-warning-300 dark:border-warning-600"
    >
      <View className="flex-row items-center">
        <PendingIcon color="#f59e0b" width={14} height={14} />
        <Text className="ml-2 text-xs text-warning-700 dark:text-warning-300">
          Saving...
        </Text>
        
        {onCancel && (
          <Button variant="ghost" size="sm" onPress={onCancel} className="ml-2 p-1">
            <Text className="text-xs text-warning-600 dark:text-warning-400">
              Cancel
            </Text>
          </Button>
        )}
      </View>
    </MotiView>
  );
};

/**
 * Hook for managing offline UI state
 */
export const useOfflineUI = () => {
  const networkStatus = useNetworkStatus();
  const syncEngine = useSyncEngine();
  const autoSync = useAutoSync();

  return {
    // Status flags
    isOnline: networkStatus.isOnline,
    isOffline: !networkStatus.isOnline,
    isSyncing: syncEngine.isRunning,
    hasPendingChanges: autoSync.hasPendingOperations,
    hasConflicts: syncEngine.hasConflicts,
    
    // Network info
    connectionType: networkStatus.connectionType,
    bandwidth: networkStatus.bandwidth,
    canSync: networkStatus.canSync,
    
    // Actions
    triggerSync: autoSync.triggerSync,
    abortSync: syncEngine.abortSync,
    
    // UI state helpers
    shouldShowOfflineBanner: !networkStatus.isOnline || autoSync.hasPendingOperations,
    shouldShowSyncProgress: syncEngine.isRunning,
    shouldShowConflictAlert: syncEngine.hasConflicts,
  };
};