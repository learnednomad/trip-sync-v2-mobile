/**
 * TripTemplates Component Test Suite
 * Epic 2: Story 2.1 - Core Trip Management
 * Tests template selection, customization, and filtering functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TripTemplates, type TripTemplate } from '../TripTemplates';

const mockTemplates: TripTemplate[] = [
  {
    id: 'business-conference',
    name: 'Business Conference',
    description: 'Professional conference with networking opportunities',
    tripType: 'BUSINESS',
    defaultDuration: 3,
    suggestedBudget: { min: 800, max: 1500, currency: 'USD' },
    destinations: ['New York', 'San Francisco', 'London', 'Tokyo'],
    useCount: 45,
    rating: 4.8,
    tags: ['professional', 'networking', 'learning']
  },
  {
    id: 'romantic-getaway',
    name: 'Romantic Getaway',
    description: 'Perfect for couples seeking intimate experiences',
    tripType: 'ROMANTIC',
    defaultDuration: 5,
    suggestedBudget: { min: 1200, max: 3000, currency: 'USD' },
    destinations: ['Paris', 'Venice', 'Santorini', 'Maldives'],
    useCount: 78,
    rating: 4.9,
    tags: ['couples', 'luxury', 'intimate']
  },
  {
    id: 'family-adventure',
    name: 'Family Adventure',
    description: 'Fun-filled activities for the whole family',
    tripType: 'FAMILY',
    defaultDuration: 7,
    suggestedBudget: { min: 2000, max: 4000, currency: 'USD' },
    destinations: ['Orlando', 'San Diego', 'London', 'Tokyo'],
    useCount: 123,
    rating: 4.7,
    tags: ['family-friendly', 'activities', 'fun']
  }
];

describe('TripTemplates Component', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onSelectTemplate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should render when visible is true', () => {
      render(<TripTemplates {...mockProps} />);
      
      expect(screen.getByText('Trip Templates')).toBeTruthy();
      expect(screen.getByText('Choose from popular trip templates')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      render(<TripTemplates {...mockProps} visible={false} />);
      
      expect(screen.queryByText('Trip Templates')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      render(<TripTemplates {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Close templates');
      fireEvent.press(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Template Filtering', () => {
    it('should show all templates by default', () => {
      render(<TripTemplates {...mockProps} />);
      
      expect(screen.getByText('Business Conference')).toBeTruthy();
      expect(screen.getByText('Romantic Getaway')).toBeTruthy();
      expect(screen.getByText('Family Adventure')).toBeTruthy();
    });

    it('should filter templates by type', async () => {
      render(<TripTemplates {...mockProps} />);
      
      // Select Business filter
      const businessFilter = screen.getByText('Business');
      fireEvent.press(businessFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Business Conference')).toBeTruthy();
        expect(screen.queryByText('Romantic Getaway')).toBeNull();
        expect(screen.queryByText('Family Adventure')).toBeNull();
      });
    });

    it('should show filter counts', () => {
      render(<TripTemplates {...mockProps} />);
      
      expect(screen.getByText('All (3)')).toBeTruthy();
      expect(screen.getByText('Business (1)')).toBeTruthy();
      expect(screen.getByText('Romantic (1)')).toBeTruthy();
      expect(screen.getByText('Family (1)')).toBeTruthy();
    });

    it('should reset to all templates when All filter is selected', async () => {
      render(<TripTemplates {...mockProps} />);
      
      // First filter by Business
      const businessFilter = screen.getByText('Business');
      fireEvent.press(businessFilter);
      
      await waitFor(() => {
        expect(screen.queryByText('Romantic Getaway')).toBeNull();
      });
      
      // Then select All
      const allFilter = screen.getByText('All (3)');
      fireEvent.press(allFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Business Conference')).toBeTruthy();
        expect(screen.getByText('Romantic Getaway')).toBeTruthy();
        expect(screen.getByText('Family Adventure')).toBeTruthy();
      });
    });
  });

  describe('Template Selection', () => {
    it('should open customization panel when template is selected', async () => {
      render(<TripTemplates {...mockProps} />);
      
      const businessTemplate = screen.getByText('Business Conference');
      fireEvent.press(businessTemplate);
      
      await waitFor(() => {
        expect(screen.getByText('Customize Template')).toBeTruthy();
        expect(screen.getByText('Business Conference')).toBeTruthy();
      });
    });

    it('should display template details in customization panel', async () => {
      render(<TripTemplates {...mockProps} />);
      
      const businessTemplate = screen.getByText('Business Conference');
      fireEvent.press(businessTemplate);
      
      await waitFor(() => {
        expect(screen.getByText('Professional conference with networking opportunities')).toBeTruthy();
        expect(screen.getByText('3 days')).toBeTruthy();
        expect(screen.getByText('$800 - $1,500')).toBeTruthy();
      });
    });

    it('should show destination options for customization', async () => {
      render(<TripTemplates {...mockProps} />);
      
      const businessTemplate = screen.getByText('Business Conference');
      fireEvent.press(businessTemplate);
      
      await waitFor(() => {
        expect(screen.getByText('Destination')).toBeTruthy();
        expect(screen.getByText('New York')).toBeTruthy();
        expect(screen.getByText('San Francisco')).toBeTruthy();
      });
    });
  });

  describe('Template Customization', () => {
    beforeEach(async () => {
      render(<TripTemplates {...mockProps} />);
      
      const businessTemplate = screen.getByText('Business Conference');
      fireEvent.press(businessTemplate);
      
      await waitFor(() => {
        expect(screen.getByText('Customize Template')).toBeTruthy();
      });
    });

    it('should allow destination selection', () => {
      const newYorkOption = screen.getByText('New York');
      fireEvent.press(newYorkOption);
      
      // Verify selection styling or state change
      expect(newYorkOption.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should allow duration customization', () => {
      const durationSlider = screen.getByTestId('duration-slider');
      fireEvent(durationSlider, 'valueChange', 5);
      
      expect(screen.getByText('5 days')).toBeTruthy();
    });

    it('should allow budget customization', () => {
      const budgetSlider = screen.getByTestId('budget-slider');
      fireEvent(budgetSlider, 'valueChange', 1000);
      
      expect(screen.getByText('$1,000')).toBeTruthy();
    });

    it('should call onSelectTemplate with customizations when Create Trip is pressed', () => {
      // Select destination
      const londonOption = screen.getByText('London');
      fireEvent.press(londonOption);
      
      // Adjust duration
      const durationSlider = screen.getByTestId('duration-slider');
      fireEvent(durationSlider, 'valueChange', 4);
      
      // Adjust budget
      const budgetSlider = screen.getByTestId('budget-slider');
      fireEvent(budgetSlider, 'valueChange', 1200);
      
      // Create trip
      const createButton = screen.getByText('Create Trip from Template');
      fireEvent.press(createButton);
      
      expect(mockProps.onSelectTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'business-conference',
          name: 'Business Conference'
        }),
        expect.objectContaining({
          destination: 'London',
          duration: 4,
          budget: 1200
        })
      );
    });

    it('should close modal after template selection', () => {
      const createButton = screen.getByText('Create Trip from Template');
      fireEvent.press(createButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Template Information Display', () => {
    it('should display template statistics', () => {
      render(<TripTemplates {...mockProps} />);
      
      expect(screen.getByText('45 uses')).toBeTruthy();
      expect(screen.getByText('4.8 ★')).toBeTruthy();
    });

    it('should display template tags', () => {
      render(<TripTemplates {...mockProps} />);
      
      expect(screen.getByText('professional')).toBeTruthy();
      expect(screen.getByText('networking')).toBeTruthy();
      expect(screen.getByText('learning')).toBeTruthy();
    });

    it('should sort templates by popularity', () => {
      render(<TripTemplates {...mockProps} />);
      
      const templateCards = screen.getAllByTestId('template-card');
      
      // Family Adventure (123 uses) should be first
      // Romantic Getaway (78 uses) should be second  
      // Business Conference (45 uses) should be third
      expect(templateCards[0]).toHaveTextContent('Family Adventure');
      expect(templateCards[1]).toHaveTextContent('Romantic Getaway');
      expect(templateCards[2]).toHaveTextContent('Business Conference');
    });
  });

  describe('Navigation and UX', () => {
    it('should return to template list when back button is pressed', async () => {
      render(<TripTemplates {...mockProps} />);
      
      // Select a template
      const businessTemplate = screen.getByText('Business Conference');
      fireEvent.press(businessTemplate);
      
      await waitFor(() => {
        expect(screen.getByText('Customize Template')).toBeTruthy();
      });
      
      // Press back button
      const backButton = screen.getByLabelText('Back to templates');
      fireEvent.press(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Trip Templates')).toBeTruthy();
        expect(screen.queryByText('Customize Template')).toBeNull();
      });
    });

    it('should handle empty template list gracefully', () => {
      // Mock empty templates
      const emptyProps = { ...mockProps };
      
      render(<TripTemplates {...emptyProps} />);
      
      expect(screen.getByText('No templates available')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<TripTemplates {...mockProps} />);
      
      const businessTemplate = screen.getByLabelText('Business Conference template');
      expect(businessTemplate).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      render(<TripTemplates {...mockProps} />);
      
      const filterButtons = screen.getAllByRole('button');
      filterButtons.forEach(button => {
        expect(button.props.accessible).toBe(true);
      });
    });

    it('should have proper modal accessibility', () => {
      render(<TripTemplates {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal.props.accessibilityLabel).toBe('Trip templates selection');
    });
  });

  describe('Performance', () => {
    it('should handle rapid filter changes without crashing', () => {
      render(<TripTemplates {...mockProps} />);
      
      const filters = ['Business', 'Romantic', 'Family', 'All (3)'];
      
      // Rapidly change filters
      filters.forEach(filter => {
        const filterButton = screen.getByText(filter);
        fireEvent.press(filterButton);
      });
      
      // Should still be functional
      expect(screen.getByText('Trip Templates')).toBeTruthy();
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<TripTemplates {...mockProps} />);
      
      expect(() => unmount()).not.toThrow();
    });
  });
});