/**
 * Location Search Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Autocomplete location search input
 */

import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { MapPin, Search, X } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

interface LocationSuggestion {
  id: string;
  name: string;
  country: string;
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'city' | 'country' | 'region' | 'landmark';
}

interface LocationSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  onLocationSelect?: (location: LocationSuggestion) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

// Mock data for demonstration - in real implementation, this would come from a geocoding API
const mockSuggestions: LocationSuggestion[] = [
  {
    id: '1',
    name: 'New York',
    country: 'United States',
    region: 'New York',
    coordinates: { lat: 40.7128, lng: -74.006 },
    type: 'city',
  },
  {
    id: '2',
    name: 'London',
    country: 'United Kingdom',
    region: 'England',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    type: 'city',
  },
  {
    id: '3',
    name: 'Paris',
    country: 'France',
    region: 'Île-de-France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    type: 'city',
  },
  {
    id: '4',
    name: 'Tokyo',
    country: 'Japan',
    region: 'Kantō',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    type: 'city',
  },
  {
    id: '5',
    name: 'Sydney',
    country: 'Australia',
    region: 'New South Wales',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    type: 'city',
  },
];

export function LocationSearch({
  value,
  onValueChange,
  onLocationSelect,
  placeholder = 'Search destinations...',
  error,
  className = '',
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (value.length >= 2) {
      // Simulate API call with mock data
      const filtered = mockSuggestions.filter(
        (location) =>
          location.name.toLowerCase().includes(value.toLowerCase()) ||
          location.country.toLowerCase().includes(value.toLowerCase()) ||
          location.region?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleLocationSelect = (location: LocationSuggestion) => {
    const displayName = location.region
      ? `${location.name}, ${location.region}, ${location.country}`
      : `${location.name}, ${location.country}`;

    onValueChange(displayName);
    onLocationSelect?.(location);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearInput = () => {
    onValueChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const renderSuggestion = ({ item }: { item: LocationSuggestion }) => (
    <Pressable
      onPress={() => handleLocationSelect(item)}
      className="flex-row items-center border-b border-gray-100 px-4 py-3"
      android_ripple={{ color: '#f3f4f6' }}
    >
      <MapPin width={18} height={18} color="#6B7280" />
      <View className="ml-3 flex-1">
        <Text className="font-medium text-gray-900">{item.name}</Text>
        <Text className="text-sm text-gray-600">
          {item.region ? `${item.region}, ${item.country}` : item.country}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View className={className}>
      {/* Search Input */}
      <View className="relative">
        <View
          className={`
          flex-row items-center rounded-lg border bg-white p-3
          ${error ? 'border-red-500' : isFocused ? 'border-blue-500' : 'border-gray-300'}
        `}
        >
          <Search width={20} height={20} color="#6B7280" />

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onValueChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              // Delay hiding suggestions to allow for selection
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            className="ml-3 flex-1 text-base text-gray-900"
            autoCapitalize="words"
            autoCorrect={false}
          />

          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onPress={clearInput}
              className="p-1"
            >
              <X width={18} height={18} color="#6B7280" />
            </Button>
          )}
        </View>

        {/* Error Message */}
        {error && <Text className="mt-1 text-sm text-red-600">{error}</Text>}
      </View>

      {/* Suggestions List */}
      {showSuggestions && suggestions.length > 0 && (
        <View className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 rounded-lg border border-gray-200 bg-white shadow-lg">
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestion}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {/* No Results */}
      {showSuggestions && value.length >= 2 && suggestions.length === 0 && (
        <View className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          <View className="items-center px-4 py-6">
            <MapPin width={24} height={24} color="#9CA3AF" />
            <Text className="mt-2 text-center text-gray-500">
              No destinations found for "{value}"
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Try searching for a city, country, or landmark
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
