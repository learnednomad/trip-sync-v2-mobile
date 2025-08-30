/**
 * AI-Powered Trip Suggestions
 * Intelligent recommendations and trip optimization
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';

import { 
  Text, 
  Button, 
  Card, 
  Badge, 
  ActivityIndicator 
} from '@/components/ui';
import {
  Sparkles as AIIcon,
  MapPin as LocationIcon,
  Clock as TimeIcon,
  TrendingUp as OptimizeIcon,
  Star as RatingIcon,
} from '@/components/ui/icons';

interface AISuggestion {
  id: string;
  type: 'activity' | 'restaurant' | 'optimization' | 'budget' | 'weather';
  title: string;
  description: string;
  confidence: number; // 0-1
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDuration?: number; // minutes
  rating?: number; // 0-5
  tags: string[];
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface AISuggestionsProps {
  tripId: string;
  destination: string;
  preferences?: {
    budget: 'low' | 'medium' | 'high';
    interests: string[];
    travelStyle: 'relaxed' | 'packed' | 'adventure';
  };
}

/**
 * AI-powered suggestions component
 */
export const AISuggestions: React.FC<AISuggestionsProps> = ({
  tripId,
  destination,
  preferences = { budget: 'medium', interests: [], travelStyle: 'relaxed' },
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<AISuggestion['type'] | 'all'>('all');

  // Simulate AI suggestions (would integrate with actual AI service)
  useEffect(() => {
    loadAISuggestions();
  }, [destination, preferences]);

  const loadAISuggestions = async () => {
    setIsLoading(true);
    
    // Simulate AI API call delay
    setTimeout(() => {
      const mockSuggestions: AISuggestion[] = [
        {
          id: '1',
          type: 'activity',
          title: 'Visit Tokyo Skytree',
          description: 'Iconic tower with panoramic city views. Best visited in early morning or sunset for optimal lighting.',
          confidence: 0.92,
          location: { name: 'Tokyo Skytree', coordinates: { lat: 35.7101, lng: 139.8107 } },
          estimatedCost: { min: 15, max: 25, currency: 'USD' },
          estimatedDuration: 120,
          rating: 4.5,
          tags: ['sightseeing', 'iconic', 'views', 'photography'],
          actionable: true,
          priority: 'high',
        },
        {
          id: '2',
          type: 'restaurant',
          title: 'Sushi Jiro (Alternative)',
          description: 'While Jiro is booked, try Sushi Yoshitake for equally exceptional omakase experience.',
          confidence: 0.88,
          location: { name: 'Sushi Yoshitake', coordinates: { lat: 35.6762, lng: 139.7653 } },
          estimatedCost: { min: 200, max: 300, currency: 'USD' },
          estimatedDuration: 90,
          rating: 4.8,
          tags: ['dining', 'sushi', 'fine dining', 'michelin'],
          actionable: true,
          priority: 'medium',
        },
        {
          id: '3',
          type: 'optimization',
          title: 'Optimize Day 3 Route',
          description: 'Reorder activities to reduce travel time by 45 minutes and save $12 in transportation.',
          confidence: 0.95,
          tags: ['optimization', 'efficiency', 'savings'],
          actionable: true,
          priority: 'high',
        },
        {
          id: '4',
          type: 'weather',
          title: 'Indoor Activities for Day 5',
          description: 'Rain expected on Day 5. Consider visiting museums, shopping centers, or indoor experiences.',
          confidence: 0.76,
          tags: ['weather', 'backup plan', 'indoor'],
          actionable: true,
          priority: 'medium',
        },
      ];
      
      setSuggestions(mockSuggestions);
      setIsLoading(false);
    }, 1500);
  };

  const filteredSuggestions = selectedType === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.type === selectedType);

  const suggestionTypes = [
    { key: 'all', label: 'All', count: suggestions.length },
    { key: 'activity', label: 'Activities', count: suggestions.filter(s => s.type === 'activity').length },
    { key: 'restaurant', label: 'Dining', count: suggestions.filter(s => s.type === 'restaurant').length },
    { key: 'optimization', label: 'Optimize', count: suggestions.filter(s => s.type === 'optimization').length },
  ];

  const addSuggestionToTimeline = (suggestion: AISuggestion) => {
    // Would integrate with timeline to add activity
    console.log('Adding suggestion to timeline:', suggestion.title);
  };

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <View className="p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <AIIcon color="#f59e0b" width={24} height={24} />
            <Text className="ml-2 text-xl font-bold text-neutral-900 dark:text-white">
              AI Suggestions
            </Text>
          </View>
          
          <Button
            variant="outline"
            size="sm"
            onPress={loadAISuggestions}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text className="text-neutral-700 dark:text-neutral-300 text-sm">Refresh</Text>
            )}
          </Button>
        </View>

        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          Personalized recommendations for {destination}
        </Text>
      </View>

      {/* Type Filter */}
      <View className="p-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            {suggestionTypes.map((type) => (
              <Button
                key={type.key}
                variant={selectedType === type.key ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setSelectedType(type.key as any)}
                className="flex-row items-center"
              >
                <Text className={selectedType === type.key ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}>
                  {type.label}
                </Text>
                {type.count > 0 && (
                  <Badge 
                    variant={selectedType === type.key ? 'secondary' : 'primary'}
                    size="sm"
                    className="ml-2"
                  >
                    {type.count}
                  </Badge>
                )}
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Suggestions List */}
      <ScrollView className="flex-1 px-4 pb-4">
        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base text-neutral-600 dark:text-neutral-400">
              Generating AI suggestions...
            </Text>
          </View>
        ) : filteredSuggestions.length === 0 ? (
          <Card>
            <Card.Body className="items-center py-8">
              <AIIcon color="#a3a3a3" width={32} height={32} />
              <Text className="mt-4 text-base font-medium text-neutral-900 dark:text-white text-center">
                No Suggestions Available
              </Text>
              <Text className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 text-center">
                AI suggestions will appear based on your trip details and preferences
              </Text>
            </Card.Body>
          </Card>
        ) : (
          <View className="space-y-3">
            {filteredSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAdd={() => addSuggestionToTimeline(suggestion)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * Individual suggestion card
 */
const SuggestionCard: React.FC<{
  suggestion: AISuggestion;
  onAdd: () => void;
}> = ({ suggestion, onAdd }) => {
  const confidenceColor = suggestion.confidence > 0.8 ? 'success' : suggestion.confidence > 0.6 ? 'warning' : 'error';
  const priorityColor = suggestion.priority === 'high' ? 'error' : suggestion.priority === 'medium' ? 'warning' : 'primary';

  return (
    <Card>
      <Card.Body>
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {suggestion.title}
              </Text>
              <Badge variant={priorityColor} size="sm" className="ml-2">
                {suggestion.priority}
              </Badge>
            </View>
            
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              {suggestion.description}
            </Text>
          </View>
        </View>

        {/* Suggestion Details */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-4">
            {suggestion.location && (
              <View className="flex-row items-center">
                <LocationIcon color="#737373" width={14} height={14} />
                <Text className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {suggestion.location.name}
                </Text>
              </View>
            )}
            
            {suggestion.estimatedDuration && (
              <View className="flex-row items-center">
                <TimeIcon color="#737373" width={14} height={14} />
                <Text className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {Math.round(suggestion.estimatedDuration / 60)}h
                </Text>
              </View>
            )}
            
            {suggestion.rating && (
              <View className="flex-row items-center">
                <RatingIcon color="#f59e0b" width={14} height={14} />
                <Text className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {suggestion.rating}
                </Text>
              </View>
            )}
          </View>
          
          <Badge variant={confidenceColor} size="sm">
            {Math.round(suggestion.confidence * 100)}% match
          </Badge>
        </View>

        {/* Tags */}
        <View className="flex-row flex-wrap mb-3">
          {suggestion.tags.slice(0, 4).map((tag) => (
            <Badge 
              key={tag} 
              variant="outline" 
              size="sm" 
              className="mr-2 mb-1"
            >
              {tag}
            </Badge>
          ))}
        </View>

        {/* Action Buttons */}
        {suggestion.actionable && (
          <View className="flex-row space-x-2">
            <Button 
              variant="primary" 
              size="sm" 
              onPress={onAdd}
              className="flex-1"
            >
              <Text className="text-white font-medium text-sm">
                {suggestion.type === 'optimization' ? 'Apply' : 'Add to Timeline'}
              </Text>
            </Button>
            
            <Button variant="ghost" size="sm">
              <Text className="text-neutral-600 dark:text-neutral-400 text-sm">
                Not Interested
              </Text>
            </Button>
          </View>
        )}
      </Card.Body>
    </Card>
  );
};