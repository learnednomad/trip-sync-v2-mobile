/**
 * Quick Plan Modal Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Rapid trip planning with AI-assisted suggestions
 */

import React, { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';

import type { TripType } from '@/api/trips/types';
import { Button } from '@/components/ui/button';
import { DollarSign, Sparkles, Users, X } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

import { DatePicker } from './DatePicker';

interface QuickPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: QuickPlanData) => void;
}

interface QuickPlanData {
  destination: string;
  tripType: TripType;
  startDate: string;
  endDate: string;
  budget: number;
  participants: number;
  preferences: string[];
}

const tripTypeOptions: { label: string; value: TripType; icon: string }[] = [
  { label: 'Business', value: 'BUSINESS', icon: '💼' },
  { label: 'Leisure', value: 'LEISURE', icon: '🏖️' },
  { label: 'Family', value: 'FAMILY', icon: '👨‍👩‍👧‍👦' },
  { label: 'Adventure', value: 'ADVENTURE', icon: '🏔️' },
  { label: 'Romantic', value: 'ROMANTIC', icon: '💕' },
  { label: 'Educational', value: 'EDUCATIONAL', icon: '📚' },
  { label: 'Cultural', value: 'CULTURAL', icon: '🏛️' },
  { label: 'Wellness', value: 'WELLNESS', icon: '🧘‍♀️' },
];

const popularDestinations = [
  'New York',
  'London',
  'Tokyo',
  'Paris',
  'Barcelona',
  'Dubai',
  'Singapore',
  'Rome',
  'Sydney',
  'San Francisco',
  'Berlin',
  'Amsterdam',
];

const commonPreferences = [
  'Budget-friendly',
  'Luxury',
  'Local experiences',
  'Food & dining',
  'Nightlife',
  'Museums',
  'Nature',
  'Shopping',
  'Photography',
  'Relaxation',
  'Adventure sports',
  'Historical sites',
];

