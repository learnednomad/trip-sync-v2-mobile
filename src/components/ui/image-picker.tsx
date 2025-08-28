/**
 * Image Picker Component
 * Allows users to select images from gallery or camera
 */

import React, { useState } from 'react';
import { View, Pressable, Image, Alert } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

interface ImagePickerProps {
  imageUri?: string;
  onImageSelect: (uri: string) => void;
  placeholder?: string;
  className?: string;
}

export function ImagePicker({ 
  imageUri, 
  onImageSelect, 
  placeholder = "Add an image", 
  className = '' 
}: ImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera roll permissions to select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera: boolean = false) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = useCamera
        ? await ImagePickerExpo.launchCameraAsync({
            mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          })
        : await ImagePickerExpo.launchImageLibraryAsync({
            mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select an image',
      [
        { text: 'Camera', onPress: () => pickImage(true) },
        { text: 'Gallery', onPress: () => pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeImage = () => {
    onImageSelect('');
  };

  if (imageUri) {
    return (
      <View className={`relative ${className}`}>
        <Image
          source={{ uri: imageUri }}
          className="w-full h-40 rounded-lg bg-gray-100"
          resizeMode="cover"
        />
        <View className="absolute top-2 right-2 flex-row space-x-2">
          <Button
            onPress={showImagePicker}
            size="sm"
            className="bg-white/90 px-3 py-1"
          >
            <Text className="text-gray-700 text-sm">Change</Text>
          </Button>
          <Button
            onPress={removeImage}
            size="sm"
            variant="outline"
            className="bg-white/90 border-red-300 px-3 py-1"
          >
            <Text className="text-red-600 text-sm">Remove</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={showImagePicker}
      disabled={isLoading}
      className={`border-2 border-dashed border-gray-300 rounded-lg h-40 items-center justify-center bg-gray-50 ${className}`}
    >
      <View className="items-center space-y-2">
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
          <Text className="text-gray-400 text-xl">📷</Text>
        </View>
        <Text className="text-gray-600 font-medium">
          {isLoading ? 'Loading...' : placeholder}
        </Text>
        <Text className="text-gray-400 text-sm">
          Tap to {isLoading ? 'wait...' : 'select image'}
        </Text>
      </View>
    </Pressable>
  );
}