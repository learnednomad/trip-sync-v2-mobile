/**
 * Activity Card Component
 * Draggable activity card with comprehensive details
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { format } from 'date-fns';

import { 
  Text, 
  Badge, 
  Button,
  Card 
} from '@/components/ui';
import {
  Clock as ClockIcon,
  MapPin as LocationIcon,
  DollarSign as CostIcon,
  MoreHorizontal as MoreIcon,
  Settings as EditIcon,
  Trash2 as DeleteIcon,
} from '@/components/ui/icons';

interface ActivityCardProps {
  activity: ItineraryItem;
  onUpdate?: (updates: Partial<ItineraryItem>) => void;
  onDelete?: () => void;
  showTime?: boolean;
  isDragging?: boolean;
  className?: string;
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

const activityTypeConfig = {
  transportation: { color: '#0ea5e9', icon: '✈️', label: 'Transport' },
  accommodation: { color: '#8b5cf6', icon: '🏨', label: 'Hotel' },
  dining: { color: '#f59e0b', icon: '🍽️', label: 'Dining' },
  sightseeing: { color: '#22c55e', icon: '🏛️', label: 'Sightseeing' },
  entertainment: { color: '#ec4899', icon: '🎭', label: 'Entertainment' },
  shopping: { color: '#06b6d4', icon: '🛍️', label: 'Shopping' },
  meeting: { color: '#64748b', icon: '👥', label: 'Meeting' },
  custom: { color: '#6b7280', icon: '📝', label: 'Activity' },
};

const statusConfig = {
  planned: { color: '#f59e0b', label: 'Planned' },
  confirmed: { color: '#22c55e', label: 'Confirmed' },
  completed: { color: '#6b7280', label: 'Completed' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
};

/**
 * Activity card with comprehensive details and actions
 */
export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onUpdate,
  onDelete,
  showTime = false,
  isDragging = false,
  className = '',
}) => {
  const [showActions, setShowActions] = React.useState(false);
  
  const typeConfig = activityTypeConfig[activity.type as keyof typeof activityTypeConfig] || activityTypeConfig.custom;
  const statusInfo = statusConfig[activity.status];
  
  const duration = React.useMemo(() => {
    const start = new Date(activity.startTime);
    const end = new Date(activity.endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  }, [activity.startTime, activity.endTime]);

  const handleStatusChange = (newStatus: ItineraryItem['status']) => {
    onUpdate?.({ status: newStatus });
  };

  return (
    <Card
      className={`${className} ${isDragging ? 'opacity-70 scale-105' : ''}`}
      variant={activity.status === 'cancelled' ? 'error' : 'default'}
      interactive={!isDragging}
    >
      <Card.Body>
        {/* Activity Header */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-3">{typeConfig.icon}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {activity.title || 'Untitled Activity'}
              </Text>
              {activity.description && (
                <Text className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {activity.description}
                </Text>
              )}
            </View>
          </View>
          
          <View className="flex-row items-center space-x-2">
            <Badge 
              variant={activity.status === 'confirmed' ? 'success' : 'warning'}
              size="sm"
            >
              {statusInfo.label}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setShowActions(!showActions)}
            >
              <MoreIcon color="#a3a3a3" width={16} height={16} />
            </Button>
          </View>
        </View>

        {/* Activity Details */}
        <View className="space-y-2">
          {/* Time */}
          <View className="flex-row items-center">
            <ClockIcon color="#737373" width={16} height={16} />
            <Text className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
              {format(new Date(activity.startTime), 'h:mm a')} - {format(new Date(activity.endTime), 'h:mm a')}
              <Text className="text-neutral-500 dark:text-neutral-400"> ({duration})</Text>
            </Text>
          </View>

          {/* Location */}
          {activity.location && (
            <View className="flex-row items-center">
              <LocationIcon color="#737373" width={16} height={16} />
              <Text className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                {activity.location.name}
              </Text>
            </View>
          )}

          {/* Cost */}
          {activity.cost && (
            <View className="flex-row items-center">
              <CostIcon color="#737373" width={16} height={16} />
              <Text className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                {activity.cost.currency} {activity.cost.amount.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Type Badge */}
          <View className="flex-row items-center justify-between mt-3">
            <Badge 
              variant="primary" 
              size="sm"
              className="bg-opacity-10"
              style={{ backgroundColor: `${typeConfig.color}20` }}
            >
              <Text style={{ color: typeConfig.color }}>
                {typeConfig.label}
              </Text>
            </Badge>
            
            {showTime && (
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {format(new Date(activity.startTime), 'MMM d, h:mm a')}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View className="flex-row space-x-2 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                // Edit activity - would open activity form modal
                console.log('Edit activity:', activity.id);
              }}
              className="flex-1"
            >
              <EditIcon color="#737373" width={14} height={14} />
              <Text className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                Edit
              </Text>
            </Button>
            
            {/* Status Quick Actions */}
            {activity.status === 'planned' && (
              <Button
                variant="success"
                size="sm"
                onPress={() => handleStatusChange('confirmed')}
                className="flex-1"
              >
                <Text className="text-sm text-white">Confirm</Text>
              </Button>
            )}
            
            {activity.status === 'confirmed' && (
              <Button
                variant="primary"
                size="sm"
                onPress={() => handleStatusChange('completed')}
                className="flex-1"
              >
                <Text className="text-sm text-white">Complete</Text>
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onPress={onDelete}
              className="px-3"
            >
              <DeleteIcon color="white" width={14} height={14} />
            </Button>
          </View>
        )}
      </Card.Body>
    </Card>
  );
};