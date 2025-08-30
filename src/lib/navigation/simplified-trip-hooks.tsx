/**
 * Simplified Trip Navigation Hooks
 * Replaces the complex trip-context.tsx with navigation store integration
 */

import { useRouter } from 'expo-router';
import React from 'react';

import { useTrip, useTripParticipants } from '@/api/trips';
import { useAuth } from '@/lib/auth';
import { useNavigationStore } from './navigation-store';

/**
 * Simplified hook for trip navigation - replaces useTripNavigation
 */
export const useTripNavigation = () => {
  const router = useRouter();
  const user = useAuth.use.token();
  
  // Use navigation store instead of separate trip context
  const currentTripId = useNavigationStore.use.currentTripId();
  const tripPermissions = useNavigationStore.use.tripPermissions();
  const setCurrentTrip = useNavigationStore.use.setCurrentTrip();
  const setTripPermissions = useNavigationStore.use.setTripPermissions();
  const setBreadcrumbs = useNavigationStore.use.setBreadcrumbs();
  
  // Fetch current trip data
  const { data: currentTrip, isLoading: isLoadingTrip, error: tripError } = useTrip(currentTripId || '');
  const { data: participants = [] } = useTripParticipants(currentTripId || '');

  // Calculate user permissions when participants change
  React.useEffect(() => {
    if (currentTripId && participants.length > 0 && user) {
      const userParticipant = participants.find(p => p.userId === user.userId);
      const userRole = userParticipant?.role || null;
      
      const permissions = {
        userRole,
        canEdit: userRole ? ['OWNER', 'ADMIN'].includes(userRole) : false,
        canInvite: userRole ? ['OWNER', 'ADMIN', 'MEMBER'].includes(userRole) : false,
        canDelete: userRole === 'OWNER',
      };
      
      setTripPermissions(permissions);
    } else {
      setTripPermissions(null);
    }
  }, [currentTripId, participants, user, setTripPermissions]);

  // Update breadcrumbs when trip changes
  React.useEffect(() => {
    if (currentTrip) {
      setBreadcrumbs([
        { label: 'Home', route: '/(app)' },
        { label: 'Trips', route: '/(app)/trips' },
        { label: currentTrip.name },
      ]);
    } else {
      setBreadcrumbs([{ label: 'Home', route: '/(app)' }]);
    }
  }, [currentTrip, setBreadcrumbs]);

  return {
    // Trip state
    currentTrip: currentTrip || null,
    currentTripId,
    isLoadingTrip,
    tripError,
    
    // Participants and permissions
    participants,
    userRole: tripPermissions?.userRole || null,
    canEdit: tripPermissions?.canEdit || false,
    canInvite: tripPermissions?.canInvite || false,
    canDelete: tripPermissions?.canDelete || false,
    
    // Navigation actions
    switchToTrip: (tripId: string) => {
      setCurrentTrip(tripId);
      router.push(`/(app)/trips/${tripId}` as any);
    },
    
    goToTripDetail: (tripId: string) => {
      setCurrentTrip(tripId);
      router.push(`/(app)/trips/${tripId}` as any);
    },
    
    goToCreateTrip: () => {
      router.push('/(app)/trips/create' as any);
    },
    
    clearCurrentTrip: () => {
      setCurrentTrip(null);
    },
    
    // Context helpers
    isInTripContext: !!currentTripId,
  };
};

/**
 * Simplified trip permissions hook
 */
export const useTripPermissions = () => {
  const tripPermissions = useNavigationStore.use.tripPermissions();
  
  return {
    role: tripPermissions?.userRole || null,
    canEdit: tripPermissions?.canEdit || false,
    canInvite: tripPermissions?.canInvite || false,
    canDelete: tripPermissions?.canDelete || false,
    isOwner: tripPermissions?.userRole === 'OWNER',
    isAdmin: tripPermissions?.userRole === 'ADMIN',
    isMember: tripPermissions?.userRole === 'MEMBER',
    isViewer: tripPermissions?.userRole === 'VIEWER',
  };
};

/**
 * Hook for requiring trip context - simplified version
 */
export const useRequireTrip = () => {
  const { currentTrip, isLoadingTrip, switchToTrip } = useTripNavigation();
  const router = useRouter();
  
  React.useEffect(() => {
    if (!isLoadingTrip && !currentTrip) {
      router.replace('/(app)/trips');
    }
  }, [currentTrip, isLoadingTrip, router]);
  
  return {
    trip: currentTrip,
    isLoading: isLoadingTrip,
    selectTrip: switchToTrip,
  };
};