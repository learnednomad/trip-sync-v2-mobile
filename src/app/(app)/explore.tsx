import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Badge, Button, Card, Input, Text } from '@/components/ui';
import {
  Calendar as CalendarIcon,
  MapPin as LocationIcon,
  Search as SearchIcon,
  Users as ParticipantsIcon,
} from '@/components/ui/icons';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const popularDestinations = [
    { name: 'Tokyo, Japan', image: '🏯', trips: 1250 },
    { name: 'Paris, France', image: '🗼', trips: 980 },
    { name: 'New York, USA', image: '🗽', trips: 850 },
    { name: 'London, UK', image: '🏰', trips: 720 },
    { name: 'Bali, Indonesia', image: '🏝️', trips: 650 },
  ];

  const tripTemplates = [
    {
      id: '1',
      name: 'Weekend City Break',
      description: 'Perfect 3-day city exploration',
      type: 'leisure',
      duration: '2-3 days',
      destinations: ['Any major city'],
      rating: 4.8,
      uses: 15420,
    },
    {
      id: '2',
      name: 'Family Beach Vacation',
      description: 'Fun-filled beach holiday for families',
      type: 'family',
      duration: '1 week',
      destinations: ['Beach destinations'],
      rating: 4.9,
      uses: 12340,
    },
    {
      id: '3',
      name: 'Business Conference Trip',
      description: 'Efficient business travel template',
      type: 'business',
      duration: '3-5 days',
      destinations: ['Conference cities'],
      rating: 4.7,
      uses: 8760,
    },
  ];

  return (
    <ScrollView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <View className="border-b border-neutral-200 bg-white px-4 pb-6 pt-12 dark:border-neutral-700 dark:bg-neutral-900">
        <Text className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
          Explore & Plan
        </Text>
        <Text className="mb-4 text-neutral-600 dark:text-neutral-400">
          Discover destinations and trip templates
        </Text>

        {/* Search bar */}
        <View className="relative">
          <Input
            placeholder="Search destinations, templates..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="pl-10"
          />
          <View className="absolute left-3 top-3">
            <SearchIcon color="#737373" />
          </View>
        </View>
      </View>

      <View className="p-4">
        {/* Popular Destinations */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
            Popular Destinations
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {popularDestinations.map((destination, index) => (
                <Card
                  key={index}
                  variant="elevated"
                  className="mr-3 w-40"
                  interactive={true}
                >
                  <View className="items-center p-4">
                    <Text className="mb-2 text-3xl">{destination.image}</Text>
                    <Text className="mb-1 text-center text-sm font-medium text-neutral-900 dark:text-white">
                      {destination.name}
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                      {destination.trips} trips
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Trip Templates */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
              Trip Templates
            </Text>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </View>

          {tripTemplates.map((template) => (
            <Card key={template.id} className="mb-3" interactive={true}>
              <Card.Body>
                <View className="mb-2 flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="mb-1 text-base font-semibold text-neutral-900 dark:text-white">
                      {template.name}
                    </Text>
                    <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                      {template.description}
                    </Text>
                  </View>
                  <Badge variant="primary" size="sm">
                    {template.type}
                  </Badge>
                </View>

                <View className="mb-3 flex-row items-center space-x-4">
                  <View className="flex-row items-center">
                    <CalendarIcon color="#737373" />
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                      {template.duration}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <ParticipantsIcon color="#737373" />
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                      {template.uses} uses
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="mr-1 text-xs text-neutral-500 dark:text-neutral-400">
                      ⭐ {template.rating}
                    </Text>
                  </View>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </View>
              </Card.Body>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
            Quick Actions
          </Text>
          <View className="space-y-2">
            <Button variant="primary" className="flex-row items-center">
              <LocationIcon color="white" />
              <Text className="font-medium text-white">Plan New Trip</Text>
            </Button>
            <Button variant="outline" className="flex-row items-center">
              <SearchIcon color="#0ea5e9" />
              <Text className="font-medium text-primary-500">
                Browse Templates
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
