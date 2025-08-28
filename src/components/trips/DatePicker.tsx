/**
 * Date Picker Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Custom date picker with range selection support
 */

import React, { useState } from 'react';
import { View, Pressable, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, ChevronRight } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date';

interface DatePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startDateError?: string;
  endDateError?: string;
  className?: string;
}

export function DatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startDateError,
  endDateError,
  className = '',
}: DatePickerProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(
    startDate ? new Date(startDate) : new Date()
  );
  const [tempEndDate, setTempEndDate] = useState<Date>(
    endDate ? new Date(endDate) : new Date()
  );

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setTempStartDate(selectedDate);
      if (Platform.OS === 'android') {
        onStartDateChange(selectedDate.toISOString());
        
        // Auto-adjust end date if it's before start date
        if (endDate && new Date(endDate) <= selectedDate) {
          const newEndDate = new Date(selectedDate);
          newEndDate.setDate(newEndDate.getDate() + 1);
          onEndDateChange(newEndDate.toISOString());
        }
      }
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setTempEndDate(selectedDate);
      if (Platform.OS === 'android') {
        onEndDateChange(selectedDate.toISOString());
      }
    }
  };

  const confirmStartDate = () => {
    onStartDateChange(tempStartDate.toISOString());
    setShowStartPicker(false);
    
    // Auto-adjust end date if it's before start date
    if (endDate && new Date(endDate) <= tempStartDate) {
      const newEndDate = new Date(tempStartDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      onEndDateChange(newEndDate.toISOString());
      setTempEndDate(newEndDate);
    }
  };

  const confirmEndDate = () => {
    onEndDateChange(tempEndDate.toISOString());
    setShowEndPicker(false);
  };

  const getMinEndDate = () => {
    if (startDate) {
      const minEnd = new Date(startDate);
      minEnd.setDate(minEnd.getDate() + 1);
      return minEnd;
    }
    return new Date();
  };

  const getDuration = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  const duration = getDuration();

  return (
    <View className={className}>
      <View className="space-y-4">
        {/* Start Date */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Start Date
          </Text>
          <Pressable
            onPress={() => setShowStartPicker(true)}
            className={`
              flex-row items-center justify-between bg-white border rounded-lg px-4 py-3
              ${startDateError ? 'border-red-500' : 'border-gray-300'}
            `}
            android_ripple={{ color: '#f3f4f6' }}
          >
            <View className="flex-row items-center flex-1">
              <Calendar width={20} height={20} color="#6B7280" />
              <Text className={`ml-3 ${startDate ? 'text-gray-900' : 'text-gray-500'}`}>
                {startDate ? formatDate(startDate, 'EEEE, MMMM d, yyyy') : 'Select start date'}
              </Text>
            </View>
            <ChevronRight width={20} height={20} color="#6B7280" />
          </Pressable>
          
          {startDateError && (
            <Text className="text-red-600 text-sm mt-1">{startDateError}</Text>
          )}
        </View>

        {/* End Date */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            End Date
          </Text>
          <Pressable
            onPress={() => setShowEndPicker(true)}
            className={`
              flex-row items-center justify-between bg-white border rounded-lg px-4 py-3
              ${endDateError ? 'border-red-500' : 'border-gray-300'}
            `}
            android_ripple={{ color: '#f3f4f6' }}
          >
            <View className="flex-row items-center flex-1">
              <Calendar width={20} height={20} color="#6B7280" />
              <Text className={`ml-3 ${endDate ? 'text-gray-900' : 'text-gray-500'}`}>
                {endDate ? formatDate(endDate, 'EEEE, MMMM d, yyyy') : 'Select end date'}
              </Text>
            </View>
            <ChevronRight width={20} height={20} color="#6B7280" />
          </Pressable>
          
          {endDateError && (
            <Text className="text-red-600 text-sm mt-1">{endDateError}</Text>
          )}
        </View>

        {/* Duration Display */}
        {duration && (
          <View className="bg-blue-50 px-4 py-3 rounded-lg">
            <Text className="text-blue-800 font-medium text-center">
              Duration: {duration} {duration === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}
      </View>

      {/* Start Date Picker */}
      {showStartPicker && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="slide"
              visible={showStartPicker}
              onRequestClose={() => setShowStartPicker(false)}
            >
              <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-xl">
                  <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                    <Button
                      variant="ghost"
                      onPress={() => setShowStartPicker(false)}
                    >
                      <Text className="text-blue-600">Cancel</Text>
                    </Button>
                    <Text className="font-semibold text-lg">Select Start Date</Text>
                    <Button
                      variant="ghost"
                      onPress={confirmStartDate}
                    >
                      <Text className="text-blue-600 font-semibold">Done</Text>
                    </Button>
                  </View>
                  <DateTimePicker
                    value={tempStartDate}
                    mode="date"
                    display="spinner"
                    onChange={handleStartDateChange}
                    minimumDate={minDate}
                    maximumDate={maxDate}
                    style={{ height: 200 }}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          )}
        </>
      )}

      {/* End Date Picker */}
      {showEndPicker && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="slide"
              visible={showEndPicker}
              onRequestClose={() => setShowEndPicker(false)}
            >
              <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-xl">
                  <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                    <Button
                      variant="ghost"
                      onPress={() => setShowEndPicker(false)}
                    >
                      <Text className="text-blue-600">Cancel</Text>
                    </Button>
                    <Text className="font-semibold text-lg">Select End Date</Text>
                    <Button
                      variant="ghost"
                      onPress={confirmEndDate}
                    >
                      <Text className="text-blue-600 font-semibold">Done</Text>
                    </Button>
                  </View>
                  <DateTimePicker
                    value={tempEndDate}
                    mode="date"
                    display="spinner"
                    onChange={handleEndDateChange}
                    minimumDate={getMinEndDate()}
                    maximumDate={maxDate}
                    style={{ height: 200 }}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              minimumDate={getMinEndDate()}
              maximumDate={maxDate}
            />
          )}
        </>
      )}
    </View>
  );
}