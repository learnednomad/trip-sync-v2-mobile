/**
 * Drag-and-Drop Manager
 * Handles activity reordering and cross-day movement
 */

import React, { createContext, useContext, useState } from 'react';
import { View } from 'react-native';
import { 
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface DragDropContextType {
  // Drag state
  isDragging: boolean;
  draggedActivityId: string | null;
  dropZone: string | null;
  
  // Actions
  startDrag: (activityId: string) => void;
  endDrag: () => void;
  setDropZone: (zone: string | null) => void;
  
  // Drop handlers
  onDropToTimeSlot: (activityId: string, timeSlot: string, date: string) => void;
  onReorderActivities: (fromIndex: number, toIndex: number) => void;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

/**
 * Drag-and-drop provider for timeline
 */
export const DragDropProvider: React.FC<{
  children: React.ReactNode;
  onActivityMove?: (activityId: string, newTime: string, newDate: string) => void;
  onActivityReorder?: (activityId: string, newOrder: number) => void;
}> = ({ children, onActivityMove, onActivityReorder }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<string | null>(null);

  const contextValue: DragDropContextType = {
    isDragging,
    draggedActivityId,
    dropZone,
    
    startDrag: (activityId: string) => {
      setIsDragging(true);
      setDraggedActivityId(activityId);
    },
    
    endDrag: () => {
      setIsDragging(false);
      setDraggedActivityId(null);
      setDropZone(null);
    },
    
    setDropZone: (zone: string | null) => {
      setDropZone(zone);
    },
    
    onDropToTimeSlot: (activityId: string, timeSlot: string, date: string) => {
      const newStartTime = `${date}T${timeSlot}:00`;
      onActivityMove?.(activityId, newStartTime, date);
    },
    
    onReorderActivities: (fromIndex: number, toIndex: number) => {
      // Calculate new order for the activity
      const newOrder = toIndex;
      if (draggedActivityId) {
        onActivityReorder?.(draggedActivityId, newOrder);
      }
    },
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
};

/**
 * Hook for accessing drag-and-drop context
 */
export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  
  return context;
};

/**
 * Draggable activity card wrapper
 */
export const DraggableActivityCard: React.FC<{
  activityId: string;
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: (dropInfo: { timeSlot?: string; date?: string }) => void;
}> = ({ activityId, children, onDragStart, onDragEnd }) => {
  const { startDrag, endDrag, setDropZone } = useDragDrop();
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Start drag animation
      scale.value = withSpring(1.05, { damping: 15 });
      opacity.value = withTiming(0.9);
      
      // Notify context
      runOnJS(startDrag)(activityId);
      runOnJS(onDragStart || (() => {}))();
    },
    
    onActive: (event) => {
      // Follow gesture
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Determine drop zone based on position
      if (Math.abs(event.translationY) > 50) {
        if (event.translationY < -50) {
          runOnJS(setDropZone)('time-slot-above');
        } else {
          runOnJS(setDropZone)('time-slot-below');
        }
      } else {
        runOnJS(setDropZone)(null);
      }
    },
    
    onEnd: (event) => {
      // Animate back to original position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withTiming(1);
      
      // Determine drop action
      let dropInfo: { timeSlot?: string; date?: string } = {};
      
      if (Math.abs(event.translationY) > 80) {
        // Dropped into different time slot
        // This would be calculated based on drop position
        dropInfo = {
          timeSlot: '12:00', // Calculated from drop position
          date: new Date().toISOString().split('T')[0], // Current date or calculated
        };
      }
      
      // Notify handlers
      runOnJS(endDrag)();
      runOnJS(onDragEnd || (() => {}))(dropInfo);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: scale.value > 1 ? 1000 : 1, // Bring to front while dragging
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

/**
 * Drop zone component for time slots
 */
export const DropZone: React.FC<{
  timeSlot: string;
  date: string;
  isActive?: boolean;
  onDrop?: (activityId: string) => void;
  children: React.ReactNode;
}> = ({ timeSlot, date, isActive = false, onDrop, children }) => {
  const { draggedActivityId, isDragging } = useDragDrop();

  const handleDrop = () => {
    if (draggedActivityId && onDrop) {
      onDrop(draggedActivityId);
    }
  };

  return (
    <View
      className={`relative ${
        isDragging && isActive 
          ? 'bg-primary-50 dark:bg-primary-900 border-2 border-dashed border-primary-300 dark:border-primary-600 rounded-lg' 
          : ''
      }`}
      onTouchEnd={handleDrop}
    >
      {children}
      
      {/* Drop indicator */}
      {isDragging && isActive && (
        <View className="absolute inset-0 items-center justify-center bg-primary-100 dark:bg-primary-800 bg-opacity-50 rounded-lg">
          <Text className="text-sm font-medium text-primary-700 dark:text-primary-300">
            Drop here
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Reorderable list for activities
 */
export const ReorderableActivityList: React.FC<{
  activities: any[];
  renderActivity: (activity: any, index: number) => React.ReactNode;
  onReorder: (fromIndex: number, toIndex: number) => void;
}> = ({ activities, renderActivity, onReorder }) => {
  const { isDragging } = useDragDrop();

  return (
    <View className={`space-y-2 ${isDragging ? 'pointer-events-none' : ''}`}>
      {activities.map((activity, index) => (
        <View key={activity.id} className="relative">
          {renderActivity(activity, index)}
        </View>
      ))}
    </View>
  );
};