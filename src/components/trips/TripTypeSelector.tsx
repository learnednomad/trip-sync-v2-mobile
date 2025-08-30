/**
 * Trip Type Selector Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Visual trip type selection with icons
 */

import React from 'react';
import { Pressable, View } from 'react-native';

import {
  Briefcase,
  Building,
  Flower,
  GraduationCap,
  Heart,
  Mountain,
  Palette,
  Users,
} from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

export type TripType =
  | 'BUSINESS'
  | 'LEISURE'
  | 'FAMILY'
  | 'ADVENTURE'
  | 'ROMANTIC'
  | 'EDUCATIONAL'
  | 'CULTURAL'
  | 'WELLNESS';

interface TripTypeOption {
  type: TripType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const tripTypeOptions: TripTypeOption[] = [
  {
    type: 'BUSINESS',
    label: 'Business',
    description: 'Work trips and conferences',
    icon: Briefcase,
    color: '#1F2937',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  {
    type: 'LEISURE',
    label: 'Leisure',
    description: 'Relaxation and recreation',
    icon: Building,
    color: '#059669',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
  },
  {
    type: 'FAMILY',
    label: 'Family',
    description: 'Family vacations and reunions',
    icon: Users,
    color: '#7C3AED',
    bgColor: 'bg-violet-100',
    borderColor: 'border-violet-300',
  },
  {
    type: 'ADVENTURE',
    label: 'Adventure',
    description: 'Outdoor activities and exploration',
    icon: Mountain,
    color: '#DC2626',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
  {
    type: 'ROMANTIC',
    label: 'Romantic',
    description: 'Couples getaways and honeymoons',
    icon: Heart,
    color: '#EC4899',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
  },
  {
    type: 'EDUCATIONAL',
    label: 'Educational',
    description: 'Learning and skill development',
    icon: GraduationCap,
    color: '#2563EB',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  {
    type: 'CULTURAL',
    label: 'Cultural',
    description: 'Museums, heritage, and traditions',
    icon: Palette,
    color: '#D97706',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
  },
  {
    type: 'WELLNESS',
    label: 'Wellness',
    description: 'Health, spa, and mindfulness',
    icon: Flower,
    color: '#059669',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
  },
];

interface TripTypeSelectorProps {
  selectedType?: TripType;
  onTypeSelect: (type: TripType) => void;
  error?: string;
  className?: string;
}

export function TripTypeSelector({
  selectedType,
  onTypeSelect,
  error,
  className = '',
}: TripTypeSelectorProps) {
  return (
    <View className={className}>
      <View className="grid grid-cols-2 gap-3">
        {tripTypeOptions.map((option) => {
          const isSelected = selectedType === option.type;
          const IconComponent = option.icon;

          return (
            <Pressable
              key={option.type}
              onPress={() => onTypeSelect(option.type)}
              className={`
                flex-row items-center rounded-xl border-2 p-4
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : `${option.borderColor} ${option.bgColor}`
                }
              `}
              android_ripple={{ color: '#f3f4f6' }}
            >
              <View className="mr-3">
                <IconComponent
                  size={24}
                  color={isSelected ? '#2563EB' : option.color}
                />
              </View>

              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
                <Text
                  className={`mt-1 text-xs ${
                    isSelected ? 'text-blue-700' : 'text-gray-600'
                  }`}
                >
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {error && <Text className="mt-2 text-sm text-red-600">{error}</Text>}
    </View>
  );
}
