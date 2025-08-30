# Offline-First Architecture

Comprehensive offline functionality for Trip Sync mobile app with intelligent sync and conflict resolution.

## Overview

The offline system provides:
- **Complete offline functionality** for core trip operations
- **Intelligent sync** with automatic conflict resolution
- **Network-aware operations** with graceful degradation
- **Storage management** with quota controls and cleanup
- **Comprehensive testing** framework for offline scenarios

## Core Components

### 1. Offline Storage (`offline-storage.ts`)
- MMKV-based storage with metadata tracking
- Trip caching with sync status and version control
- Storage quota management and cleanup
- Health monitoring and statistics

### 2. Sync Engine (`sync-engine.ts`)
- Bidirectional sync orchestration
- Conflict detection and resolution
- Network-aware sync scheduling
- Progress tracking and error handling

### 3. Conflict Resolver (`conflict-resolver.ts`)
- Automatic conflict detection using version numbers
- Intelligent auto-resolution for non-critical fields
- Manual resolution UI for complex conflicts
- Merge strategies for different conflict types

### 4. Network Detection (`network-detector.ts`)
- Real-time connectivity monitoring
- Bandwidth and latency estimation
- Cellular/WiFi awareness for sync preferences
- Network quality indicators

### 5. Offline Authentication (`offline-auth.ts`)
- JWT token validation without network
- Offline user capability management
- Authentication state persistence
- Token expiry handling

## Usage Examples

### Basic Offline Operations

```typescript
import { offlineStorage } from '@/lib/offline/offline-storage';
import { useOfflineUI } from '@/components/ui/offline-status';

// Store trip for offline access
await offlineStorage.storeTrip(trip, {
  localModified: true,
  syncStatus: 'pending',
});

// Check offline status in components
const { isOffline, hasPendingChanges, triggerSync } = useOfflineUI();

if (isOffline) {
  // Show offline functionality
} else if (hasPendingChanges) {
  // Show sync pending state
}
```

### Sync Management

```typescript
import { useSyncEngine, useAutoSync } from '@/lib/offline/sync-engine';

// Auto-sync with preferences
const autoSync = useAutoSync({
  autoSync: true,
  syncInterval: 30, // seconds
  maxRetries: 3,
});

// Manual sync control
const { startSync, abortSync, isRunning } = useSyncEngine();

// Trigger immediate sync
await startSync({ force: true });

// Upload-only sync
await startSync({ direction: 'upload' });
```

### Conflict Resolution

```typescript
import { useConflictResolution } from '@/lib/offline/sync-engine';

const { conflicts, resolveConflict } = useConflictResolution();

// Resolve individual conflict
await resolveConflict(conflictId, 'merge');

// Resolve all conflicts with server version
conflicts.forEach(conflict => {
  resolveConflict(conflict.id, 'remote');
});
```

### Network-Aware Operations

```typescript
import { useNetworkAwareOperation } from '@/lib/offline/network-detector';

const { executeWhenOnline, isOnline, canSync } = useNetworkAwareOperation();

// Execute only when online
try {
  await executeWhenOnline(
    () => uploadLargeFile(),
    { requireWifi: true }
  );
} catch (error) {
  // Handle offline scenario
}
```

## Testing

### Test Utilities

```typescript
import { OfflineTestFixture } from '@/lib/offline/__tests__/offline-test-utils';

describe('Offline Feature', () => {
  beforeEach(() => {
    OfflineTestFixture.setupOfflineTest();
  });

  afterEach(() => {
    OfflineTestFixture.teardownOfflineTest();
  });

  it('should work offline', async () => {
    // Simulate offline
    OfflineTestFixture.NetworkMock.simulateOffline();
    
    // Test offline functionality
    // ...
    
    // Assert offline behavior
    OfflineTestFixture.OfflineTestAssertions.assertTripPending(tripId);
  });
});
```

### Common Test Scenarios

