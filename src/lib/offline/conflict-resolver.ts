/**
 * Conflict Resolution System
 * Handles data conflicts between local and remote changes
 */

import type { Trip } from '@/api/trips/types';
import type { CachedTrip } from './offline-storage';

export interface Conflict {
  id: string;
  resourceType: 'trip' | 'participant' | 'user';
  resourceId: string;
  localVersion: any;
  remoteVersion: any;
  conflictFields: string[];
  detectedAt: string;
  priority: 'high' | 'medium' | 'low';
  autoResolvable: boolean;
  recommendedResolution: 'local' | 'remote' | 'merge' | 'manual';
}

export interface ConflictResolution {
  conflictId: string;
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolvedData: any;
  resolvedAt: string;
  resolvedBy: 'auto' | 'user';
  reasoning?: string;
}

/**
 * Intelligent conflict resolution system
 */
export class ConflictResolver {
  private static instance: ConflictResolver;
  
  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  /**
   * Detect conflicts between local and remote data
   */
  detectConflicts(local: CachedTrip, remote: Trip): Conflict | null {
    const conflictFields: string[] = [];
    
    // Version-based conflict detection
    if (local.version !== remote.version) {
      // Compare critical fields
      const criticalFields = [
        'name', 'description', 'startDate', 'endDate', 
        'destination', 'status', 'budgetAmount', 'settings'
      ];
      
      for (const field of criticalFields) {
        if (this.hasFieldConflict(local, remote, field)) {
          conflictFields.push(field);
        }
      }
      
      if (conflictFields.length > 0) {
        return {
          id: this.generateConflictId(),
          resourceType: 'trip',
          resourceId: local.id,
          localVersion: local,
          remoteVersion: remote,
          conflictFields,
          detectedAt: new Date().toISOString(),
          priority: this.assessConflictPriority(conflictFields),
          autoResolvable: this.isAutoResolvable(conflictFields),
          recommendedResolution: this.getRecommendedResolution(conflictFields, local, remote),
        };
      }
    }
    
    return null;
  }

  /**
   * Automatically resolve conflicts when possible
   */
  async autoResolveConflict(conflict: Conflict): Promise<ConflictResolution | null> {
    if (!conflict.autoResolvable) {
      return null;
    }

    const { localVersion, remoteVersion, conflictFields } = conflict;
    let resolvedData: any;
    let strategy: ConflictResolution['strategy'];
    let reasoning: string;

    // Apply automatic resolution rules
    if (this.isNonCriticalFieldsOnly(conflictFields)) {
      // Merge non-critical changes, prefer remote for critical fields
      resolvedData = this.mergeNonCriticalFields(localVersion, remoteVersion, conflictFields);
      strategy = 'merge';
      reasoning = 'Automatic merge: non-critical fields only';
    } else if (this.isTimestampBased(conflictFields)) {
      // Use newer timestamp for timestamp-based fields
      resolvedData = this.mergeByTimestamp(localVersion, remoteVersion, conflictFields);
      strategy = 'merge';
      reasoning = 'Automatic merge: timestamp-based resolution';
    } else if (this.isAdditive(conflictFields)) {
      // Merge arrays (participants, expenses, etc.)
      resolvedData = this.mergeAdditive(localVersion, remoteVersion, conflictFields);
      strategy = 'merge';
      reasoning = 'Automatic merge: additive arrays combined';
    } else {
      return null; // Requires manual resolution
    }

    return {
      conflictId: conflict.id,
      strategy,
      resolvedData,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'auto',
      reasoning,
    };
  }

  /**
   * Present conflict to user for manual resolution
   */
  async presentConflictToUser(conflict: Conflict): Promise<ConflictResolution> {
    // This would trigger a UI modal for manual conflict resolution
    // For now, return a default resolution
    console.log('⚠️ Manual conflict resolution required:', conflict.id);
    
    return {
      conflictId: conflict.id,
      strategy: 'remote', // Default: server wins
      resolvedData: conflict.remoteVersion,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'user',
      reasoning: 'Manual resolution: user chose remote version',
    };
  }

