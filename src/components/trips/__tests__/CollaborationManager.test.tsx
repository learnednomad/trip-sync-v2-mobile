/**
 * CollaborationManager Component Test Suite
 * Epic 2: Story 2.1 - Core Trip Management
 * Tests role-based permissions, participant management, and collaboration workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CollaborationManager, type TripParticipant, type CollaborationRole, type CollaborationPermissions } from '../CollaborationManager';

// Mock participants with different roles
const mockParticipants: TripParticipant[] = [
  {
    id: 'participant-1',
    userId: 'user-1',
    tripId: 'trip-1',
    role: 'OWNER',
    status: 'ACCEPTED',
    permissions: ['READ', 'WRITE', 'DELETE', 'INVITE', 'MANAGE_ROLES'],
    email: 'owner@example.com',
    name: 'Trip Owner',
    joinedAt: '2024-01-01T00:00:00Z',
    avatar: 'https://example.com/avatar1.jpg'
  },
  {
    id: 'participant-2',
    userId: 'user-2', 
    tripId: 'trip-1',
    role: 'COLLABORATOR',
    status: 'ACCEPTED',
    permissions: ['READ', 'WRITE', 'INVITE'],
    email: 'collaborator@example.com',
    name: 'Active Collaborator',
    joinedAt: '2024-01-02T00:00:00Z',
    avatar: 'https://example.com/avatar2.jpg'
  },
  {
    id: 'participant-3',
    userId: 'user-3',
    tripId: 'trip-1', 
    role: 'VIEWER',
    status: 'PENDING',
    permissions: ['READ'],
    email: 'viewer@example.com',
    name: 'Pending Viewer',
    joinedAt: null,
    avatar: null
  }
];

const mockInvitations = [
  {
    id: 'invitation-1',
    tripId: 'trip-1',
    email: 'pending@example.com',
    role: 'COLLABORATOR',
    status: 'PENDING',
    invitedBy: 'user-1',
    createdAt: '2024-01-03T00:00:00Z',
    expiresAt: '2024-01-10T00:00:00Z'
  }
];

describe('CollaborationManager Component', () => {
  const mockProps = {
    tripId: 'trip-1',
    participants: mockParticipants,
    currentUserId: 'user-1',
    visible: true,
    onClose: jest.fn(),
    onInviteParticipant: jest.fn(),
    onUpdateRole: jest.fn(),
    onRemoveParticipant: jest.fn(),
    onResendInvitation: jest.fn(),
    onCancelInvitation: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should render when visible is true', () => {
      render(<CollaborationManager {...mockProps} />);
      
      expect(screen.getByText('Collaboration')).toBeTruthy();
      expect(screen.getByText('Manage trip participants and permissions')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      render(<CollaborationManager {...mockProps} visible={false} />);
      
      expect(screen.queryByText('Collaboration')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Close collaboration manager');
      fireEvent.press(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Participant List Display', () => {
    it('should display all participants with correct information', () => {
      render(<CollaborationManager {...mockProps} />);
      
      expect(screen.getByText('Trip Owner')).toBeTruthy();
      expect(screen.getByText('owner@example.com')).toBeTruthy();
      expect(screen.getByText('OWNER')).toBeTruthy();
      
      expect(screen.getByText('Active Collaborator')).toBeTruthy();
      expect(screen.getByText('collaborator@example.com')).toBeTruthy();
      expect(screen.getByText('COLLABORATOR')).toBeTruthy();
      
      expect(screen.getByText('Pending Viewer')).toBeTruthy();
      expect(screen.getByText('viewer@example.com')).toBeTruthy();
      expect(screen.getByText('VIEWER')).toBeTruthy();
    });

    it('should show participant status badges correctly', () => {
      render(<CollaborationManager {...mockProps} />);
      
      expect(screen.getByText('ACCEPTED')).toBeTruthy();
      expect(screen.getByText('PENDING')).toBeTruthy();
    });

    it('should display participant join dates when available', () => {
      render(<CollaborationManager {...mockProps} />);
      
      expect(screen.getByText('Joined Jan 1, 2024')).toBeTruthy();
      expect(screen.getByText('Joined Jan 2, 2024')).toBeTruthy();
      expect(screen.getByText('Invitation sent Jan 3, 2024')).toBeTruthy();
    });

    it('should show participant avatars when available', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const avatars = screen.getAllByTestId('participant-avatar');
      expect(avatars).toHaveLength(3);
    });
  });

  describe('Role Management', () => {
    it('should allow owner to change participant roles', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const roleButton = screen.getByTestId('role-button-participant-2');
      fireEvent.press(roleButton);
      
      expect(screen.getByText('Change Role')).toBeTruthy();
      expect(screen.getByText('OWNER')).toBeTruthy();
      expect(screen.getByText('COLLABORATOR')).toBeTruthy();
      expect(screen.getByText('VIEWER')).toBeTruthy();
    });

    it('should update role when new role is selected', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const roleButton = screen.getByTestId('role-button-participant-2');
      fireEvent.press(roleButton);
      
      const viewerRole = screen.getByText('VIEWER');
      fireEvent.press(viewerRole);
      
      expect(mockProps.onUpdateRole).toHaveBeenCalledWith('participant-2', 'VIEWER');
    });

    it('should not allow participants to change their own role', () => {
      const collaboratorProps = { ...mockProps, currentUserId: 'user-2' };
      render(<CollaborationManager {...collaboratorProps} />);
      
      const roleButton = screen.queryByTestId('role-button-participant-2');
      expect(roleButton).toBeNull();
    });

    it('should not allow non-owners to change other roles', () => {
      const collaboratorProps = { ...mockProps, currentUserId: 'user-2' };
      render(<CollaborationManager {...collaboratorProps} />);
      
      const ownerRoleButton = screen.queryByTestId('role-button-participant-1');
      expect(ownerRoleButton).toBeNull();
    });

    it('should show permission details for each role', async () => {
      render(<CollaborationManager {...mockProps} />);
      
      const roleButton = screen.getByTestId('role-button-participant-2');
      fireEvent.press(roleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Full access to trip management')).toBeTruthy(); // OWNER permissions
        expect(screen.getByText('Can edit trip details and invite others')).toBeTruthy(); // COLLABORATOR permissions
        expect(screen.getByText('Can view trip details only')).toBeTruthy(); // VIEWER permissions
      });
    });
  });

  describe('Participant Management', () => {
    it('should allow owner to remove participants', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const removeButton = screen.getByTestId('remove-button-participant-2');
      fireEvent.press(removeButton);
      
      expect(screen.getByText('Remove Participant')).toBeTruthy();
      expect(screen.getByText('Are you sure you want to remove Active Collaborator from this trip?')).toBeTruthy();
    });

    it('should confirm participant removal', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const removeButton = screen.getByTestId('remove-button-participant-2');
      fireEvent.press(removeButton);
      
      const confirmButton = screen.getByText('Remove');
      fireEvent.press(confirmButton);
      
      expect(mockProps.onRemoveParticipant).toHaveBeenCalledWith('participant-2');
    });

    it('should not show remove button for owner', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const ownerRemoveButton = screen.queryByTestId('remove-button-participant-1');
      expect(ownerRemoveButton).toBeNull();
    });

    it('should allow collaborators to remove themselves', () => {
      const collaboratorProps = { ...mockProps, currentUserId: 'user-2' };
      render(<CollaborationManager {...collaboratorProps} />);
      
      const leaveButton = screen.getByTestId('leave-trip-button');
      expect(leaveButton).toBeTruthy();
      
      fireEvent.press(leaveButton);
      expect(screen.getByText('Leave Trip')).toBeTruthy();
    });
  });

  describe('Invitation Management', () => {
    it('should show pending invitations section', () => {
      const propsWithInvitations = { ...mockProps, pendingInvitations: mockInvitations };
      render(<CollaborationManager {...propsWithInvitations} />);
      
      expect(screen.getByText('Pending Invitations')).toBeTruthy();
      expect(screen.getByText('pending@example.com')).toBeTruthy();
      expect(screen.getByText('Invited by Trip Owner')).toBeTruthy();
    });

    it('should allow resending invitations', () => {
      const propsWithInvitations = { ...mockProps, pendingInvitations: mockInvitations };
      render(<CollaborationManager {...propsWithInvitations} />);
      
      const resendButton = screen.getByTestId('resend-invitation-invitation-1');
      fireEvent.press(resendButton);
      
      expect(mockProps.onResendInvitation).toHaveBeenCalledWith('invitation-1');
    });

    it('should allow canceling invitations', () => {
      const propsWithInvitations = { ...mockProps, pendingInvitations: mockInvitations };
      render(<CollaborationManager {...propsWithInvitations} />);
      
      const cancelButton = screen.getByTestId('cancel-invitation-invitation-1');
      fireEvent.press(cancelButton);
      
      expect(mockProps.onCancelInvitation).toHaveBeenCalledWith('invitation-1');
    });

    it('should show invitation expiry information', () => {
      const propsWithInvitations = { ...mockProps, pendingInvitations: mockInvitations };
      render(<CollaborationManager {...propsWithInvitations} />);
      
      expect(screen.getByText('Expires Jan 10, 2024')).toBeTruthy();
    });
  });

  describe('Invite New Participant', () => {
    it('should show invite participant form', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const inviteButton = screen.getByText('Invite Participant');
      fireEvent.press(inviteButton);
      
      expect(screen.getByText('Invite New Participant')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter email address')).toBeTruthy();
    });

    it('should validate email format', async () => {
      render(<CollaborationManager {...mockProps} />);
      
      const inviteButton = screen.getByText('Invite Participant');
      fireEvent.press(inviteButton);
      
      const emailInput = screen.getByPlaceholderText('Enter email address');
      fireEvent.changeText(emailInput, 'invalid-email');
      
      const sendButton = screen.getByText('Send Invitation');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });
    });

    it('should allow role selection for invitation', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const inviteButton = screen.getByText('Invite Participant');
      fireEvent.press(inviteButton);
      
      expect(screen.getByText('Role')).toBeTruthy();
      expect(screen.getByText('COLLABORATOR')).toBeTruthy();
      expect(screen.getByText('VIEWER')).toBeTruthy();
    });

    it('should send invitation with correct details', async () => {
      render(<CollaborationManager {...mockProps} />);
      
      const inviteButton = screen.getByText('Invite Participant');
      fireEvent.press(inviteButton);
      
      const emailInput = screen.getByPlaceholderText('Enter email address');
      fireEvent.changeText(emailInput, 'newuser@example.com');
      
      const viewerRole = screen.getByText('VIEWER');
      fireEvent.press(viewerRole);
      
      const sendButton = screen.getByText('Send Invitation');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(mockProps.onInviteParticipant).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          role: 'VIEWER'
        });
      });
    });

    it('should close form after successful invitation', async () => {
      render(<CollaborationManager {...mockProps} />);
      
      const inviteButton = screen.getByText('Invite Participant');
      fireEvent.press(inviteButton);
      
      const emailInput = screen.getByPlaceholderText('Enter email address');
      fireEvent.changeText(emailInput, 'newuser@example.com');
      
      const sendButton = screen.getByText('Send Invitation');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Invite New Participant')).toBeNull();
      });
    });
  });

  describe('Permission Display', () => {
    it('should show permission badges for each participant', () => {
      render(<CollaborationManager {...mockProps} />);
      
      // Owner permissions
      expect(screen.getByText('Can manage')).toBeTruthy();
      expect(screen.getByText('Full access')).toBeTruthy();
      
      // Collaborator permissions  
      expect(screen.getByText('Can edit')).toBeTruthy();
      expect(screen.getByText('Can invite')).toBeTruthy();
      
      // Viewer permissions
      expect(screen.getByText('View only')).toBeTruthy();
    });

    it('should show detailed permissions in expanded view', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const expandButton = screen.getByTestId('expand-permissions-participant-2');
      fireEvent.press(expandButton);
      
      expect(screen.getByText('READ')).toBeTruthy();
      expect(screen.getByText('WRITE')).toBeTruthy();
      expect(screen.getByText('INVITE')).toBeTruthy();
      expect(screen.queryByText('DELETE')).toBeNull();
      expect(screen.queryByText('MANAGE_ROLES')).toBeNull();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time participant updates', () => {
      const { rerender } = render(<CollaborationManager {...mockProps} />);
      
      const updatedParticipants = [
        ...mockParticipants,
        {
          id: 'participant-4',
          userId: 'user-4',
          tripId: 'trip-1',
          role: 'COLLABORATOR' as CollaborationRole,
          status: 'ACCEPTED',
          permissions: ['READ', 'WRITE'] as CollaborationPermissions[],
          email: 'newuser@example.com',
          name: 'New User',
          joinedAt: '2024-01-04T00:00:00Z',
          avatar: null
        }
      ];
      
      rerender(<CollaborationManager {...mockProps} participants={updatedParticipants} />);
      
      expect(screen.getByText('New User')).toBeTruthy();
      expect(screen.getByText('newuser@example.com')).toBeTruthy();
    });

    it('should handle participant status changes', () => {
      const { rerender } = render(<CollaborationManager {...mockProps} />);
      
      const updatedParticipants = mockParticipants.map(p => 
        p.id === 'participant-3' 
          ? { ...p, status: 'ACCEPTED', joinedAt: '2024-01-04T00:00:00Z' }
          : p
      );
      
      rerender(<CollaborationManager {...mockProps} participants={updatedParticipants} />);
      
      expect(screen.getAllByText('ACCEPTED')).toHaveLength(3);
      expect(screen.queryByText('PENDING')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal.props.accessibilityLabel).toBe('Collaboration management');
      
      const inviteButton = screen.getByLabelText('Invite new participant');
      expect(inviteButton).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      render(<CollaborationManager {...mockProps} />);
      
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element.props.accessible).toBe(true);
      });
    });

    it('should announce role changes', async () => {
      render(<CollaborationManager {...mockProps} />);
      
      const roleButton = screen.getByTestId('role-button-participant-2');
      fireEvent.press(roleButton);
      
      const viewerRole = screen.getByText('VIEWER');
      fireEvent.press(viewerRole);
      
      await waitFor(() => {
        const announcement = screen.getByLabelText('Role changed to VIEWER');
        expect(announcement).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invitation errors gracefully', async () => {
      const errorProps = {
        ...mockProps,
        onInviteParticipant: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      
      render(<CollaborationManager {...errorProps} />);
      
      const inviteButton = screen.getByText('Invite Participant');
      fireEvent.press(inviteButton);
      
      const emailInput = screen.getByPlaceholderText('Enter email address');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Send Invitation');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to send invitation. Please try again.')).toBeTruthy();
      });
    });

    it('should handle role update errors', async () => {
      const errorProps = {
        ...mockProps,
        onUpdateRole: jest.fn().mockRejectedValue(new Error('Permission denied'))
      };
      
      render(<CollaborationManager {...errorProps} />);
      
      const roleButton = screen.getByTestId('role-button-participant-2');
      fireEvent.press(roleButton);
      
      const viewerRole = screen.getByText('VIEWER');
      fireEvent.press(viewerRole);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to update role. Please check permissions.')).toBeTruthy();
      });
    });

    it('should handle participant removal errors', async () => {
      const errorProps = {
        ...mockProps,
        onRemoveParticipant: jest.fn().mockRejectedValue(new Error('Cannot remove'))
      };
      
      render(<CollaborationManager {...errorProps} />);
      
      const removeButton = screen.getByTestId('remove-button-participant-2');
      fireEvent.press(removeButton);
      
      const confirmButton = screen.getByText('Remove');
      fireEvent.press(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to remove participant. Please try again.')).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large participant lists efficiently', () => {
      const largeParticipantList = Array.from({ length: 100 }, (_, index) => ({
        id: `participant-${index}`,
        userId: `user-${index}`,
        tripId: 'trip-1',
        role: 'VIEWER' as CollaborationRole,
        status: 'ACCEPTED',
        permissions: ['READ'] as CollaborationPermissions[],
        email: `user${index}@example.com`,
        name: `User ${index}`,
        joinedAt: '2024-01-01T00:00:00Z',
        avatar: null
      }));
      
      const { container } = render(
        <CollaborationManager {...mockProps} participants={largeParticipantList} />
      );
      
      expect(container).toBeTruthy();
      expect(screen.getByText('User 0')).toBeTruthy();
      expect(screen.getByText('User 99')).toBeTruthy();
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<CollaborationManager {...mockProps} />);
      
      expect(() => unmount()).not.toThrow();
    });
  });
});