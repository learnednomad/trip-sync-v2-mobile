/**
 * Trip Creation Form
 * Epic 2: Story 2.1 - Core Trip Management
 * Acceptance Criteria: Trip Creation with comprehensive details
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, View } from 'react-native';
import { z } from 'zod';

import type { CreateTripRequest } from '@/api/trips/types';
import { useCreateTrip } from '@/api/trips/use-trips';
import { DatePicker } from '@/components/trips/DatePicker';
import { LocationSearch } from '@/components/trips/LocationSearch';
import { TripTypeSelector } from '@/components/trips/TripTypeSelector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Calendar, DollarSign } from '@/components/ui/icons';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Select } from '@/components/ui/select';
import { Text } from '@/components/ui/text';

// Form validation schema
const createTripSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Trip name is required')
      .max(100, 'Trip name too long'),
    description: z.string().optional(),
    destination: z.string().min(1, 'Destination is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    tripType: z.enum([
      'BUSINESS',
      'LEISURE',
      'FAMILY',
      'ADVENTURE',
      'ROMANTIC',
      'EDUCATIONAL',
      'CULTURAL',
      'WELLNESS',
    ]),
    budgetAmount: z.number().min(0, 'Budget must be positive').optional(),
    budgetCurrency: z.string().default('USD'),
    coverImageUrl: z.string().optional(),
    privacy: z.enum(['private', 'shared', 'public']).default('shared'),
    participantEmails: z.array(z.string().email()).optional(),
    settings: z.object({
      visibility: z
        .enum(['public', 'participants', 'private'])
        .default('participants'),
      permissions: z.object({
        canInvite: z.enum(['all', 'admins', 'owner']).default('admins'),
        canEditItinerary: z.enum(['all', 'admins', 'owner']).default('all'),
        canAddExpenses: z.enum(['all', 'admins']).default('all'),
        canSeeExpenses: z.enum(['all', 'involved']).default('all'),
      }),
      notifications: z.object({
        dailyDigest: z.boolean().default(true),
        instantUpdates: z.boolean().default(true),
        reminderDaysBefore: z.number().min(0).max(30).default(7),
      }),
    }),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate >= startDate;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

type CreateTripFormData = z.infer<typeof createTripSchema>;

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'JPY', label: 'Japanese Yen' },
  { value: 'CAD', label: 'Canadian Dollar' },
  { value: 'AUD', label: 'Australian Dollar' },
];

export default function CreateTripScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const createTripMutation = useCreateTrip();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    mode: 'onChange',
    defaultValues: {
      tripType: 'LEISURE',
      budgetCurrency: 'USD',
      privacy: 'shared',
      settings: {
        visibility: 'participants',
        permissions: {
          canInvite: 'admins',
          canEditItinerary: 'all',
          canAddExpenses: 'all',
          canSeeExpenses: 'all',
        },
        notifications: {
          dailyDigest: true,
          instantUpdates: true,
          reminderDaysBefore: 7,
        },
      },
    },
  });

  const watchedStartDate = watch('startDate');
  const watchedPrivacy = watch('privacy');

  const handleCreateTrip = useCallback(
    async (data: CreateTripFormData) => {
      try {
        const tripRequest: CreateTripRequest = {
          name: data.name,
          description: data.description,
          destination: data.destination,
          tripType: data.tripType || 'LEISURE',
          startDate: data.startDate,
          endDate: data.endDate,
          coverImageUrl: data.coverImageUrl,
          budgetAmount: data.budgetAmount,
          budgetCurrency: data.budgetCurrency || 'USD',
          settings: data.settings,
          participantEmails: data.participantEmails,
        };

        const response = await createTripMutation.mutateAsync(tripRequest);

        if (response.success && response.data) {
          Alert.alert(
            'Trip Created!',
            'Your trip has been successfully created.',
            [
              {
                text: 'View Trip',
                onPress: () =>
                  router.replace(`/trips/${response.data!.trip.id}`),
              },
            ]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create trip. Please try again.', [
          { text: 'OK' },
        ]);
      }
    },
    [createTripMutation]
  );

  const steps = [
    { title: 'Basic Details', icon: BookOpen },
    { title: 'Trip Type & Dates', icon: Calendar },
    { title: 'Budget & Settings', icon: DollarSign },
  ];

  const renderBasicDetailsStep = () => (
    <View className="space-y-6">
      {/* Trip Name */}
      <View>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          Trip Name *
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="e.g., Summer Europe Adventure"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />
      </View>

      {/* Description */}
      <View>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          Description
        </Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Brief description of your trip"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top' }}
            />
          )}
        />
      </View>

      {/* Destination */}
      <View>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          Destination *
        </Text>
        <Controller
          control={control}
          name="destination"
          render={({ field: { onChange, value } }) => (
            <LocationSearch
              placeholder="Where are you going?"
              value={value}
              onValueChange={onChange}
              error={errors.destination?.message}
            />
          )}
        />
      </View>

      {/* Cover Image */}
      <View>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          Cover Image
        </Text>
        <Controller
          control={control}
          name="coverImageUrl"
          render={({ field: { onChange, value } }) => (
            <ImagePicker
              imageUri={value}
              onImageSelect={onChange}
              placeholder="Add a cover image for your trip"
            />
          )}
        />
      </View>
    </View>
  );

  const renderTripTypeAndDatesStep = () => (
    <View className="space-y-6">
      {/* Trip Type */}
      <View>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          Trip Type *
        </Text>
        <Controller
          control={control}
          name="tripType"
          render={({ field: { onChange, value } }) => (
            <TripTypeSelector
              selectedType={value}
              onTypeSelect={onChange}
              error={errors.tripType?.message}
            />
          )}
        />
      </View>

      {/* Dates */}
      <View>
        <Controller
          control={control}
          name="startDate"
          render={({
            field: { onChange: onStartChange, value: startValue },
          }) => (
            <Controller
              control={control}
              name="endDate"
              render={({
                field: { onChange: onEndChange, value: endValue },
              }) => (
                <DatePicker
                  startDate={startValue}
                  endDate={endValue}
                  onStartDateChange={onStartChange}
                  onEndDateChange={onEndChange}
                  startDateError={errors.startDate?.message}
                  endDateError={errors.endDate?.message}
                />
              )}
            />
          )}
        />
      </View>

      {/* Privacy Settings */}
      <View>
        <Text className="mb-2 text-sm font-medium text-gray-700">Privacy</Text>
        <Controller
          control={control}
          name="privacy"
          render={({ field: { onChange, value } }) => (
            <Select
              value={value}
              onSelect={onChange}
              options={[
                {
                  value: 'private',
                  label: 'Private - Only you can see this trip',
                },
                {
                  value: 'shared',
                  label: 'Shared - Only invited participants can see this trip',
                },
                {
                  value: 'public',
                  label: 'Public - Anyone can discover this trip',
                },
              ]}
            />
          )}
        />
      </View>
    </View>
  );

  const renderBudgetAndSettingsStep = () => (
    <View className="space-y-6">
      {/* Budget */}
      <View>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          Budget (Optional)
        </Text>
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Controller
              control={control}
              name="budgetAmount"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="0"
                  value={value?.toString() || ''}
                  onChangeText={(text) =>
                    onChange(parseFloat(text) || undefined)
                  }
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          <View className="w-24">
            <Controller
              control={control}
              name="budgetCurrency"
              render={({ field: { onChange, value } }) => (
                <Select
                  value={value}
                  onSelect={onChange}
                  options={CURRENCIES}
                  placeholder="USD"
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* Participant Emails */}
      {watchedPrivacy !== 'private' && (
        <View>
          <Text className="mb-2 text-sm font-medium text-gray-700">
            Invite People (Optional)
          </Text>
          <Text className="mb-3 text-xs text-gray-500">
            You can also invite people after creating the trip
          </Text>
          <Controller
            control={control}
            name="participantEmails"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Enter email addresses separated by commas"
                value={value?.join(', ') || ''}
                onChangeText={(text) =>
                  onChange(
                    text
                      .split(',')
                      .map((email) => email.trim())
                      .filter(Boolean)
                  )
                }
              />
            )}
          />
        </View>
      )}

      {/* Advanced Settings Toggle */}
      <Button
        variant="ghost"
        onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
        className="self-start"
      >
        <Text className="text-blue-600">
          {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
        </Text>
      </Button>

      {/* Advanced Settings */}
      {showAdvancedSettings && (
        <View className="space-y-4 rounded-lg bg-gray-50 p-4">
          <Text className="text-sm font-medium text-gray-700">Permissions</Text>

          <View className="space-y-3">
            <Controller
              control={control}
              name="settings.permissions.canInvite"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Who can invite others?"
                  value={value}
                  onSelect={onChange}
                  options={[
                    { value: 'owner', label: 'Only me' },
                    { value: 'admins', label: 'Admins only' },
                    { value: 'all', label: 'All participants' },
                  ]}
                />
              )}
            />

            <Controller
              control={control}
              name="settings.permissions.canEditItinerary"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Who can edit the itinerary?"
                  value={value}
                  onSelect={onChange}
                  options={[
                    { value: 'owner', label: 'Only me' },
                    { value: 'admins', label: 'Admins only' },
                    { value: 'all', label: 'All participants' },
                  ]}
                />
              )}
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-gray-700">
            Notifications
          </Text>

          <View className="space-y-3">
            <Controller
              control={control}
              name="settings.notifications.dailyDigest"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  checked={value}
                  onChange={onChange}
                  label="Send daily digest emails"
                  accessibilityLabel="Send daily digest emails"
                />
              )}
            />

            <Controller
              control={control}
              name="settings.notifications.instantUpdates"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  checked={value}
                  onChange={onChange}
                  label="Send instant update notifications"
                  accessibilityLabel="Send instant update notifications"
                />
              )}
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicDetailsStep();
      case 1:
        return renderTripTypeAndDatesStep();
      case 2:
        return renderBudgetAndSettingsStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return watch('name') && watch('destination');
      case 1:
        return watch('startDate') && watch('endDate') && watch('tripType');
      case 2:
        return true; // All fields in step 2 are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Trip',
          headerShown: true,
        }}
      />

      <View className="flex-1 bg-white">
        {/* Progress Steps */}
        <View className="border-b border-gray-100 px-4 py-6">
          <View className="mb-4 flex-row justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <View key={index} className="flex-1 items-center">
                  <View
                    className={`mb-2 size-8 items-center justify-center rounded-full ${
                      isActive
                        ? 'bg-blue-600'
                        : isCompleted
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                    }`}
                  >
                    <StepIcon
                      width={16}
                      height={16}
                      color={isActive || isCompleted ? 'white' : '#6B7280'}
                    />
                  </View>
                  <Text
                    className={`text-center text-xs ${
                      isActive ? 'font-medium text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Progress Bar */}
          <View className="h-1 overflow-hidden rounded-full bg-gray-200">
            <View
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </View>
        </View>

        {/* Form Content */}
        <ScrollView className="flex-1 px-4 py-6">
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View className="border-t border-gray-100 px-4 py-6">
          <View className="flex-row space-x-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onPress={handlePrevious}
                className="flex-1"
              >
                <Text className="font-medium text-gray-700">Previous</Text>
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                onPress={handleNext}
                disabled={!canProceed()}
                className={`flex-1 ${!canProceed() ? 'bg-gray-300' : 'bg-blue-600'}`}
              >
                <Text className="font-medium text-white">Next</Text>
              </Button>
            ) : (
              <Button
                onPress={handleSubmit(handleCreateTrip)}
                disabled={!isValid || createTripMutation.isPending}
                className={`flex-1 ${
                  !isValid || createTripMutation.isPending
                    ? 'bg-gray-300'
                    : 'bg-green-600'
                }`}
              >
                <Text className="font-medium text-white">
                  {createTripMutation.isPending ? 'Creating...' : 'Create Trip'}
                </Text>
              </Button>
            )}
          </View>
        </View>

        {/* Loading Overlay */}
        {createTripMutation.isPending && (
          <LoadingOverlay message="Creating your trip..." />
        )}
      </View>
    </>
  );
}