  // Private helper methods
  private hasFieldConflict(local: any, remote: any, field: string): boolean {
    const localValue = this.getFieldValue(local, field);
    const remoteValue = this.getFieldValue(remote, field);
    
    // Deep comparison for objects/arrays
    return JSON.stringify(localValue) !== JSON.stringify(remoteValue);
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => current?.[key], obj);
  }

  private assessConflictPriority(conflictFields: string[]): 'high' | 'medium' | 'low' {
    const highPriorityFields = ['name', 'startDate', 'endDate', 'status'];
    const mediumPriorityFields = ['description', 'destination', 'budgetAmount'];
    
    if (conflictFields.some(field => highPriorityFields.includes(field))) {
      return 'high';
    }
    
    if (conflictFields.some(field => mediumPriorityFields.includes(field))) {
      return 'medium';
    }
    
    return 'low';
  }

  private isAutoResolvable(conflictFields: string[]): boolean {
    const nonCriticalFields = ['coverImageUrl', 'lastViewedAt', 'settings.lastUpdated'];
    const timestampFields = ['updatedAt', 'lastViewedAt'];
    const additiveFields = ['participants', 'expenses', 'itineraryItems'];
    
    // Check if all conflicts are in resolvable categories
    return conflictFields.every(field => 
      nonCriticalFields.includes(field) ||
      timestampFields.includes(field) ||
      additiveFields.includes(field)
    );
  }

  private getRecommendedResolution(
    conflictFields: string[], 
    local: any, 
    remote: any
  ): 'local' | 'remote' | 'merge' | 'manual' {
    if (this.isAutoResolvable(conflictFields)) {
      return 'merge';
    }
    
    // For critical fields, recommend manual resolution
    const criticalFields = ['name', 'startDate', 'endDate', 'status'];
    if (conflictFields.some(field => criticalFields.includes(field))) {
      return 'manual';
    }
    
    // Default to remote (server wins)
    return 'remote';
  }

  private isNonCriticalFieldsOnly(conflictFields: string[]): boolean {
    const nonCriticalFields = ['coverImageUrl', 'lastViewedAt', 'settings.notifications'];
    return conflictFields.every(field => nonCriticalFields.includes(field));
  }

  private isTimestampBased(conflictFields: string[]): boolean {
    const timestampFields = ['updatedAt', 'lastViewedAt', 'lastModified'];
    return conflictFields.every(field => timestampFields.includes(field));
  }

  private isAdditive(conflictFields: string[]): boolean {
    const additiveFields = ['participants', 'expenses', 'itineraryItems', 'messages'];
    return conflictFields.some(field => additiveFields.includes(field));
  }

  private mergeNonCriticalFields(local: any, remote: any, conflictFields: string[]): any {
    const result = { ...remote }; // Start with remote
    
    // Keep local values for non-critical fields
    const nonCriticalFields = ['coverImageUrl', 'lastViewedAt'];
    for (const field of conflictFields) {
      if (nonCriticalFields.includes(field)) {
        this.setFieldValue(result, field, this.getFieldValue(local, field));
      }
    }
    
    return result;
  }

  private mergeByTimestamp(local: any, remote: any, conflictFields: string[]): any {
    const result = { ...remote };
    
    for (const field of conflictFields) {
      const localTime = new Date(this.getFieldValue(local, field)).getTime();
      const remoteTime = new Date(this.getFieldValue(remote, field)).getTime();
      
      // Use newer timestamp
      if (localTime > remoteTime) {
        this.setFieldValue(result, field, this.getFieldValue(local, field));
      }
    }
    
    return result;
  }

  private mergeAdditive(local: any, remote: any, conflictFields: string[]): any {
    const result = { ...remote };
    
    for (const field of conflictFields) {
      const localArray = this.getFieldValue(local, field) || [];
      const remoteArray = this.getFieldValue(remote, field) || [];
      
      // Merge arrays by ID, preferring remote for duplicates
      const mergedArray = [...remoteArray];
      
      for (const localItem of localArray) {
        const existsInRemote = remoteArray.some((remoteItem: any) => 
          remoteItem.id === localItem.id
        );
        
        if (!existsInRemote) {
          mergedArray.push(localItem);
        }
      }
      
      this.setFieldValue(result, field, mergedArray);
    }
    
    return result;
  }

  private setFieldValue(obj: any, field: string, value: any): void {
    const keys = field.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const conflictResolver = ConflictResolver.getInstance();