/**
 * Trip Dashboard Integration Test Suite
 * Epic 2: Story 2.1 - Core Trip Management
 * Tests the main trip management screen functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';

import TripsScreen from '../index';
import { useTrips } from '@/api/trips/use-trips';
import { useSearchDebounce } from '@/hooks/use-debounced-search';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/api/trips/use-trips');
jest.mock('@/hooks/use-debounced-search');

const mockUseTrips = useTrips as jest.MockedFunction<typeof useTrips>;
const mockUseSearchDebounce = useSearchDebounce as jest.MockedFunction<typeof useSearchDebounce>;

const mockTripsData = {
  data: {
    trips: [
      {
        id: 'trip-1',
        name: 'European Adventure',
        description: 'Amazing trip through Europe',
        destination: 'Paris, France',
        startDate: '2024-06-01',
        endDate: '2024-06-15',
        status: 'PLANNING',
        tripType: 'LEISURE',
        budgetAmount: 3000,
        budgetCurrency: 'USD',
        coverImageUrl: 'https://example.com/image.jpg',
        participants: [],
        settings: {
          visibility: 'private',
          permissions: {
            canInvite: 'owner',
            canEditItinerary: 'owner',
            canAddExpenses: 'owner',
            canSeeExpenses: 'all',
          },
          notifications: {
            dailyDigest: true,
            instantUpdates: true,
            reminderDaysBefore: 1,
          },
        },
        ownerId: 'user-1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'trip-2',
        name: 'Business Conference NYC',
        description: 'Tech conference in New York',
        destination: 'New York, USA',
        startDate: '2024-03-10',
        endDate: '2024-03-12',
        status: 'CONFIRMED',
        tripType: 'BUSINESS',
        budgetAmount: 1500,
        budgetCurrency: 'USD',
        participants: [],
        settings: {
          visibility: 'private',
          permissions: {
            canInvite: 'owner',
            canEditItinerary: 'owner',
            canAddExpenses: 'owner',
            canSeeExpenses: 'all',
          },
          notifications: {
            dailyDigest: true,
            instantUpdates: true,
            reminderDaysBefore: 1,
          },
        },
        ownerId: 'user-1',
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
      },
    ],
  },
};

describe('TripsScreen - Trip Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseSearchDebounce.mockReturnValue({
      searchTerm: '',
      debouncedSearchTerm: '',
      isSearching: false,
      setSearchTerm: jest.fn(),
      clearSearch: jest.fn(),
    });

    mockUseTrips.mockReturnValue({
      data: mockTripsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Dashboard Layout', () => {
    it('should render trips dashboard header', () => {
      renderWithQueryClient(<TripsScreen />);
      
      expect(screen.getByText('My Trips')).toBeTruthy();
      expect(screen.getByText('Create Trip')).toBeTruthy();
    });

    it('should render view mode toggle buttons', () => {
      renderWithQueryClient(<TripsScreen />);
      
      // Grid and List view toggle buttons should be present
      const viewToggle = screen.getByTestId('view-mode-toggle');
      expect(viewToggle).toBeTruthy();
    });

    it('should show filter toggle button', () => {
      renderWithQueryClient(<TripsScreen />);
      
      expect(screen.getByText('Show Filters')).toBeTruthy();
    });
  });

  describe('Trip List Display', () => {
    it('should display trip cards when trips are available', () => {
      renderWithQueryClient(<TripsScreen />);
      
      expect(screen.getByText('European Adventure')).toBeTruthy();
      expect(screen.getByText('Business Conference NYC')).toBeTruthy();
    });

    it('should show empty state when no trips exist', () => {
      mockUseTrips.mockReturnValue({
        data: { data: { trips: [] } },
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isFetching: false,
      });

      renderWithQueryClient(<TripsScreen />);
      
      expect(screen.getByText('No Trips Yet')).toBeTruthy();
      expect(screen.getByText('Create your first trip to start planning your next adventure.')).toBeTruthy();
    });

    it('should handle loading state', () => {
      mockUseTrips.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isFetching: false,
      });

      renderWithQueryClient(<TripsScreen />);
      
      // Should show loading skeletons
      expect(screen.getByTestId('loading-skeleton')).toBeTruthy();
    });

    it('should handle error state', () => {
      mockUseTrips.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: jest.fn(),
        isFetching: false,
      });

      renderWithQueryClient(<TripsScreen />);
      
      expect(screen.getByText('Failed to Load Trips')).toBeTruthy();
      expect(screen.getByText('Try Again')).toBeTruthy();
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to create trip screen when create button is pressed', () => {
      renderWithQueryClient(<TripsScreen />);
      
      const createButton = screen.getByText('Create Trip');
      fireEvent.press(createButton);
      
      expect(router.push).toHaveBeenCalledWith('/trips/create');
    });

    it('should navigate to trip details when trip card is pressed', () => {
      renderWithQueryClient(<TripsScreen />);
      
      const tripCard = screen.getByText('European Adventure');
      fireEvent.press(tripCard);
      
      expect(router.push).toHaveBeenCalledWith('/trips/trip-1');
    });
  });

  describe('Search and Filter Integration', () => {
    it('should show search functionality', () => {
      renderWithQueryClient(<TripsScreen />);
      
      expect(screen.getByPlaceholderText('Search trips...')).toBeTruthy();
    });

    it('should handle search term changes', () => {
      const mockSetSearchTerm = jest.fn();
      mockUseSearchDebounce.mockReturnValue({
        searchTerm: '',
        debouncedSearchTerm: '',
        isSearching: false,
        setSearchTerm: mockSetSearchTerm,
        clearSearch: jest.fn(),
      });

      renderWithQueryClient(<TripsScreen />);
      
      const searchInput = screen.getByPlaceholderText('Search trips...');
      fireEvent.changeText(searchInput, 'Paris');
      
      expect(mockSetSearchTerm).toHaveBeenCalledWith('Paris');
    });

    it('should show searching indicator when search is active', () => {
      mockUseSearchDebounce.mockReturnValue({
        searchTerm: 'Paris',
        debouncedSearchTerm: 'Paris',
        isSearching: true,
        setSearchTerm: jest.fn(),
        clearSearch: jest.fn(),
      });

      renderWithQueryClient(<TripsScreen />);
      
      expect(screen.getByText('Searching...')).toBeTruthy();
    });

    it('should toggle filters panel', () => {
      renderWithQueryClient(<TripsScreen />);
      
      const filterToggle = screen.getByText('Show Filters');
      fireEvent.press(filterToggle);
      
      expect(screen.getByText('Hide Filters')).toBeTruthy();
    });
  });

  describe('Quick Actions Integration', () => {
    it('should show quick actions component', () => {
      renderWithQueryClient(<TripsScreen />);
      
      // Quick actions should be rendered
      expect(screen.getByTestId('quick-actions')).toBeTruthy();
    });

    it('should handle template selection modal', async () => {
      renderWithQueryClient(<TripsScreen />);
      
      const templatesButton = screen.getByText('From Template');
      fireEvent.press(templatesButton);
      
      await waitFor(() => {
        expect(screen.getByText('Trip Templates')).toBeTruthy();
      });
    });

    it('should handle quick plan modal', async () => {
      renderWithQueryClient(<TripsScreen />);
      
      const quickPlanButton = screen.getByText('Quick Plan');
      fireEvent.press(quickPlanButton);
      
      await waitFor(() => {
        expect(screen.getByText('Quick Trip Planning')).toBeTruthy();
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('should handle pull to refresh', () => {
      const mockRefetch = jest.fn();
      mockUseTrips.mockReturnValue({
        data: mockTripsData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
        isFetching: false,
      });

      renderWithQueryClient(<TripsScreen />);
      
      const scrollView = screen.getByTestId('trips-scroll-view');
      fireEvent(scrollView, 'refresh');
      
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      renderWithQueryClient(<TripsScreen />);
      
      const createButton = screen.getByText('Create Trip');
      expect(createButton.props.accessibilityRole).toBe('button');
      expect(createButton.props.accessibilityLabel).toBe('Create new trip');
    });

    it('should support screen readers', () => {
      renderWithQueryClient(<TripsScreen />);
      
      // Trip cards should have proper accessibility
      const tripCard = screen.getByLabelText(/Trip: European Adventure/);
      expect(tripCard).toBeTruthy();
    });
  });
});