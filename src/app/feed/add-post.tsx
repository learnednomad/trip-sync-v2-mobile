import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';
import { z } from 'zod';

import { useCreateTrip } from '@/api';
import {
  Button,
  ControlledInput,
  showErrorMessage,
  View,
} from '@/components/ui';

const schema = z.object({
  name: z.string().min(3, 'Trip name must be at least 3 characters'),
  description: z.string().optional(),
  destination: z.string().min(2, 'Destination is required'),
  startDate: z.string(),
  endDate: z.string(),
  budgetAmount: z.string().optional(),
  budgetCurrency: z.string().default('USD'),
});

type FormType = z.infer<typeof schema>;

export default function AddTrip() {
  const { control, handleSubmit } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      budgetCurrency: 'USD',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 7 days from now
    },
  });
  const { mutate: createTrip, isPending } = useCreateTrip();

  const onSubmit = (data: FormType) => {
    const tripData = {
      ...data,
      tripType: 'LEISURE' as const,
      budgetAmount: data.budgetAmount
        ? parseFloat(data.budgetAmount)
        : undefined,
      settings: {
        visibility: 'participants' as const,
        permissions: {
          canInvite: 'all' as const,
          canEditItinerary: 'all' as const,
          canAddExpenses: 'all' as const,
          canSeeExpenses: 'all' as const,
        },
        notifications: {
          dailyDigest: true,
          instantUpdates: true,
          reminderDaysBefore: 1,
        },
      },
    };

    createTrip(tripData, {
      onSuccess: () => {
        showMessage({
          message: 'Trip created successfully',
          type: 'success',
        });
        router.back();
      },
      onError: () => {
        showErrorMessage('Error creating trip');
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Trip',
          headerBackTitle: 'Home',
        }}
      />
      <View className="flex-1 p-4">
        <ControlledInput
          name="name"
          label="Trip Name"
          control={control}
          testID="trip-name"
        />
        <ControlledInput
          name="destination"
          label="Destination"
          control={control}
          testID="destination"
        />
        <ControlledInput
          name="description"
          label="Description (optional)"
          control={control}
          multiline
          testID="description"
        />
        <ControlledInput
          name="startDate"
          label="Start Date (YYYY-MM-DD)"
          control={control}
          testID="start-date"
        />
        <ControlledInput
          name="endDate"
          label="End Date (YYYY-MM-DD)"
          control={control}
          testID="end-date"
        />
        <ControlledInput
          name="budgetAmount"
          label="Budget Amount (optional)"
          control={control}
          keyboardType="numeric"
          testID="budget-amount"
        />
        <ControlledInput
          name="budgetCurrency"
          label="Currency"
          control={control}
          testID="budget-currency"
        />
        <Button
          label="Create Trip"
          loading={isPending}
          onPress={handleSubmit(onSubmit)}
          testID="create-trip-button"
        />
      </View>
    </>
  );
}
