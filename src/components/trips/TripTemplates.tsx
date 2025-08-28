/**
 * Trip Templates Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Acceptance Criteria 4: Trip Templates & Quick Creation
 */

import React, { useState } from 'react';
import { View, ScrollView, Modal } from 'react-native';
import { Calendar, MapPin, Clock, Users, Bookmark, X } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TripType } from '@/api/trips/types';

export interface TripTemplate {
  id: string;
  name: string;
  description: string;
  tripType: TripType;
  defaultDuration: number; // in days
  suggestedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  destinations: string[];
  activities: string[];
  packingItems: string[];
  coverImage: string;
  popularity: number;
  isCustom: boolean;
}

interface TripTemplatesProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TripTemplate, customizations?: TemplateCustomization) => void;
}

interface TemplateCustomization {
  destination?: string;
  duration?: number;
  budget?: number;
  participants?: number;
}

const defaultTemplates: TripTemplate[] = [
  {
    id: 'business-conference',
    name: 'Business Conference',
    description: 'Professional trip with meetings, conferences, and networking events',
    tripType: 'BUSINESS',
    defaultDuration: 3,
    suggestedBudget: { min: 800, max: 1500, currency: 'USD' },
    destinations: ['New York', 'San Francisco', 'London', 'Tokyo'],
    activities: ['Conference attendance', 'Business meetings', 'Networking events', 'Client dinners'],
    packingItems: ['Business attire', 'Laptop', 'Business cards', 'Presentation materials'],
    coverImage: 'business-conference.jpg',
    popularity: 85,
    isCustom: false,
  },
  {
    id: 'family-vacation',
    name: 'Family Beach Vacation',
    description: 'Relaxing family trip with beach activities and quality time together',
    tripType: 'FAMILY',
    defaultDuration: 7,
    suggestedBudget: { min: 2000, max: 4000, currency: 'USD' },
    destinations: ['Miami', 'Cancun', 'Hawaii', 'Maldives'],
    activities: ['Beach relaxation', 'Water sports', 'Family games', 'Local cuisine'],
    packingItems: ['Swimwear', 'Sunscreen', 'Beach toys', 'Camera'],
    coverImage: 'family-beach.jpg',
    popularity: 92,
    isCustom: false,
  },
  {
    id: 'adventure-hiking',
    name: 'Mountain Adventure',
    description: 'Exciting hiking and outdoor adventure experience',
    tripType: 'ADVENTURE',
    defaultDuration: 5,
    suggestedBudget: { min: 1200, max: 2500, currency: 'USD' },
    destinations: ['Colorado', 'Swiss Alps', 'Patagonia', 'Nepal'],
    activities: ['Hiking', 'Rock climbing', 'Camping', 'Photography'],
    packingItems: ['Hiking boots', 'Backpack', 'Camping gear', 'First aid kit'],
    coverImage: 'mountain-adventure.jpg',
    popularity: 78,
    isCustom: false,
  },
  {
    id: 'romantic-getaway',
    name: 'Romantic Weekend',
    description: 'Intimate getaway with romantic activities and fine dining',
    tripType: 'ROMANTIC',
    defaultDuration: 3,
    suggestedBudget: { min: 800, max: 2000, currency: 'USD' },
    destinations: ['Paris', 'Venice', 'Santorini', 'Napa Valley'],
    activities: ['Fine dining', 'Spa treatments', 'Sunset viewing', 'Wine tasting'],
    packingItems: ['Formal attire', 'Camera', 'Romantic playlist', 'Special accessories'],
    coverImage: 'romantic-getaway.jpg',
    popularity: 88,
    isCustom: false,
  },
  {
    id: 'cultural-exploration',
    name: 'Cultural Immersion',
    description: 'Deep dive into local culture, history, and traditions',
    tripType: 'CULTURAL',
    defaultDuration: 10,
    suggestedBudget: { min: 1500, max: 3500, currency: 'USD' },
    destinations: ['Rome', 'Kyoto', 'Istanbul', 'Cairo'],
    activities: ['Museum visits', 'Historical tours', 'Local cooking classes', 'Art galleries'],
    packingItems: ['Comfortable walking shoes', 'Guidebooks', 'Camera', 'Journal'],
    coverImage: 'cultural-immersion.jpg',
    popularity: 74,
    isCustom: false,
  },
  {
    id: 'wellness-retreat',
    name: 'Wellness Retreat',
    description: 'Rejuvenating experience focused on health and mindfulness',
    tripType: 'WELLNESS',
    defaultDuration: 6,
    suggestedBudget: { min: 1800, max: 3000, currency: 'USD' },
    destinations: ['Bali', 'Tulum', 'Costa Rica', 'Thailand'],
    activities: ['Yoga sessions', 'Meditation', 'Spa treatments', 'Healthy cuisine'],
    packingItems: ['Yoga mat', 'Comfortable clothes', 'Water bottle', 'Journal'],
    coverImage: 'wellness-retreat.jpg',
    popularity: 81,
    isCustom: false,
  },
];

