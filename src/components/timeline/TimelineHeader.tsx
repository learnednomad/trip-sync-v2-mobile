/**
 * Timeline Header Component
 * Navigation and view controls for timeline
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { format } from 'date-fns';

import { 
  Text, 
  Button, 
  Badge,
  Pressable 
} from '@/components/ui';
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  MapPin as MapIcon,
  Grid as GridIcon,
} from '@/components/ui/icons';

type TimelineView = 'daily' | 'weekly' | 'overview' | 'map';
type TimeInterval = 15 | 30 | 60;

interface TimelineHeaderProps {
  currentView: TimelineView;
  onViewChange: (view: TimelineView) => void;
  selectedDate: string;
  tripDays: Date[];
  onDateSelect: (date: string) => void;
  timeInterval: TimeInterval;
  onTimeIntervalChange: (interval: TimeInterval) => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  currentView,
  onViewChange,
  selectedDate,
  tripDays,
  onDateSelect,
  timeInterval,
  onTimeIntervalChange,
}) => {
  const viewOptions: { key: TimelineView; label: string; icon: React.ReactNode }[] = [
    { key: 'daily', label: 'Daily', icon: <CalendarIcon color="#737373" /> },
    { key: 'weekly', label: 'Weekly', icon: <GridIcon color="#737373" /> },
    { key: 'overview', label: 'Overview', icon: <ListIcon color="#737373" /> },
    { key: 'map', label: 'Map', icon: <MapIcon color="#737373" /> },
  ];

  const intervalOptions: TimeInterval[] = [15, 30, 60];

  return (
    <View className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
      {/* Main Header */}
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            Trip Timeline
          </Text>
          
          {/* Time Interval Selector */}
          {currentView === 'daily' && (
            <View className="flex-row items-center space-x-2">
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                Interval:
              </Text>
              {intervalOptions.map((interval) => (
                <Button
                  key={interval}
                  variant={timeInterval === interval ? 'primary' : 'ghost'}
                  size="sm"
                  onPress={() => onTimeIntervalChange(interval)}
                >
                  <Text className={`text-xs ${
                    timeInterval === interval 
                      ? 'text-white' 
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {interval}m
                  </Text>
                </Button>
              ))}
            </View>
          )}
        </View>

        {/* View Mode Selector */}
        <View className="flex-row space-x-2">
          {viewOptions.map((option) => (
            <Button
              key={option.key}
              variant={currentView === option.key ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => onViewChange(option.key)}
              className="flex-row items-center"
            >
              {option.icon}
              <Text className={`ml-2 text-sm ${
                currentView === option.key 
                  ? 'text-white' 
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}>
                {option.label}
              </Text>
            </Button>
          ))}
        </View>
      </View>

      {/* Date Selector (for daily view) */}
      {currentView === 'daily' && (
        <View className="px-4 pb-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="flex-row space-x-2"
          >
            {tripDays.map((day, index) => {
              const dayString = day.toISOString().split('T')[0];
              const isSelected = dayString === selectedDate;
              const isToday = dayString === new Date().toISOString().split('T')[0];
              
              return (
                <Pressable
                  key={dayString}
                  onPress={() => onDateSelect(dayString)}
                  className={`px-4 py-3 rounded-lg border ${
                    isSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600'
                  }`}
                >
                  <View className="items-center">
                    <Text className={`text-xs font-medium ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {format(day, 'EEE')}
                    </Text>
                    <Text className={`text-lg font-bold ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-neutral-900 dark:text-white'
                    }`}>
                      {format(day, 'd')}
                    </Text>
                    {isToday && (
                      <Badge 
                        variant="secondary" 
                        size="sm" 
                        className="mt-1"
                      >
                        Today
                      </Badge>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Quick Stats */}
      <View className="px-4 pb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row space-x-4">
            <View className="items-center">
              <Text className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {activities.length}
              </Text>
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                Activities
              </Text>
            </View>
            
            <View className="items-center">
              <Text className="text-sm font-bold text-success-600 dark:text-success-400">
                {activities.filter(a => a.status === 'confirmed').length}
              </Text>
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                Confirmed
              </Text>
            </View>
            
            <View className="items-center">
              <Text className="text-sm font-bold text-warning-600 dark:text-warning-400">
                {activities.filter(a => a.status === 'planned').length}
              </Text>
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                Planned
              </Text>
            </View>
          </View>

          {/* Timeline Summary */}
          <View className="items-end">
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
              {tripDays.length} day{tripDays.length !== 1 ? 's' : ''}
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-500">
              {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};