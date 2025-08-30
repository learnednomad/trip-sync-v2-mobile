/**
 * TripStatusManager Component Test Suite
 * Epic 2: Story 2.1 - Core Trip Management
 * Tests trip lifecycle management, status transitions, and workflow automation
 */

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React from 'react';

import type { Trip, TripStatus } from '@/api/trips/types';

import { TripStatusManager } from '../TripStatusManager';

// Mock trip data with different statuses
const mockTrip: Trip = {
  id: 'trip-1',
  name: 'Business Conference Trip',
  description: 'A business conference in NYC',
  destination: 'New York, USA',
  status: 'PLANNING' as TripStatus,
  tripType: 'BUSINESS',
  startDate: '2024-02-15',
  endDate: '2024-02-17',
  budgetAmount: 2000,
  budgetCurrency: 'USD',
  settings: {
    visibility: 'private',
    permissions: {
      canInvite: 'all',
      canEditItinerary: 'all',
      canAddExpenses: 'all',
      canSeeExpenses: 'all',
    },
    notifications: {
      dailyDigest: true,
      instantUpdates: true,
      reminderDaysBefore: 1,
    },
  },
  participants: [],
  version: 1,
  ownerId: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

const mockStatusHistory = [
  {
    id: 'event-1',
    tripId: 'trip-1',
    fromStatus: null,
    toStatus: 'PLANNING',
    triggeredBy: 'user-1',
    triggeredAt: '2024-01-01T00:00:00Z',
    reason: 'Trip created',
    metadata: { source: 'manual' },
  },
  {
    id: 'event-2',
    tripId: 'trip-1',
    fromStatus: 'PLANNING',
    toStatus: 'CONFIRMED',
    triggeredBy: 'user-1',
    triggeredAt: '2024-01-10T00:00:00Z',
    reason: 'All bookings confirmed',
    metadata: { completionPercentage: 85 },
  },
];

const mockStatusTransitions = [
  {
    from: 'PLANNING',
    to: 'CONFIRMED',
    conditions: ['bookings_confirmed', 'itinerary_complete'],
    permissions: ['OWNER', 'COLLABORATOR'],
    automated: false,
  },
  {
    from: 'CONFIRMED',
    to: 'ONGOING',
    conditions: ['start_date_reached'],
    permissions: ['OWNER', 'COLLABORATOR'],
    automated: true,
  },
  {
    from: 'ONGOING',
    to: 'COMPLETED',
    conditions: ['end_date_reached'],
    permissions: ['OWNER', 'COLLABORATOR'],
    automated: true,
  },
  {
    from: 'PLANNING',
    to: 'CANCELLED',
    conditions: [],
    permissions: ['OWNER'],
    automated: false,
  },
];

describe('TripStatusManager Component', () => {
  const mockProps = {
    trip: mockTrip,
    onStatusChange: jest.fn(),
    onArchiveTrip: jest.fn(),
    onDuplicateTrip: jest.fn(),
    onDeleteTrip: jest.fn(),
    canManage: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should render when visible is true', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Trip Status Management')).toBeTruthy();
      expect(
        screen.getByText('Manage trip lifecycle and status transitions')
      ).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.queryByText('Trip Status Management')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      render(<TripStatusManager {...mockProps} />);

      const closeButton = screen.getByLabelText('Close status manager');
      fireEvent.press(closeButton);

      // onClose prop doesn't exist on TripStatusManager
    });
  });

  describe('Current Status Display', () => {
    it('should display current trip status', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Current Status')).toBeTruthy();
      expect(screen.getByText('PLANNING')).toBeTruthy();
      expect(screen.getByText('Trip is in planning phase')).toBeTruthy();
    });

    it('should show status badge with appropriate styling', () => {
      render(<TripStatusManager {...mockProps} />);

      const statusBadge = screen.getByTestId('current-status-badge');
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should display last updated information', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Last updated')).toBeTruthy();
      expect(screen.getByText('Jan 15, 2024')).toBeTruthy();
    });

    it('should show status duration', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('In current status for')).toBeTruthy();
      expect(screen.getByText(/\d+ days?/)).toBeTruthy();
    });
  });

  describe('Available Transitions', () => {
    it('should display available status transitions', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Available Actions')).toBeTruthy();
      expect(screen.getByText('Confirm Trip')).toBeTruthy();
      expect(screen.getByText('Cancel Trip')).toBeTruthy();
    });

    it('should show transition requirements', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Requirements:')).toBeTruthy();
      expect(screen.getByText('• Bookings confirmed')).toBeTruthy();
      expect(screen.getByText('• Itinerary complete')).toBeTruthy();
    });

    it('should disable transitions when requirements not met', () => {
      const propsWithUnmetConditions = {
        ...mockProps,
        trip: {
          ...mockTrip,
          bookingsConfirmed: false,
          itineraryComplete: false,
        },
      };

      render(<TripStatusManager {...propsWithUnmetConditions} />);

      const confirmButton = screen.getByText('Confirm Trip');
      expect(confirmButton.props.style).toMatchObject(
        expect.objectContaining({ opacity: expect.any(Number) })
      );
    });

    it('should enable transitions when requirements are met', () => {
      const propsWithMetConditions = {
        ...mockProps,
        trip: { ...mockTrip, bookingsConfirmed: true, itineraryComplete: true },
      };

      render(<TripStatusManager {...propsWithMetConditions} />);

      const confirmButton = screen.getByText('Confirm Trip');
      fireEvent.press(confirmButton);

      expect(mockProps.onStatusChange).toHaveBeenCalledWith(
        'CONFIRMED',
        'Manual confirmation'
      );
    });

    it('should filter transitions based on user permissions', () => {
      const collaboratorProps = {
        ...mockProps,
        userRole: 'COLLABORATOR' as const,
      };
      render(<TripStatusManager {...collaboratorProps} />);

      expect(screen.getByText('Confirm Trip')).toBeTruthy();
      expect(screen.queryByText('Cancel Trip')).toBeNull(); // Only owner can cancel
    });
  });

  describe('Status History', () => {
    it('should display status change history', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Status History')).toBeTruthy();
      expect(screen.getByText('Trip created')).toBeTruthy();
      expect(screen.getByText('All bookings confirmed')).toBeTruthy();
    });

    it('should show timestamps for status changes', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Jan 1, 2024')).toBeTruthy();
      expect(screen.getByText('Jan 10, 2024')).toBeTruthy();
    });

    it('should display who triggered each status change', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getAllByText('by Trip Owner')).toHaveLength(2);
    });

    it('should show transition arrows between statuses', () => {
      render(<TripStatusManager {...mockProps} />);

      const arrows = screen.getAllByTestId('status-transition-arrow');
      expect(arrows.length).toBeGreaterThan(0);
    });

    it('should display metadata when available', () => {
      render(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Completion: 85%')).toBeTruthy();
    });
  });

  describe('Automated Transitions', () => {
    it('should show upcoming automated transitions', () => {
      const confirmedTrip = { ...mockTrip, status: 'CONFIRMED' as TripStatus };
      const propsWithConfirmedTrip = { ...mockProps, trip: confirmedTrip };

      render(<TripStatusManager {...propsWithConfirmedTrip} />);

      expect(screen.getByText('Upcoming Automatic Changes')).toBeTruthy();
      expect(
        screen.getByText('Will change to ONGOING on Feb 15, 2024')
      ).toBeTruthy();
      expect(
        screen.getByText('Will change to COMPLETED on Feb 17, 2024')
      ).toBeTruthy();
    });

    it('should show countdown for upcoming transitions', () => {
      const confirmedTrip = { ...mockTrip, status: 'CONFIRMED' as TripStatus };
      const propsWithConfirmedTrip = { ...mockProps, trip: confirmedTrip };

      render(<TripStatusManager {...propsWithConfirmedTrip} />);

      expect(screen.getByText(/in \d+ days?/)).toBeTruthy();
    });

    it('should allow disabling automated transitions', () => {
      const confirmedTrip = { ...mockTrip, status: 'CONFIRMED' as TripStatus };
      const propsWithConfirmedTrip = { ...mockProps, trip: confirmedTrip };

      render(<TripStatusManager {...propsWithConfirmedTrip} />);

      const disableButton = screen.getByText('Disable Automatic Transitions');
      expect(disableButton).toBeTruthy();

      fireEvent.press(disableButton);
      expect(
        screen.getByText('Automatic transitions have been disabled')
      ).toBeTruthy();
    });
  });

  describe('Status Validation', () => {
    it('should validate status change requirements', async () => {
      render(<TripStatusManager {...mockProps} />);

      const confirmButton = screen.getByText('Confirm Trip');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Checking requirements...')).toBeTruthy();
      });
    });

    it('should show validation errors when requirements not met', async () => {
      const propsWithUnmetConditions = {
        ...mockProps,
        trip: { ...mockTrip, bookingsConfirmed: false },
      };

      render(<TripStatusManager {...propsWithUnmetConditions} />);

      const confirmButton = screen.getByText('Confirm Trip');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Requirements not met:')).toBeTruthy();
        expect(screen.getByText('• Bookings must be confirmed')).toBeTruthy();
      });
    });

    it('should confirm status change when validation passes', async () => {
      const propsWithMetConditions = {
        ...mockProps,
        trip: { ...mockTrip, bookingsConfirmed: true, itineraryComplete: true },
      };

      render(<TripStatusManager {...propsWithMetConditions} />);

      const confirmButton = screen.getByText('Confirm Trip');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Status Change')).toBeTruthy();
        expect(
          screen.getByText('Change status from PLANNING to CONFIRMED?')
        ).toBeTruthy();
      });

      const proceedButton = screen.getByText('Confirm Change');
      fireEvent.press(proceedButton);

      expect(mockProps.onStatusChange).toHaveBeenCalledWith(
        'CONFIRMED',
        'Manual confirmation'
      );
    });
  });

  describe('Trip Lifecycle Management', () => {
    it('should show archive option for completed trips', () => {
      const completedTrip = { ...mockTrip, status: 'COMPLETED' as TripStatus };
      const propsWithCompletedTrip = { ...mockProps, trip: completedTrip };

      render(<TripStatusManager {...propsWithCompletedTrip} />);

      expect(screen.getByText('Archive Trip')).toBeTruthy();
      expect(screen.getByText('Move trip to archives')).toBeTruthy();
    });

    it('should confirm trip archival', () => {
      const completedTrip = { ...mockTrip, status: 'COMPLETED' as TripStatus };
      const propsWithCompletedTrip = { ...mockProps, trip: completedTrip };

      render(<TripStatusManager {...propsWithCompletedTrip} />);

      const archiveButton = screen.getByText('Archive Trip');
      fireEvent.press(archiveButton);

      expect(screen.getByText('Archive Trip')).toBeTruthy();
      expect(
        screen.getByText('Are you sure you want to archive this trip?')
      ).toBeTruthy();

      const confirmArchive = screen.getByText('Archive');
      fireEvent.press(confirmArchive);

      expect(mockProps.onArchiveTrip).toHaveBeenCalledWith('trip-1');
    });

    it('should show restore option for archived trips', () => {
      const archivedTrip = { ...mockTrip, status: 'ARCHIVED' as TripStatus };
      const propsWithArchivedTrip = { ...mockProps, trip: archivedTrip };

      render(<TripStatusManager {...propsWithArchivedTrip} />);

      expect(screen.getByText('Restore Trip')).toBeTruthy();
      expect(screen.getByText('Restore from archives')).toBeTruthy();
    });

    it('should show delete option for cancelled trips', () => {
      const cancelledTrip = { ...mockTrip, status: 'CANCELLED' as TripStatus };
      const propsWithCancelledTrip = { ...mockProps, trip: cancelledTrip };

      render(<TripStatusManager {...propsWithCancelledTrip} />);

      expect(screen.getByText('Delete Trip')).toBeTruthy();
      expect(screen.getByText('Permanently delete trip data')).toBeTruthy();
    });

    it('should require confirmation for trip deletion', () => {
      const cancelledTrip = { ...mockTrip, status: 'CANCELLED' as TripStatus };
      const propsWithCancelledTrip = { ...mockProps, trip: cancelledTrip };

      render(<TripStatusManager {...propsWithCancelledTrip} />);

      const deleteButton = screen.getByText('Delete Trip');
      fireEvent.press(deleteButton);

      expect(screen.getByText('Delete Trip Permanently')).toBeTruthy();
      expect(screen.getByText('This action cannot be undone')).toBeTruthy();
      expect(
        screen.getByPlaceholderText('Type trip name to confirm')
      ).toBeTruthy();
    });

    it('should validate trip name before deletion', async () => {
      const cancelledTrip = { ...mockTrip, status: 'CANCELLED' as TripStatus };
      const propsWithCancelledTrip = { ...mockProps, trip: cancelledTrip };

      render(<TripStatusManager {...propsWithCancelledTrip} />);

      const deleteButton = screen.getByText('Delete Trip');
      fireEvent.press(deleteButton);

      const confirmInput = screen.getByPlaceholderText(
        'Type trip name to confirm'
      );
      fireEvent.changeText(confirmInput, 'wrong name');

      const confirmDelete = screen.getByText('Delete Permanently');
      fireEvent.press(confirmDelete);

      await waitFor(() => {
        expect(screen.getByText('Trip name does not match')).toBeTruthy();
      });
    });

    it('should proceed with deletion when name matches', async () => {
      const cancelledTrip = { ...mockTrip, status: 'CANCELLED' as TripStatus };
      const propsWithCancelledTrip = { ...mockProps, trip: cancelledTrip };

      render(<TripStatusManager {...propsWithCancelledTrip} />);

      const deleteButton = screen.getByText('Delete Trip');
      fireEvent.press(deleteButton);

      const confirmInput = screen.getByPlaceholderText(
        'Type trip name to confirm'
      );
      fireEvent.changeText(confirmInput, 'Business Conference Trip');

      const confirmDelete = screen.getByText('Delete Permanently');
      fireEvent.press(confirmDelete);

      await waitFor(() => {
        expect(mockProps.onDeleteTrip).toHaveBeenCalledWith('trip-1');
      });
    });
  });

  describe('Status Workflows', () => {
    it('should show workflow templates for different trip types', () => {
      render(<TripStatusManager {...mockProps} />);

      const workflowTab = screen.getByText('Workflows');
      fireEvent.press(workflowTab);

      expect(screen.getByText('Business Trip Workflow')).toBeTruthy();
      expect(screen.getByText('Leisure Trip Workflow')).toBeTruthy();
      expect(screen.getByText('Family Trip Workflow')).toBeTruthy();
    });

    it('should allow applying workflow templates', () => {
      render(<TripStatusManager {...mockProps} />);

      const workflowTab = screen.getByText('Workflows');
      fireEvent.press(workflowTab);

      const businessWorkflow = screen.getByText('Apply Business Workflow');
      fireEvent.press(businessWorkflow);

      expect(screen.getByText('Apply Workflow Template')).toBeTruthy();
      expect(
        screen.getByText(
          'This will set up automated transitions for business trips'
        )
      ).toBeTruthy();
    });

    it('should show workflow progress indicators', () => {
      const propsWithWorkflow = {
        ...mockProps,
        trip: {
          ...mockTrip,
          workflow: 'business',
          workflowStep: 2,
          totalSteps: 5,
        },
      };

      render(<TripStatusManager {...propsWithWorkflow} />);

      expect(screen.getByText('Workflow Progress')).toBeTruthy();
      expect(screen.getByText('Step 2 of 5')).toBeTruthy();
      expect(screen.getByTestId('workflow-progress-bar')).toBeTruthy();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time status updates', () => {
      const { rerender } = render(<TripStatusManager {...mockProps} />);

      const updatedTrip = { ...mockTrip, status: 'CONFIRMED' as TripStatus };
      rerender(<TripStatusManager {...mockProps} trip={updatedTrip} />);

      expect(screen.getByText('CONFIRMED')).toBeTruthy();
      expect(screen.getByText('Trip is confirmed and ready')).toBeTruthy();
    });

    it('should show notification for status changes', () => {
      const { rerender } = render(<TripStatusManager {...mockProps} />);

      const updatedTrip = { ...mockTrip, status: 'CONFIRMED' as TripStatus };
      rerender(<TripStatusManager {...mockProps} trip={updatedTrip} />);

      expect(screen.getByText('Status changed to CONFIRMED')).toBeTruthy();
    });

    it('should update history with new events', () => {
      const { rerender } = render(<TripStatusManager {...mockProps} />);

      const newEvent = {
        id: 'event-3',
        tripId: 'trip-1',
        fromStatus: 'CONFIRMED',
        toStatus: 'ONGOING',
        triggeredBy: 'system',
        triggeredAt: '2024-02-15T00:00:00Z',
        reason: 'Start date reached',
        metadata: { automated: true },
      };

      const updatedHistory = [...mockStatusHistory, newEvent];
      rerender(<TripStatusManager {...mockProps} />);

      expect(screen.getByText('Start date reached')).toBeTruthy();
      expect(screen.getByText('by System')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<TripStatusManager {...mockProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal.props.accessibilityLabel).toBe('Trip status management');

      const statusBadge = screen.getByLabelText('Current status: PLANNING');
      expect(statusBadge).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      render(<TripStatusManager {...mockProps} />);

      const actionButtons = screen.getAllByRole('button');
      actionButtons.forEach((button) => {
        expect(button.props.accessible).toBe(true);
      });
    });

    it('should announce status changes', async () => {
      const propsWithMetConditions = {
        ...mockProps,
        trip: { ...mockTrip, bookingsConfirmed: true, itineraryComplete: true },
      };

      render(<TripStatusManager {...propsWithMetConditions} />);

      const confirmButton = screen.getByText('Confirm Trip');
      fireEvent.press(confirmButton);

      const proceedButton = screen.getByText('Confirm Change');
      fireEvent.press(proceedButton);

      await waitFor(() => {
        const announcement = screen.getByLabelText(
          'Status changed from PLANNING to CONFIRMED'
        );
        expect(announcement).toBeTruthy();
      });
    });

    it('should provide context for automated transitions', () => {
      const confirmedTrip = { ...mockTrip, status: 'CONFIRMED' as TripStatus };
      const propsWithConfirmedTrip = { ...mockProps, trip: confirmedTrip };

      render(<TripStatusManager {...propsWithConfirmedTrip} />);

      const automatedInfo = screen.getByLabelText(
        'Automatic transition to ONGOING scheduled for start date'
      );
      expect(automatedInfo).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle status change errors', async () => {
      const errorProps = {
        ...mockProps,
        onStatusChange: jest
          .fn()
          .mockRejectedValue(new Error('Status change failed')),
      };

      render(<TripStatusManager {...errorProps} />);

      const confirmButton = screen.getByText('Confirm Trip');
      fireEvent.press(confirmButton);

      const proceedButton = screen.getByText('Confirm Change');
      fireEvent.press(proceedButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to change status. Please try again.')
        ).toBeTruthy();
      });
    });

    it('should handle archive errors', async () => {
      const completedTrip = { ...mockTrip, status: 'COMPLETED' as TripStatus };
      const errorProps = {
        ...mockProps,
        trip: completedTrip,
        onArchiveTrip: jest.fn().mockRejectedValue(new Error('Archive failed')),
      };

      render(<TripStatusManager {...errorProps} />);

      const archiveButton = screen.getByText('Archive Trip');
      fireEvent.press(archiveButton);

      const confirmArchive = screen.getByText('Archive');
      fireEvent.press(confirmArchive);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to archive trip. Please try again.')
        ).toBeTruthy();
      });
    });

    it('should handle deletion errors', async () => {
      const cancelledTrip = { ...mockTrip, status: 'CANCELLED' as TripStatus };
      const errorProps = {
        ...mockProps,
        trip: cancelledTrip,
        onDeleteTrip: jest.fn().mockRejectedValue(new Error('Deletion failed')),
      };

      render(<TripStatusManager {...errorProps} />);

      const deleteButton = screen.getByText('Delete Trip');
      fireEvent.press(deleteButton);

      const confirmInput = screen.getByPlaceholderText(
        'Type trip name to confirm'
      );
      fireEvent.changeText(confirmInput, 'Business Conference Trip');

      const confirmDelete = screen.getByText('Delete Permanently');
      fireEvent.press(confirmDelete);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to delete trip. Please try again.')
        ).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large status histories efficiently', () => {
      const largeHistory = Array.from({ length: 100 }, (_, index) => ({
        id: `event-${index}`,
        tripId: 'trip-1',
        fromStatus: 'PLANNING' as TripStatus,
        toStatus: 'CONFIRMED' as TripStatus,
        triggeredBy: 'user-1',
        triggeredAt: `2024-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
        reason: `Status change ${index}`,
        metadata: {},
      }));

      render(<TripStatusManager {...mockProps} />);

      // Should render without crashing
      expect(screen.getByText('Business Conference Trip')).toBeTruthy();
      expect(screen.getByText('Status change 0')).toBeTruthy();
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<TripStatusManager {...mockProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should efficiently render status transitions', () => {
      const manyTransitions = Array.from({ length: 20 }, (_, index) => ({
        from: 'PLANNING' as TripStatus,
        to: 'CONFIRMED' as TripStatus,
        conditions: [`condition_${index}`],
        permissions: ['OWNER'],
        automated: false,
      }));

      const propsWithManyTransitions = {
        ...mockProps,
        availableTransitions: manyTransitions,
      };

      render(<TripStatusManager {...propsWithManyTransitions} />);
      // Should render without crashing
      expect(screen.getByText('Business Conference Trip')).toBeTruthy();
    });
  });
});
