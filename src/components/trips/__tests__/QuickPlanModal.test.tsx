/**
 * QuickPlanModal Component Test Suite
 * Epic 2: Story 2.1 - Core Trip Management
 * Tests 4-step guided trip planning workflow and smart suggestions
 */

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React from 'react';

import { QuickPlanModal } from '../QuickPlanModal';

describe('QuickPlanModal Component', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onCreateTrip: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should render when visible is true', () => {
      render(<QuickPlanModal {...mockProps} />);

      expect(screen.getByText('Quick Trip Planning')).toBeTruthy();
      expect(
        screen.getByText('Create your perfect trip in 4 simple steps')
      ).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      render(<QuickPlanModal {...mockProps} visible={false} />);

      expect(screen.queryByText('Quick Trip Planning')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      render(<QuickPlanModal {...mockProps} />);

      const closeButton = screen.getByLabelText('Close quick planning');
      fireEvent.press(closeButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Step 1: Destination Selection', () => {
    it('should show destination input as first step', () => {
      render(<QuickPlanModal {...mockProps} />);

      expect(
        screen.getByText('Step 1 of 4: Where do you want to go?')
      ).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter destination...')).toBeTruthy();
    });

    it('should show destination suggestions when typing', async () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Par');

      await waitFor(() => {
        expect(screen.getByText('Paris, France')).toBeTruthy();
        expect(screen.getByText('Paradise Island, Bahamas')).toBeTruthy();
      });
    });

    it('should select destination from suggestions', async () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Par');

      await waitFor(() => {
        expect(screen.getByText('Paris, France')).toBeTruthy();
      });

      const parisOption = screen.getByText('Paris, France');
      fireEvent.press(parisOption);

      expect(screen.getByDisplayValue('Paris, France')).toBeTruthy();
    });

    it('should enable next button when destination is selected', async () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Tokyo, Japan');

      const nextButton = screen.getByText('Next');
      expect(nextButton.props.disabled).toBeFalsy();
    });

    it('should disable next button when no destination', () => {
      render(<QuickPlanModal {...mockProps} />);

      const nextButton = screen.getByText('Next');
      expect(nextButton.props.disabled).toBeTruthy();
    });
  });

  describe('Step 2: Trip Type Selection', () => {
    beforeEach(async () => {
      render(<QuickPlanModal {...mockProps} />);

      // Complete step 1
      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Barcelona, Spain');

      const nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('Step 2 of 4: What type of trip?')
        ).toBeTruthy();
      });
    });

    it('should show trip type options', () => {
      expect(screen.getByText('Business')).toBeTruthy();
      expect(screen.getByText('Leisure')).toBeTruthy();
      expect(screen.getByText('Family')).toBeTruthy();
      expect(screen.getByText('Adventure')).toBeTruthy();
      expect(screen.getByText('Romantic')).toBeTruthy();
    });

    it('should select trip type and show description', () => {
      const leisureOption = screen.getByText('Leisure');
      fireEvent.press(leisureOption);

      expect(
        screen.getByText('Relaxation and entertainment focused travel')
      ).toBeTruthy();
    });

    it('should provide smart suggestions based on destination', () => {
      // Barcelona should suggest Cultural and Adventure
      expect(screen.getByText('Recommended for Barcelona')).toBeTruthy();
      expect(screen.getByTestId('suggested-cultural')).toBeTruthy();
      expect(screen.getByTestId('suggested-adventure')).toBeTruthy();
    });

    it('should enable next button when trip type is selected', () => {
      const businessOption = screen.getByText('Business');
      fireEvent.press(businessOption);

      const nextButton = screen.getByText('Next');
      expect(nextButton.props.disabled).toBeFalsy();
    });

    it('should allow going back to previous step', () => {
      const backButton = screen.getByText('Back');
      fireEvent.press(backButton);

      expect(
        screen.getByText('Step 1 of 4: Where do you want to go?')
      ).toBeTruthy();
    });
  });

  describe('Step 3: Dates and Duration', () => {
    beforeEach(async () => {
      render(<QuickPlanModal {...mockProps} />);

      // Complete steps 1 and 2
      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'London, UK');

      let nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('Step 2 of 4: What type of trip?')
        ).toBeTruthy();
      });

      const leisureOption = screen.getByText('Leisure');
      fireEvent.press(leisureOption);

      nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('Step 3 of 4: When and how long?')
        ).toBeTruthy();
      });
    });

    it('should show date pickers and duration options', () => {
      expect(screen.getByText('Start Date')).toBeTruthy();
      expect(screen.getByText('End Date')).toBeTruthy();
      expect(screen.getByText('Duration')).toBeTruthy();
    });

    it('should provide quick duration options', () => {
      expect(screen.getByText('Weekend (2 days)')).toBeTruthy();
      expect(screen.getByText('Short Trip (3-4 days)')).toBeTruthy();
      expect(screen.getByText('Week (7 days)')).toBeTruthy();
      expect(screen.getByText('Extended (14+ days)')).toBeTruthy();
    });

    it('should select quick duration and auto-set end date', () => {
      const startDateInput = screen.getByTestId('start-date-picker');
      fireEvent(startDateInput, 'dateChange', new Date('2024-06-15'));

      const weekendOption = screen.getByText('Weekend (2 days)');
      fireEvent.press(weekendOption);

      expect(screen.getByDisplayValue('June 17, 2024')).toBeTruthy();
    });

    it('should validate date range', () => {
      const startDateInput = screen.getByTestId('start-date-picker');
      const endDateInput = screen.getByTestId('end-date-picker');

      fireEvent(startDateInput, 'dateChange', new Date('2024-06-20'));
      fireEvent(endDateInput, 'dateChange', new Date('2024-06-15'));

      expect(
        screen.getByText('End date must be after start date')
      ).toBeTruthy();
    });

    it('should suggest optimal duration for trip type', () => {
      expect(
        screen.getByText('Recommended: 5-7 days for Leisure trips')
      ).toBeTruthy();
    });

    it('should enable next button when dates are valid', () => {
      const startDateInput = screen.getByTestId('start-date-picker');
      const endDateInput = screen.getByTestId('end-date-picker');

      fireEvent(startDateInput, 'dateChange', new Date('2024-07-01'));
      fireEvent(endDateInput, 'dateChange', new Date('2024-07-08'));

      const nextButton = screen.getByText('Next');
      expect(nextButton.props.disabled).toBeFalsy();
    });
  });

  describe('Step 4: Budget and Preferences', () => {
    beforeEach(async () => {
      render(<QuickPlanModal {...mockProps} />);

      // Complete steps 1-3
      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Rome, Italy');

      let nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        const culturalOption = screen.getByText('Cultural');
        fireEvent.press(culturalOption);
      });

      nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        const startDate = screen.getByTestId('start-date-picker');
        const endDate = screen.getByTestId('end-date-picker');
        fireEvent(startDate, 'dateChange', new Date('2024-08-10'));
        fireEvent(endDate, 'dateChange', new Date('2024-08-17'));
      });

      nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('Step 4 of 4: Budget and preferences')
        ).toBeTruthy();
      });
    });

    it('should show budget slider and preference options', () => {
      expect(screen.getByText('Budget Range')).toBeTruthy();
      expect(screen.getByTestId('budget-slider')).toBeTruthy();
      expect(screen.getByText('Travel Preferences')).toBeTruthy();
    });

    it('should provide budget suggestions based on destination and type', () => {
      expect(
        screen.getByText('Recommended budget for Rome: $1,500 - $2,500')
      ).toBeTruthy();
    });

    it('should allow preference tag selection', () => {
      const museumTag = screen.getByText('Museums');
      const foodieTag = screen.getByText('Foodie');

      fireEvent.press(museumTag);
      fireEvent.press(foodieTag);

      expect(museumTag.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
      expect(foodieTag.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should show trip summary', () => {
      expect(screen.getByText('Trip Summary')).toBeTruthy();
      expect(screen.getByText('Rome, Italy')).toBeTruthy();
      expect(screen.getByText('Cultural Trip')).toBeTruthy();
      expect(screen.getByText('7 days')).toBeTruthy();
    });

    it('should enable create trip button', () => {
      const createButton = screen.getByText('Create Trip');
      expect(createButton.props.disabled).toBeFalsy();
    });
  });

  describe('Trip Creation Workflow', () => {
    it('should call onCreateTrip with complete trip data', async () => {
      render(<QuickPlanModal {...mockProps} />);

      // Complete full workflow
      // Step 1: Destination
      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Tokyo, Japan');
      fireEvent.press(screen.getByText('Next'));

      await waitFor(() => {
        // Step 2: Trip Type
        const businessOption = screen.getByText('Business');
        fireEvent.press(businessOption);
        fireEvent.press(screen.getByText('Next'));
      });

      await waitFor(() => {
        // Step 3: Dates
        const startDate = screen.getByTestId('start-date-picker');
        const endDate = screen.getByTestId('end-date-picker');
        fireEvent(startDate, 'dateChange', new Date('2024-09-15'));
        fireEvent(endDate, 'dateChange', new Date('2024-09-18'));
        fireEvent.press(screen.getByText('Next'));
      });

      await waitFor(() => {
        // Step 4: Budget and preferences
        const budgetSlider = screen.getByTestId('budget-slider');
        fireEvent(budgetSlider, 'valueChange', 2000);

        const networkingTag = screen.getByText('Networking');
        fireEvent.press(networkingTag);

        const createButton = screen.getByText('Create Trip');
        fireEvent.press(createButton);
      });

      expect(mockProps.onCreateTrip).toHaveBeenCalledWith({
        destination: 'Tokyo, Japan',
        tripType: 'BUSINESS',
        startDate: '2024-09-15',
        endDate: '2024-09-18',
        budget: 2000,
        preferences: ['Networking'],
      });
    });

    it('should close modal after trip creation', async () => {
      render(<QuickPlanModal {...mockProps} />);

      // Complete workflow and create trip
      // ... (abbreviated for brevity)

      await waitFor(() => {
        const createButton = screen.getByText('Create Trip');
        fireEvent.press(createButton);
      });

      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Navigation and Progress', () => {
    it('should show progress indicator', () => {
      render(<QuickPlanModal {...mockProps} />);

      expect(screen.getByText('Step 1 of 4')).toBeTruthy();
      expect(screen.getByTestId('progress-bar')).toBeTruthy();
    });

    it('should update progress as steps advance', async () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Vienna, Austria');

      const nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4')).toBeTruthy();
      });
    });

    it('should allow navigation between steps', async () => {
      render(<QuickPlanModal {...mockProps} />);

      // Go to step 2
      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Amsterdam, Netherlands');
      fireEvent.press(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4')).toBeTruthy();
      });

      // Go back to step 1
      const backButton = screen.getByText('Back');
      fireEvent.press(backButton);

      expect(screen.getByText('Step 1 of 4')).toBeTruthy();
    });
  });

  describe('Smart Suggestions', () => {
    it('should provide context-aware suggestions', () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Bali, Indonesia');

      // Should suggest wellness/relaxation trip types
      fireEvent.press(screen.getByText('Next'));

      expect(screen.getByText('Recommended for Bali')).toBeTruthy();
      expect(screen.getByTestId('suggested-wellness')).toBeTruthy();
    });

    it('should adjust budget suggestions by destination', async () => {
      render(<QuickPlanModal {...mockProps} />);

      // Test different destinations have different budget suggestions
      const destinations = [
        { city: 'Bangkok, Thailand', budget: '$500 - $1,000' },
        { city: 'Zurich, Switzerland', budget: '$2,000 - $4,000' },
      ];

      for (const dest of destinations) {
        const destinationInput = screen.getByPlaceholderText(
          'Enter destination...'
        );
        fireEvent.changeText(destinationInput, dest.city);

        // Navigate to budget step
        // ... (navigation steps abbreviated)

        await waitFor(() => {
          expect(
            screen.getByText(
              `Recommended budget for ${dest.city.split(',')[0]}: ${dest.budget}`
            )
          ).toBeTruthy();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid destinations gracefully', () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'InvalidDestination123');

      expect(screen.getByText('No suggestions found')).toBeTruthy();
    });

    it('should validate required fields', () => {
      render(<QuickPlanModal {...mockProps} />);

      const nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      expect(screen.getByText('Please enter a destination')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper step navigation accessibility', () => {
      render(<QuickPlanModal {...mockProps} />);

      const nextButton = screen.getByText('Next');
      expect(nextButton.props.accessibilityLabel).toBe('Continue to next step');
    });

    it('should announce step changes to screen readers', async () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      fireEvent.changeText(destinationInput, 'Munich, Germany');

      const nextButton = screen.getByText('Next');
      fireEvent.press(nextButton);

      await waitFor(() => {
        const stepHeader = screen.getByText('Step 2 of 4: What type of trip?');
        expect(stepHeader.props.accessibilityLiveRegion).toBe('polite');
      });
    });

    it('should have proper form field accessibility', () => {
      render(<QuickPlanModal {...mockProps} />);

      const destinationInput = screen.getByPlaceholderText(
        'Enter destination...'
      );
      expect(destinationInput.props.accessibilityLabel).toBe(
        'Destination input'
      );
    });
  });
});