1. **Offline Creation**: Create trip while offline → go online → verify sync
2. **Conflict Resolution**: Edit same trip on 2 devices → resolve conflicts  
3. **Storage Cleanup**: Fill storage quota → verify cleanup
4. **Network Interruption**: Start sync → lose network → resume
5. **Auth Token Expiry**: Offline for days → token refresh on reconnect

## Performance Considerations

### Storage Performance
- **Target**: <50ms for local data access
- **Quota**: 500MB default limit with intelligent cleanup
- **Compression**: Large objects compressed automatically
- **Indexing**: Priority-based access patterns

### Sync Performance  
- **Batch Size**: 5 operations per batch
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s)
- **Network Usage**: Cellular-aware with bandwidth controls
- **Background Sync**: Platform-specific background processing

### Memory Management
- **Cache Size**: Limited to essential data only
- **Cleanup**: Automatic cleanup at 80% quota usage
- **Persistence**: Selective persistence of navigation state
- **Hydration**: Fast startup with incremental loading

## Best Practices

### 1. Always Design Offline-First
```typescript
// ✅ Good: Offline-first approach
const data = useOfflineTrip(tripId); // Works offline
if (networkStatus.isOnline) {
  syncDataInBackground(); // Enhance when online
}

// ❌ Bad: Online-only approach
const data = await fetchFromAPI(tripId); // Fails offline
```

### 2. Handle Conflicts Gracefully
```typescript
// ✅ Good: Automatic resolution with fallback
const resolution = await autoResolveConflict(conflict);
if (!resolution) {
  showConflictResolutionUI(conflict);
}

// ❌ Bad: Always require manual resolution
showConflictResolutionUI(conflict);
```

### 3. Provide Clear User Feedback
```typescript
// ✅ Good: Clear offline indicators
<OfflineBanner />
<SyncStatusIndicator />
<TripSyncStatus tripId={tripId} />

// ❌ Bad: Silent failures
// No indication of offline state or sync status
```

### 4. Optimize for Mobile Networks
```typescript
// ✅ Good: Network-aware sync
if (networkStatus.connectionType === 'wifi') {
  syncAllData();
} else if (networkStatus.connectionType === 'cellular' && allowCellularSync) {
  syncCriticalDataOnly();
}

// ❌ Bad: Ignoring network conditions
syncAllData(); // Uses cellular data unnecessarily
```

## Troubleshooting

### Common Issues

1. **Sync Not Working**
   - Check network connectivity with `useNetworkStatus()`
   - Verify auth tokens with `offlineAuthManager.validateOfflineTokens()`
   - Check sync queue with `offlineStorage.getSyncQueue()`

2. **Storage Quota Exceeded**
   - Run `offlineStorage.performCleanup()`
   - Check storage stats with `offlineStorage.getStorageStats()`
   - Adjust quota settings with `offlineStorage.updateSettings()`

3. **Conflicts Not Resolving**
   - Check conflict details with `useSyncEngine().conflicts`
   - Verify auto-resolution rules in `conflict-resolver.ts`
   - Use manual resolution with `useConflictResolution()`

### Debug Tools

```typescript
// Storage inspection
const stats = await offlineStorage.getStorageStats();
const health = await offlineStorage.healthCheck();
const exportedData = await offlineStorage.exportAllData();

// Sync debugging
const syncState = syncEngine.getState();
const syncSummary = await syncEngine.getSyncSummary();

// Network testing  
const connectivityTest = await networkDetector.testConnectivity();
```

## Integration with Epic 2+

The offline architecture is designed to support advanced Epic 2 features:

- **Real-time Collaboration**: Conflict-free replicated data types (CRDTs)
- **Timeline Management**: Offline timeline editing with sync
- **Photo/Document Storage**: Selective media caching
- **Import/Export**: Offline data portability
- **Background Jobs**: Queue-based processing

All Epic 2 features should use the offline patterns established here for consistent behavior and reliability.