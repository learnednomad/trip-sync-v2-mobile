import { Link } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';

import { useTrips } from '@/api';
import {
  Button,
  Card,
  FocusAwareStatusBar,
  Text,
  TripCardSkeleton,
  TripStatusBadge,
  View,
} from '@/components/ui';
import {
  ArrowRight as ArrowIcon,
  Calendar as CalendarIcon,
  MapPin as LocationIcon,
  Plus as PlusIcon,
  Users as ParticipantsIcon,
} from '@/components/ui/icons';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { data: tripsData, isPending, isError } = useTrips();
  const user = useAuth.use.token();

  const upcomingTrips =
    tripsData?.data?.trips
      ?.filter((trip) => ['PLANNING', 'CONFIRMED'].includes(trip.status))
      .slice(0, 3) || [];

  const ongoingTrips =
    tripsData?.data?.trips?.filter((trip) => trip.status === 'IN_PROGRESS') ||
    [];

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center">
        <FocusAwareStatusBar />
        <Text className="dark:text-error-400 text-error-600">
          Error loading trips
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Welcome Header */}
      <View className="px-4 pb-6 pt-4">
        <Text className="mb-1 text-2xl font-bold text-neutral-900 dark:text-white">
          Welcome back! 👋
        </Text>
        <Text className="text-neutral-600 dark:text-neutral-400">
          Ready for your next adventure?
        </Text>
      </View>

      {/* Quick Stats */}
      <View className="mb-6 px-4">
        <View className="flex-row space-x-3">
          <Card className="flex-1" variant="elevated">
            <Card.Body className="items-center">
              <Text className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {tripsData?.data?.trips?.length || 0}
              </Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                Total Trips
              </Text>
            </Card.Body>
          </Card>

          <Card className="flex-1" variant="elevated">
            <Card.Body className="items-center">
              <Text className="dark:text-success-400 text-2xl font-bold text-success-600">
                {ongoingTrips.length}
              </Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                Active
              </Text>
            </Card.Body>
          </Card>

          <Card className="flex-1" variant="elevated">
            <Card.Body className="items-center">
              <Text className="dark:text-warning-400 text-2xl font-bold text-warning-600">
                {upcomingTrips.length}
              </Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                Upcoming
              </Text>
            </Card.Body>
          </Card>
        </View>
      </View>

      {/* Ongoing Trips */}
      {ongoingTrips.length > 0 && (
        <View className="mb-6 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
              Active Trips
            </Text>
            <Link href="/(app)/trips" asChild>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </View>

          {ongoingTrips.map((trip) => (
            <Link key={trip.id} href={`/(app)/trips/${trip.id}` as any} asChild>
              <Card className="mb-3" interactive={true}>
                <Card.Body>
                  <View className="mb-2 flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                        {trip.name}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <LocationIcon color="#737373" />
                        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                          {trip.destination}
                        </Text>
                      </View>
                    </View>
                    <TripStatusBadge status={trip.status} />
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <CalendarIcon color="#737373" />
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(trip.startDate).toLocaleDateString()} -{' '}
                        {new Date(trip.endDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <ParticipantsIcon color="#737373" />
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {trip.participants?.length || 0} people
                      </Text>
                    </View>
                  </View>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </View>
      )}

      {/* Upcoming Trips */}
      <View className="mb-6 px-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
            {upcomingTrips.length > 0 ? 'Upcoming Trips' : 'Your Trips'}
          </Text>
          <Link href="/(app)/trips" asChild>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </View>

        {isPending ? (
          <View>
            <TripCardSkeleton />
            <TripCardSkeleton />
          </View>
        ) : upcomingTrips.length > 0 ? (
          upcomingTrips.map((trip) => (
            <Link key={trip.id} href={`/(app)/trips/${trip.id}` as any} asChild>
              <Card className="mb-3" interactive={true}>
                <Card.Body>
                  <View className="mb-2 flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                        {trip.name}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <LocationIcon color="#737373" />
                        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                          {trip.destination}
                        </Text>
                      </View>
                    </View>
                    <TripStatusBadge status={trip.status} />
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <CalendarIcon color="#737373" />
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(trip.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <ParticipantsIcon color="#737373" />
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {trip.participants?.length || 0} people
                      </Text>
                    </View>
                  </View>
                </Card.Body>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <Card.Body className="items-center py-8">
              <View className="mb-4 size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <LocationIcon color="#737373" />
              </View>
              <Text className="mb-2 text-center text-base font-medium text-neutral-900 dark:text-white">
                Start Your Journey
              </Text>
              <Text className="mb-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                Create your first trip to begin planning your next adventure
              </Text>
              <Link href="/(app)/trips/create" asChild>
                <Button variant="primary">
                  <PlusIcon color="white" />
                  <Text className="font-medium text-white">Create Trip</Text>
                </Button>
              </Link>
            </Card.Body>
          </Card>
        )}
      </View>

      {/* Quick Actions */}
      <View className="mb-6 px-4">
        <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
          Quick Actions
        </Text>
        <View className="flex-row space-x-3">
          <Link href="/(app)/trips/create" asChild className="flex-1">
            <Button variant="primary" size="lg">
              <PlusIcon color="white" />
              <Text className="font-medium text-white">New Trip</Text>
            </Button>
          </Link>
          <Link href="/(app)/explore" asChild className="flex-1">
            <Button variant="outline" size="lg">
              <Text className="font-medium text-primary-500">Explore</Text>
              <ArrowIcon color="#0ea5e9" />
            </Button>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