export function QuickPlanModal({
  visible,
  onClose,
  onCreateTrip,
}: QuickPlanModalProps) {
  const [planData, setPlanData] = useState<Partial<QuickPlanData>>({
    tripType: 'LEISURE',
    participants: 2,
    budget: 1000,
    preferences: [],
  });

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePreferenceToggle = (preference: string) => {
    const preferences = planData.preferences || [];
    const newPreferences = preferences.includes(preference)
      ? preferences.filter((p) => p !== preference)
      : [...preferences, preference];

    setPlanData((prev) => ({ ...prev, preferences: newPreferences }));
  };

  const handleCreateTrip = () => {
    if (isFormValid()) {
      onCreateTrip(planData as QuickPlanData);
      onClose();
      // Reset form
      setPlanData({
        tripType: 'LEISURE',
        participants: 2,
        budget: 1000,
        preferences: [],
      });
      setStep(1);
    }
  };

  const isFormValid = () => {
    return (
      planData.destination &&
      planData.startDate &&
      planData.endDate &&
      planData.tripType
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return planData.destination && planData.tripType;
      case 2:
        return planData.startDate && planData.endDate;
      case 3:
        return true; // Budget is optional
      case 4:
        return true; // Preferences are optional
      default:
        return false;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="border-b border-gray-100 px-4 py-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Sparkles width={24} height={24} color="#2563EB" />
              <Text className="ml-2 text-xl font-bold text-gray-900">
                Quick Plan
              </Text>
            </View>
            <Button variant="ghost" size="sm" onPress={onClose} className="p-2">
              <X width={24} height={24} color="#6B7280" />
            </Button>
          </View>

          {/* Progress Bar */}
          <View className="mt-4 flex-row items-center">
            {Array.from({ length: totalSteps }, (_, index) => (
              <View key={index} className="flex-1 flex-row items-center">
                <View
                  className={`h-2 flex-1 rounded-full ${
                    index + 1 <= step ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
                {index < totalSteps - 1 && <View className="w-2" />}
              </View>
            ))}
          </View>
          <Text className="mt-2 text-sm text-gray-500">
            Step {step} of {totalSteps}
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Step 1: Destination & Type */}
          {step === 1 && (
            <View className="space-y-6">
              <View>
                <Text className="mb-4 text-lg font-semibold text-gray-900">
                  Where would you like to go?
                </Text>

                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    Destination
                  </Text>
                  <Input
                    placeholder="Enter destination"
                    value={planData.destination || ''}
                    onChangeText={(value) =>
                      setPlanData((prev) => ({ ...prev, destination: value }))
                    }
                    className="mb-2"
                  />

                  <Text className="mb-2 text-xs text-gray-500">
                    Popular destinations:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-2">
                      {popularDestinations.map((destination) => (
                        <Button
                          key={destination}
                          variant="outline"
                          size="sm"
                          onPress={() =>
                            setPlanData((prev) => ({ ...prev, destination }))
                          }
                        >
                          <Text className="text-xs text-gray-700">
                            {destination}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    Trip Type
                  </Text>
                  <View className="flex-row flex-wrap">
                    {tripTypeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          planData.tripType === option.value
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onPress={() =>
                          setPlanData((prev) => ({
                            ...prev,
                            tripType: option.value,
                          }))
                        }
                        className="mb-2 mr-2 flex-row items-center"
                      >
                        <Text className="mr-1">{option.icon}</Text>
                        <Text
                          className={
                            planData.tripType === option.value
                              ? 'text-xs text-white'
                              : 'text-xs text-gray-700'
                          }
                        >
                          {option.label}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
            <View className="space-y-6">
              <Text className="mb-4 text-lg font-semibold text-gray-900">
                When are you traveling?
              </Text>

              <View className="space-y-4">
                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    Travel Dates
                  </Text>
                  <DatePicker
                    startDate={planData.startDate}
                    endDate={planData.endDate}
                    onStartDateChange={(date: string) =>
                      setPlanData((prev) => ({ ...prev, startDate: date }))
                    }
                    onEndDateChange={(date: string) =>
                      setPlanData((prev) => ({ ...prev, endDate: date }))
                    }
                  />
                </View>
              </View>

              {planData.startDate && planData.endDate && (
                <View className="rounded-lg bg-blue-50 p-3">
                  <Text className="text-sm text-blue-800">
                    Trip duration:{' '}
                    {Math.ceil(
                      (new Date(planData.endDate).getTime() -
                        new Date(planData.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Step 3: Budget & Travelers */}
          {step === 3 && (
            <View className="space-y-6">
              <Text className="mb-4 text-lg font-semibold text-gray-900">
                Trip details
              </Text>

              <View className="space-y-4">
                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    <DollarSign width={14} height={14} color="#6B7280" /> Budget
                    (USD)
                  </Text>
                  <Input
                    placeholder="Enter total budget"
                    value={planData.budget?.toString() || ''}
                    onChangeText={(value) =>
                      setPlanData((prev) => ({
                        ...prev,
                        budget: parseInt(value) || 0,
                      }))
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    <Users width={14} height={14} color="#6B7280" /> Number of
                    travelers
                  </Text>
                  <View className="flex-row space-x-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <Button
                        key={num}
                        variant={
                          planData.participants === num ? 'default' : 'outline'
                        }
                        size="sm"
                        onPress={() =>
                          setPlanData((prev) => ({
                            ...prev,
                            participants: num,
                          }))
                        }
                        className="w-12"
                      >
                        <Text
                          className={
                            planData.participants === num
                              ? 'text-white'
                              : 'text-gray-700'
                          }
                        >
                          {num}
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <View className="space-y-6">
              <Text className="mb-4 text-lg font-semibold text-gray-900">
                What interests you? (Optional)
              </Text>

              <View className="flex-row flex-wrap">
                {commonPreferences.map((preference) => (
                  <Button
                    key={preference}
                    variant={
                      planData.preferences?.includes(preference)
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onPress={() => handlePreferenceToggle(preference)}
                    className="mb-2 mr-2"
                  >
                    <Text
                      className={
                        planData.preferences?.includes(preference)
                          ? 'text-xs text-white'
                          : 'text-xs text-gray-700'
                      }
                    >
                      {preference}
                    </Text>
                  </Button>
                ))}
              </View>

              <View className="mt-6 rounded-lg bg-gray-50 p-4">
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Trip Summary
                </Text>
                <Text className="text-sm text-gray-600">
                  📍 {planData.destination} • {planData.tripType?.toLowerCase()}{' '}
                  trip
                </Text>
                <Text className="text-sm text-gray-600">
                  📅 {planData.startDate} to {planData.endDate}
                </Text>
                <Text className="text-sm text-gray-600">
                  💰 ${planData.budget} • {planData.participants} travelers
                </Text>
                {planData.preferences && planData.preferences.length > 0 && (
                  <Text className="text-sm text-gray-600">
                    ✨ {planData.preferences.slice(0, 3).join(', ')}
                    {planData.preferences.length > 3 &&
                      ` +${planData.preferences.length - 3} more`}
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="border-t border-gray-100 p-4">
          <View className="flex-row space-x-3">
            {step > 1 && (
              <Button variant="outline" onPress={handleBack} className="flex-1">
                <Text className="text-gray-700">Back</Text>
              </Button>
            )}

            {step < totalSteps ? (
              <Button
                onPress={handleNext}
                disabled={!canProceed()}
                className={`flex-1 ${canProceed() ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <Text className="text-white">Next</Text>
              </Button>
            ) : (
              <Button
                onPress={handleCreateTrip}
                disabled={!isFormValid()}
                className={`flex-1 ${isFormValid() ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <Text className="text-white">Create Trip</Text>
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
