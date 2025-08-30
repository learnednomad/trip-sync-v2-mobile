import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useTrip, useTripParticipants } from '@/api/trips';
import type { Trip, TripParticipant } from '@/api/trips/types';
import { useAuth } from '@/lib/auth';
import { storage } from '@/lib/storage';

interface TripNavigationContextType {
  // Current trip state
  currentTrip: Trip | null;
  isLoadingTrip: boolean;
  tripError: Error | null;

  // Participants and permissions
  participants: TripParticipant[];
  userRole: string | null;
  canEdit: boolean;
  canInvite: boolean;
  canDelete: boolean;

  // Navigation actions
  setCurrentTrip: (tripId: string | null) => void;
  switchToTrip: (tripId: string) => void;
  clearCurrentTrip: () => void;
  goToTripDetail: (tripId: string) => void;
  goToTripEdit: (tripId: string) => void;
  goToCreateTrip: () => void;

  // Context helpers
  isInTripContext: boolean;
  tripBreadcrumbs: Breadcrumb[];
}

interface Breadcrumb {
  label: string;
  route?: string;
}

const TripNavigationContext = createContext<TripNavigationContextType | null>(
  null
);

const CURRENT_TRIP_KEY = '@trip-sync/current-trip';

/**
 * Trip-aware navigation provider
 * Manages current trip context and provides navigation utilities
 */
export const TripNavigationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuth.use.token();

  const [currentTripId, setCurrentTripId] = useState<string | null>(null);

  // Fetch current trip data
  const {
    data: currentTrip,
    isLoading: isLoadingTrip,
    error: tripError,
  } = useTrip(currentTripId || '');

  // Fetch participants for current trip
  const { data: participants = [] } = useTripParticipants(currentTripId || '');

  // Auto-detect trip from URL
  useEffect(() => {
    const tripSegmentIndex = segments.findIndex(
      (segment) => segment === 'trips'
    );
    if (tripSegmentIndex !== -1 && segments[tripSegmentIndex + 1]) {
      const tripIdFromUrl = segments[tripSegmentIndex + 1];
      if (tripIdFromUrl !== 'create' && tripIdFromUrl !== currentTripId) {
        setCurrentTripId(tripIdFromUrl);
      }
    }
  }, [segments, currentTripId]);

  // Load persisted trip on app start
  useEffect(() => {
    if (!currentTripId) {
      const persistedTripId = storage.getString(CURRENT_TRIP_KEY);
      if (persistedTripId) {
        setCurrentTripId(persistedTripId);
      }
    }
  }, [currentTripId]);

  // Persist current trip
  useEffect(() => {
    if (currentTripId) {
      storage.set(CURRENT_TRIP_KEY, currentTripId);
    } else {
      storage.delete(CURRENT_TRIP_KEY);
    }
  }, [currentTripId]);

  // Calculate user permissions
  const userParticipant = participants.find((p) => p.userId === user?.userId);
  const userRole = userParticipant?.role || null;

  const canEdit = userRole ? ['OWNER', 'ADMIN'].includes(userRole) : false;
  const canInvite = userRole
    ? ['OWNER', 'ADMIN', 'MEMBER'].includes(userRole)
    : false;
  const canDelete = userRole === 'OWNER';

  // Determine if user is in trip context
  const isInTripContext = segments.includes('trips') && !!currentTripId;

  // Generate breadcrumbs
  const tripBreadcrumbs: Breadcrumb[] = React.useMemo(() => {
    const breadcrumbs: Breadcrumb[] = [{ label: 'Home', route: '/(app)' }];

    if (isInTripContext && currentTrip) {
      breadcrumbs.push(
        { label: 'Trips', route: '/(app)/trips' },
        { label: currentTrip.name }
      );
    }

    return breadcrumbs;
  }, [isInTripContext, currentTrip]);

  const contextValue: TripNavigationContextType = {
    // Trip state
    currentTrip: currentTrip || null,
    isLoadingTrip,
    tripError,

    // Participants and permissions
    participants,
    userRole,
    canEdit,
    canInvite,
    canDelete,

    // Navigation actions
    setCurrentTrip: (tripId) => setCurrentTripId(tripId),

    switchToTrip: (tripId) => {
      setCurrentTripId(tripId);
      router.push(`/(app)/trips/${tripId}` as any);
    },

    clearCurrentTrip: () => {
      setCurrentTripId(null);
    },

    goToTripDetail: (tripId) => {
      setCurrentTripId(tripId);
      router.push(`/(app)/trips/${tripId}` as any);
    },

    goToTripEdit: (tripId) => {
      setCurrentTripId(tripId);
      router.push(`/(app)/trips/${tripId}/edit` as any);
    },

    goToCreateTrip: () => {
      router.push('/(app)/trips/create' as any);
    },

    // Context helpers
    isInTripContext,
    tripBreadcrumbs,
  };

  return (
    <TripNavigationContext.Provider value={contextValue}>
      {children}
    </TripNavigationContext.Provider>
  );
};

/**
 * Hook for accessing trip navigation context
 */
export const useTripNavigation = (): TripNavigationContextType => {
  const context = useContext(TripNavigationContext);

  if (!context) {
    throw new Error(
      'useTripNavigation must be used within a TripNavigationProvider'
    );
  }

  return context;
};

/**
 * Hook for requiring trip context in components
 */
export const useRequireTrip = () => {
  const { currentTrip, isLoadingTrip, switchToTrip } = useTripNavigation();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingTrip && !currentTrip) {
      // No trip selected, redirect to trip list
      router.replace('/(app)/trips');
    }
  }, [currentTrip, isLoadingTrip, router]);

  return {
    trip: currentTrip,
    isLoading: isLoadingTrip,
    selectTrip: switchToTrip,
  };
};

/**
 * Hook for trip-specific permissions
 */
export const useTripPermissions = () => {
  const { userRole, canEdit, canInvite, canDelete } = useTripNavigation();

  return {
    role: userRole,
    canEdit,
    canInvite,
    canDelete,
    isOwner: userRole === 'OWNER',
    isAdmin: userRole === 'ADMIN',
    isMember: userRole === 'MEMBER',
    isViewer: userRole === 'VIEWER',
  };
};

/**
 * Hook for trip navigation breadcrumbs
 */
export const useTripBreadcrumbs = () => {
  const { tripBreadcrumbs } = useTripNavigation();
  return tripBreadcrumbs;
};
