/**
 * Timeline View Foundation
 * Day-by-day timeline with time slot management
 */

import React, { useState, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { format, addDays, startOfDay, addHours } from 'date-fns';

import { 
  Text, 
  Button, 
  Card,
  Container,
  Stack 
} from '@/components/ui';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Calendar as CalendarIcon,
  Clock as TimeIcon,
} from '@/components/ui/icons';

import { TimelineDay } from './TimelineDay';
import { TimelineHeader } from './TimelineHeader';

interface TimelineViewProps {
  tripId: string;
  startDate: string;
  endDate: string;
  activities?: ItineraryItem[];
  onActivityCreate?: (activity: Partial<ItineraryItem>) => void;
  onActivityUpdate?: (activityId: string, updates: Partial<ItineraryItem>) => void;
  onActivityDelete?: (activityId: string) => void;
}

interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  type: ActivityType;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
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

enum ActivityType {
  TRANSPORTATION = 'transportation',
  ACCOMMODATION = 'accommodation',
  DINING = 'dining', 
  SIGHTSEEING = 'sightseeing',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  MEETING = 'meeting',
  CUSTOM = 'custom'
}

type TimelineView = 'daily' | 'weekly' | 'overview' | 'map';
type TimeInterval = 15 | 30 | 60; // minutes

/**
 * Main timeline component with multiple view modes
 */
export const TimelineView: React.FC<TimelineViewProps> = ({
  tripId,
  startDate,
  endDate,
  activities = [],
  onActivityCreate,
  onActivityUpdate,
  onActivityDelete,
}) => {
  const [currentView, setCurrentView] = useState<TimelineView>('daily');
  const [selectedDate, setSelectedDate] = useState(startDate);
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(60);
  const [showTimeSlots, setShowTimeSlots] = useState(true);

  // Calculate trip days
  const tripDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = start; date <= end; date = addDays(date, 1)) {
      days.push(new Date(date));
    }
    
    return days;
  }, [startDate, endDate]);

  // Filter activities for selected date
  const dailyActivities = useMemo(() => {
    const selectedDay = startOfDay(new Date(selectedDate));
    
    return activities.filter(activity => {
      const activityDate = startOfDay(new Date(activity.startTime));
      return activityDate.getTime() === selectedDay.getTime();
    }).sort((a, b) => {
      // Sort by start time, then by order
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.order - b.order;
    });
  }, [activities, selectedDate]);

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const startHour = 6; // 6 AM
    const endHour = 24; // Midnight
    
    for (let hour = startHour; hour < endHour; hour++) {
      const time = addHours(startOfDay(new Date()), hour);
      
      if (timeInterval === 60) {
        slots.push(format(time, 'HH:mm'));
      } else {
        // Add sub-hour intervals
        for (let min = 0; min < 60; min += timeInterval) {
          const slotTime = addHours(startOfDay(new Date()), hour);
          slotTime.setMinutes(min);
          slots.push(format(slotTime, 'HH:mm'));
        }
      }
    }
    
    return slots;
  }, [timeInterval]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = direction === 'prev' 
      ? addDays(currentDate, -1)
      : addDays(currentDate, 1);
    
    // Ensure we stay within trip bounds
    const tripStart = new Date(startDate);
    const tripEnd = new Date(endDate);
    
    if (newDate >= tripStart && newDate <= tripEnd) {
      setSelectedDate(newDate.toISOString().split('T')[0]);
    }
  };

  const handleViewChange = (view: TimelineView) => {
    setCurrentView(view);
  };

  const handleTimeIntervalChange = (interval: TimeInterval) => {
    setTimeInterval(interval);
  };

  return (
    <Container className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Timeline Header */}
      <TimelineHeader
        currentView={currentView}
        onViewChange={handleViewChange}
        selectedDate={selectedDate}
        tripDays={tripDays}
        onDateSelect={setSelectedDate}
        timeInterval={timeInterval}
        onTimeIntervalChange={handleTimeIntervalChange}
      />

      {/* View Controls */}
      <View className="px-4 py-2 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <View className="flex-row items-center justify-between">
          {/* Date Navigation */}
          <View className="flex-row items-center">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigateDate('prev')}
              disabled={selectedDate === startDate}
            >
              <PrevIcon color="#737373" />
            </Button>
            
            <Text className="mx-4 text-lg font-semibold text-neutral-900 dark:text-white">
              {format(new Date(selectedDate), 'EEEE, MMM d')}
            </Text>
            
            <Button
              variant="ghost"
              size="sm"
              onPress={() => navigateDate('next')}
              disabled={selectedDate === endDate}
            >
              <NextIcon color="#737373" />
            </Button>
          </View>

          {/* View Toggle */}
          <View className="flex-row items-center space-x-2">
            <Button
              variant={showTimeSlots ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => setShowTimeSlots(!showTimeSlots)}
            >
              <TimeIcon color={showTimeSlots ? 'white' : '#737373'} />
            </Button>
          </View>
        </View>
      </View>

      {/* Timeline Content */}
      <ScrollView className="flex-1">
        {currentView === 'daily' && (
          <TimelineDay
            date={selectedDate}
            activities={dailyActivities}
            timeSlots={showTimeSlots ? timeSlots : []}
            timeInterval={timeInterval}
            onActivityCreate={onActivityCreate}
            onActivityUpdate={onActivityUpdate}
            onActivityDelete={onActivityDelete}
          />
        )}

        {currentView === 'weekly' && (
          <View className="p-4">
            <Text className="text-center text-neutral-600 dark:text-neutral-400">
              Weekly view coming soon...
            </Text>
          </View>
        )}

        {currentView === 'overview' && (
          <View className="p-4">
            <Text className="text-center text-neutral-600 dark:text-neutral-400">
              Overview view coming soon...
            </Text>
          </View>
        )}

        {currentView === 'map' && (
          <View className="p-4">
            <Text className="text-center text-neutral-600 dark:text-neutral-400">
              Map view coming soon...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6">
        <Button
          variant="primary"
          size="lg"
          onPress={() => onActivityCreate?.({
            tripId,
            startTime: `${selectedDate}T12:00:00`,
            endTime: `${selectedDate}T13:00:00`,
            type: ActivityType.CUSTOM,
            status: 'planned',
            order: dailyActivities.length,
          })}
          className="w-14 h-14 rounded-full shadow-lg"
        >
          <Text className="text-white text-2xl">+</Text>
        </Button>
      </View>
    </Container>
  );
};