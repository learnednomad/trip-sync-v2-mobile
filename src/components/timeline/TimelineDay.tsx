/**
 * Timeline Day Component
 * Individual day view with time slots and activities
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { format, parse } from 'date-fns';

import { 
  Text, 
  Card, 
  Button,
  Badge 
} from '@/components/ui';
import {
  Plus as PlusIcon,
  Clock as ClockIcon,
  MapPin as LocationIcon,
} from '@/components/ui/icons';

import { ActivityCard } from './ActivityCard';

interface TimelineDayProps {
  date: string;
  activities: ItineraryItem[];
  timeSlots: string[];
  timeInterval: number;
  onActivityCreate?: (activity: Partial<ItineraryItem>) => void;
  onActivityUpdate?: (activityId: string, updates: Partial<ItineraryItem>) => void;
  onActivityDelete?: (activityId: string) => void;
}

interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: {
    name: string;
    address?: string;
    coordinates: { lat: number; lng: number };
  };
  cost?: {
    amount: number;
    currency: string;
  };
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  order: number;
}

/**
 * Individual day timeline with time slots
 */
export const TimelineDay: React.FC<TimelineDayProps> = ({
  date,
  activities,
  timeSlots,
  timeInterval,
  onActivityCreate,
  onActivityUpdate,
  onActivityDelete,
}) => {
  // Group activities by time slot
  const getActivitiesForSlot = (timeSlot: string) => {
    return activities.filter(activity => {
      const activityStart = format(new Date(activity.startTime), 'HH:mm');
      const activityHour = parseInt(activityStart.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      
      // Check if activity starts within this hour
      return activityHour === slotHour;
    });
  };

  const createActivityAtTime = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const startTime = `${date}T${hours}:${minutes}:00`;
    const endDateTime = new Date(startTime);
    endDateTime.setHours(endDateTime.getHours() + 1); // Default 1-hour duration
    
    onActivityCreate?.({
      startTime,
      endTime: endDateTime.toISOString(),
      type: 'CUSTOM',
      status: 'planned',
      order: activities.length,
    });
  };

  const getTimeSlotActivities = (timeSlot: string) => {
    const slotActivities = getActivitiesForSlot(timeSlot);
    
    if (slotActivities.length === 0) {
      // Empty time slot
      return (
        <View className="min-h-16 border-l-2 border-neutral-200 dark:border-neutral-700 pl-4">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => createActivityAtTime(timeSlot)}
            className="h-12 justify-start border border-dashed border-neutral-300 dark:border-neutral-600"
          >
            <PlusIcon color="#a3a3a3" width={16} height={16} />
            <Text className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
              Add activity
            </Text>
          </Button>
        </View>
      );
    }

    // Activities in this time slot
    return (
      <View className="border-l-2 border-primary-300 dark:border-primary-600 pl-4">
        {slotActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onUpdate={(updates) => onActivityUpdate?.(activity.id, updates)}
            onDelete={() => onActivityDelete?.(activity.id)}
            className="mb-2"
          />
        ))}
      </View>
    );
  };

  if (timeSlots.length === 0) {
    // List view without time slots
    return (
      <View className="p-4">
        {activities.length === 0 ? (
          <Card className="py-8">
            <View className="items-center">
              <ClockIcon color="#a3a3a3" width={32} height={32} />
              <Text className="mt-4 text-base font-medium text-neutral-900 dark:text-white text-center">
                No Activities Planned
              </Text>
              <Text className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 text-center">
                Start planning your day by adding activities
              </Text>
              <Button
                variant="primary"
                onPress={() => createActivityAtTime('12:00')}
                className="mt-4"
              >
                <PlusIcon color="white" width={16} height={16} />
                <Text className="ml-2 text-white font-medium">Add Activity</Text>
              </Button>
            </View>
          </Card>
        ) : (
          <View className="space-y-3">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onUpdate={(updates) => onActivityUpdate?.(activity.id, updates)}
                onDelete={() => onActivityDelete?.(activity.id)}
                showTime={true}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  // Timeline view with time slots
  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        {/* Day Header */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </Text>
          
          {activities.length > 0 && (
            <View className="flex-row space-x-2">
              <Badge variant="primary" size="sm">
                {activities.length} activities
              </Badge>
              <Badge variant="success" size="sm">
                {activities.filter(a => a.status === 'confirmed').length} confirmed
              </Badge>
            </View>
          )}
        </View>

        {/* Time Slots */}
        <View className="space-y-1">
          {timeSlots.map((timeSlot) => (
            <View key={timeSlot} className="flex-row">
              {/* Time Label */}
              <View className="w-16 pt-2">
                <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {timeSlot}
                </Text>
              </View>
              
              {/* Time Slot Content */}
              <View className="flex-1">
                {getTimeSlotActivities(timeSlot)}
              </View>
            </View>
          ))}
        </View>

        {/* Free Time Indicators */}
        <View className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            📊 Day Summary
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
              Free time: {calculateFreeTime(activities)} hours
            </Text>
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
              Activities: {activities.length}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function to calculate free time
const calculateFreeTime = (activities: ItineraryItem[]): number => {
  if (activities.length === 0) return 16; // Assume 6 AM - 10 PM = 16 hours
  
  const totalActivityTime = activities.reduce((total, activity) => {
    const start = new Date(activity.startTime);
    const end = new Date(activity.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Hours
    return total + duration;
  }, 0);
  
  return Math.max(0, 16 - totalActivityTime); // Free time in hours
};