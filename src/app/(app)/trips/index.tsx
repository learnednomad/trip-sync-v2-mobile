/**
 * Trip Dashboard - Main trip management screen
 * Epic 2: Story 2.1 - Core Trip Management
 * Acceptance Criteria: Trip Dashboard & Overview, Advanced Search & Filtering
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Plus, Grid, List } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { TripCard } from '@/components/trips/TripCard';
import { TripFilters } from '@/components/trips/TripFilters';
import { SearchFilters, type SearchFilters as SearchFiltersType } from '@/components/trips/SearchFilters';
import { SavedSearches } from '@/components/trips/SavedSearches';
import { QuickActions } from '@/components/trips/QuickActions';
import { TripTemplates, type TripTemplate } from '@/components/trips/TripTemplates';
import { QuickPlanModal } from '@/components/trips/QuickPlanModal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useSearchDebounce } from '@/hooks/use-debounced-search';
import { useTrips } from '@/api/trips/use-trips';
import type { TripListParams, TripStatus, CreateTripRequest } from '@/api/trips/types';

type ViewMode = 'grid' | 'list';

export default function TripsScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<TripListParams>({
    limit: 20,
    sort: 'updatedAt',
    order: 'desc',
  });
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({});

  // Debounced search functionality
  const { 
    searchTerm, 
    debouncedSearchTerm, 
    isSearching, 
    setSearchTerm, 
    clearSearch 
  } = useSearchDebounce('', { delay: 300, minLength: 1 });

  // Combine filters with search query and search filters
  const queryParams = useMemo(() => {
    const baseParams: TripListParams = {
      ...filters,
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    };

    // Efficiently merge search filters, filtering out undefined values
    const searchFilterEntries = Object.entries(searchFilters).filter(([_, value]) => value != null);
    const validSearchFilters = Object.fromEntries(searchFilterEntries);

    return { 
      ...baseParams, 
      ...validSearchFilters,
      // Ensure proper typing for tripType
      ...(validSearchFilters.tripType && { tripType: validSearchFilters.tripType as any })
    };
  }, [filters, debouncedSearchTerm, searchFilters]);

  const {
    data: tripsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTrips(queryParams);

  const trips = tripsResponse?.data?.trips || [];
  const hasTrips = trips.length > 0;

  const handleCreateTrip = useCallback(() => {
    router.push('/trips/create');
  }, []);

  const handleTripPress = useCallback((tripId: string) => {
    router.push(`/trips/${tripId}`);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<TripListParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      limit: 20,
      sort: 'updatedAt',
      order: 'desc',
    });
    clearSearch();
    setSearchFilters({});
  }, [clearSearch]);

  const handleSearchFiltersChange = useCallback((newSearchFilters: Partial<SearchFiltersType>) => {
    setSearchFilters(prev => ({ ...prev, ...newSearchFilters }));
  }, []);

  const handleClearSearchFilters = useCallback(() => {
    setSearchFilters({});
  }, []);

  const handleApplySavedSearch = (savedSearch: any) => {
    setFilters(savedSearch.filters);
    setSearchFilters(savedSearch.searchFilters);
    setSearchTerm(savedSearch.searchQuery);
  };

  const handleSaveSearch = (name: string) => {
    // In a real app, this would save to storage or API
    console.log('Saving search:', {
      name,
      searchQuery: searchTerm,
      filters,
      searchFilters,
    });
    // Show success toast or feedback
  };

  const handleTemplateSelect = (template: TripTemplate, customizations?: any) => {
    // Convert template to CreateTripRequest format
    const tripData: Partial<CreateTripRequest> = {
      name: customizations?.destination 
        ? `${template.name} - ${customizations.destination}` 
        : template.name,
      description: template.description,
      tripType: template.tripType,
      destination: customizations?.destination || template.destinations[0],
      budgetAmount: customizations?.budget || template.suggestedBudget.min,
      budgetCurrency: template.suggestedBudget.currency,
    };

    // Navigate to create trip with pre-filled data
    router.push({
      pathname: '/trips/create',
      params: { templateData: JSON.stringify(tripData) }
    });
  };

  const handleQuickPlanCreate = (planData: any) => {
    // Convert quick plan data to CreateTripRequest format
    const tripData: Partial<CreateTripRequest> = {
      name: `${planData.tripType} Trip to ${planData.destination}`,
      destination: planData.destination,
      tripType: planData.tripType,
      startDate: planData.startDate,
      endDate: planData.endDate,
      budgetAmount: planData.budget,
      budgetCurrency: 'USD',
    };

    // Navigate to create trip with pre-filled data
    router.push({
      pathname: '/trips/create',
      params: { planData: JSON.stringify(tripData) }
    });
  };

  const handleDuplicateLastTrip = () => {
    // In a real app, this would duplicate the most recent trip
    const lastTrip = trips[0];
    if (lastTrip) {
      const duplicateData: Partial<CreateTripRequest> = {
        name: `${lastTrip.name} (Copy)`,
        description: lastTrip.description,
        destination: lastTrip.destination,
        tripType: lastTrip.tripType,
        budgetAmount: lastTrip.budgetAmount,
        budgetCurrency: lastTrip.budgetCurrency,
      };

      router.push({
        pathname: '/trips/create',
        params: { duplicateData: JSON.stringify(duplicateData) }
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-4 py-6 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">My Trips</Text>
        </View>
        <ScrollView className="flex-1 px-4 py-6">
          <LoadingSkeleton.TripList count={6} />
        </ScrollView>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-4 py-6 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">My Trips</Text>
        </View>
        <View className="flex-1 justify-center items-center px-4">
          <EmptyState
            icon="alert-circle"
            title="Failed to Load Trips"
            description="We couldn't load your trips. Please try again."
            action={{
              label: 'Try Again',
              onPress: () => refetch(),
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">My Trips</Text>
          <Button
            onPress={handleCreateTrip}
            size="sm"
            className="bg-blue-600"
          >
            <Plus width={16} height={16} color="white" />
            <Text className="text-white font-medium ml-2">Create Trip</Text>
          </Button>
        </View>

        {/* View Mode Toggle */}
        <View className="flex-row items-center justify-end space-x-3">
          <Button
            variant="outline"
            size="sm"
            onPress={() => setShowFilters(!showFilters)}
            className={showFilters ? 'border-blue-600' : ''}
          >
            <Text className={`text-sm ${showFilters ? 'text-blue-600' : 'text-gray-600'}`}>
              {showFilters ? 'Hide' : 'Show'} Filters
            </Text>
          </Button>
          <View className="flex-row border border-gray-200 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setViewMode('grid')}
              className={`border-0 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid width={16} height={16} color={viewMode === 'grid' ? '#2563EB' : '#6B7280'} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setViewMode('list')}
              className={`border-0 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <List width={16} height={16} color={viewMode === 'list' ? '#2563EB' : '#6B7280'} />
            </Button>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <QuickActions
        onCreateTrip={handleCreateTrip}
        onShowTemplates={() => setShowTemplates(true)}
        onDuplicateLastTrip={handleDuplicateLastTrip}
        onQuickPlan={() => setShowQuickPlan(true)}
      />

      {/* Advanced Search */}
      <SearchFilters
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchFilters={searchFilters}
        onSearchFiltersChange={handleSearchFiltersChange}
        onClearSearchFilters={handleClearSearchFilters}
      />

      {/* Search Status */}
      {isSearching && (
        <View className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <Text className="text-blue-600 text-sm">Searching...</Text>
        </View>
      )}

      {/* Saved Searches */}
      <SavedSearches
        currentSearch={searchTerm}
        currentFilters={filters}
        currentSearchFilters={searchFilters}
        onApplySearch={handleApplySavedSearch}
        onSaveSearch={handleSaveSearch}
      />

      {/* Filters Panel */}
      {showFilters && (
        <TripFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Trip List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {!hasTrips ? (
          <View className="flex-1 justify-center items-center px-4 py-12">
            <EmptyState
              icon="map"
              title="No Trips Yet"
              description="Create your first trip to start planning your next adventure."
              action={{
                label: 'Create Your First Trip',
                onPress: handleCreateTrip,
              }}
            />
          </View>
        ) : (
          <View className={`p-4 ${viewMode === 'grid' ? 'flex-row flex-wrap' : ''}`}>
            {trips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                viewMode={viewMode}
                onPress={() => handleTripPress(trip.id)}
                className={viewMode === 'grid' ? 'w-1/2 p-2' : 'mb-4'}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Trip Templates Modal */}
      <TripTemplates
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Quick Plan Modal */}
      <QuickPlanModal
        visible={showQuickPlan}
        onClose={() => setShowQuickPlan(false)}
        onCreateTrip={handleQuickPlanCreate}
      />
    </View>
  );
}