export function TripTemplates({ visible, onClose, onSelectTemplate }: TripTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizations, setCustomizations] = useState<TemplateCustomization>({});
  const [filterType, setFilterType] = useState<TripType | 'ALL'>('ALL');

  const filteredTemplates = filterType === 'ALL' 
    ? defaultTemplates 
    : defaultTemplates.filter(template => template.tripType === filterType);

  const handleTemplateSelect = (template: TripTemplate) => {
    setSelectedTemplate(template);
    setCustomizations({
      destination: template.destinations[0],
      duration: template.defaultDuration,
      budget: template.suggestedBudget.min,
      participants: 2,
    });
    setShowCustomization(true);
  };

  const handleQuickCreate = (template: TripTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleCustomizedCreate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, customizations);
      onClose();
    }
  };

  const getTripTypeColor = (type: TripType) => {
    const colors = {
      BUSINESS: 'bg-blue-100 text-blue-800',
      LEISURE: 'bg-green-100 text-green-800',
      FAMILY: 'bg-purple-100 text-purple-800',
      ADVENTURE: 'bg-orange-100 text-orange-800',
      ROMANTIC: 'bg-pink-100 text-pink-800',
      EDUCATIONAL: 'bg-indigo-100 text-indigo-800',
      CULTURAL: 'bg-yellow-100 text-yellow-800',
      WELLNESS: 'bg-teal-100 text-teal-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const tripTypeOptions: Array<{ label: string; value: TripType | 'ALL' }> = [
    { label: 'All Types', value: 'ALL' },
    { label: 'Business', value: 'BUSINESS' },
    { label: 'Leisure', value: 'LEISURE' },
    { label: 'Family', value: 'FAMILY' },
    { label: 'Adventure', value: 'ADVENTURE' },
    { label: 'Romantic', value: 'ROMANTIC' },
    { label: 'Educational', value: 'EDUCATIONAL' },
    { label: 'Cultural', value: 'CULTURAL' },
    { label: 'Wellness', value: 'WELLNESS' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-4 py-6 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">Trip Templates</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={onClose}
              className="p-2"
            >
              <X width={24} height={24} color="#6B7280" />
            </Button>
          </View>
          <Text className="text-gray-600 mt-1">Choose a template to get started quickly</Text>
        </View>

        {showCustomization && selectedTemplate ? (
          /* Template Customization View */
          <View className="flex-1">
            <View className="px-4 py-4 border-b border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowCustomization(false)}
                className="self-start mb-2"
              >
                <Text className="text-blue-600">← Back to Templates</Text>
              </Button>
              <Text className="text-lg font-semibold text-gray-900">Customize Your Trip</Text>
              <Text className="text-gray-600">Template: {selectedTemplate.name}</Text>
            </View>

            <ScrollView className="flex-1 px-4 py-6">
              <View className="space-y-6">
                {/* Destination */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    <MapPin width={14} height={14} color="#6B7280" /> Destination
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-2">
                      {selectedTemplate.destinations.map((destination) => (
                        <Button
                          key={destination}
                          variant={customizations.destination === destination ? 'default' : 'outline'}
                          size="sm"
                          onPress={() => setCustomizations(prev => ({ ...prev, destination }))}
                        >
                          <Text className={customizations.destination === destination ? 'text-white' : 'text-gray-700'}>
                            {destination}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Duration */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    <Clock width={14} height={14} color="#6B7280" /> Duration
                  </Text>
                  <View className="flex-row space-x-2">
                    {[3, 5, 7, 10, 14].map((days) => (
                      <Button
                        key={days}
                        variant={customizations.duration === days ? 'default' : 'outline'}
                        size="sm"
                        onPress={() => setCustomizations(prev => ({ ...prev, duration: days }))}
                      >
                        <Text className={customizations.duration === days ? 'text-white' : 'text-gray-700'}>
                          {days} days
                        </Text>
                      </Button>
                    ))}
                  </View>
                </View>

                {/* Budget */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Budget (USD)</Text>
                  <Input
                    placeholder="Enter budget amount"
                    value={customizations.budget?.toString() || ''}
                    onChangeText={(value) => setCustomizations(prev => ({ 
                      ...prev, 
                      budget: parseInt(value) || 0 
                    }))}
                    keyboardType="numeric"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Suggested: ${selectedTemplate.suggestedBudget.min} - ${selectedTemplate.suggestedBudget.max}
                  </Text>
                </View>

                {/* Activities Preview */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Included Activities</Text>
                  <View className="flex-row flex-wrap">
                    {selectedTemplate.activities.map((activity, index) => (
                      <View key={index} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-2">
                        <Text className="text-gray-700 text-xs">{activity}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Packing List Preview */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Suggested Packing Items</Text>
                  <View className="flex-row flex-wrap">
                    {selectedTemplate.packingItems.slice(0, 6).map((item, index) => (
                      <View key={index} className="bg-blue-50 px-2 py-1 rounded-full mr-2 mb-2">
                        <Text className="text-blue-700 text-xs">{item}</Text>
                      </View>
                    ))}
                    {selectedTemplate.packingItems.length > 6 && (
                      <View className="bg-gray-100 px-2 py-1 rounded-full">
                        <Text className="text-gray-600 text-xs">+{selectedTemplate.packingItems.length - 6} more</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="px-4 py-4 border-t border-gray-100">
              <Button
                onPress={handleCustomizedCreate}
                className="bg-blue-600 mb-2"
              >
                <Text className="text-white font-medium">Create Trip from Template</Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => handleQuickCreate(selectedTemplate)}
              >
                <Text className="text-gray-700">Use Default Settings</Text>
              </Button>
            </View>
          </View>
        ) : (
          /* Templates List View */
          <View className="flex-1">
            {/* Filter Tabs */}
            <View className="px-4 py-3 border-b border-gray-100">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {tripTypeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filterType === option.value ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => setFilterType(option.value)}
                    >
                      <Text className={filterType === option.value ? 'text-white' : 'text-gray-700'}>
                        {option.label}
                      </Text>
                    </Button>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Templates Grid */}
            <ScrollView className="flex-1 px-4 py-6">
              <View className="flex-row flex-wrap justify-between">
                {filteredTemplates.map((template) => (
                  <View key={template.id} className="w-[48%] mb-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Template Card */}
                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className={`px-2 py-1 rounded-full ${getTripTypeColor(template.tripType)}`}>
                          <Text className="text-xs font-medium">{template.tripType}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Bookmark width={12} height={12} color="#F59E0B" />
                          <Text className="text-xs text-gray-500 ml-1">{template.popularity}%</Text>
                        </View>
                      </View>

                      <Text className="font-semibold text-gray-900 mb-1" numberOfLines={2}>
                        {template.name}
                      </Text>
                      <Text className="text-xs text-gray-600 mb-3" numberOfLines={2}>
                        {template.description}
                      </Text>

                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <Clock width={12} height={12} color="#6B7280" />
                          <Text className="text-xs text-gray-500 ml-1">{template.defaultDuration} days</Text>
                        </View>
                        <Text className="text-xs text-gray-500">
                          ${template.suggestedBudget.min}+
                        </Text>
                      </View>

                      <View className="space-y-2">
                        <Button
                          onPress={() => handleTemplateSelect(template)}
                          size="sm"
                          className="bg-blue-600"
                        >
                          <Text className="text-white font-medium text-xs">Customize & Create</Text>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => handleQuickCreate(template)}
                        >
                          <Text className="text-gray-700 text-xs">Quick Create</Text>
                        </Button>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}