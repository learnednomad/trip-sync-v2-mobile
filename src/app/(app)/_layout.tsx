import { Link, Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import {
  GlobalLoadingOverlay,
  NotificationBell,
  Pressable,
  Text,
  View,
} from '@/components/ui';
import {
  Home as HomeIcon,
  MapPin as TripsIcon,
  Search as ExploreIcon,
  Settings as SettingsIcon,
} from '@/components/ui/icons';
import { useAuth, useIsFirstTime } from '@/lib';
import { AuthGuard } from '@/lib/auth/route-guards';
import { ModalManagerProvider } from '@/lib/navigation/modal-manager';
import { TripNavigationProvider } from '@/lib/navigation/trip-context';

export default function TabLayout() {
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    if (status !== 'idle') {
      setTimeout(() => {
        hideSplash();
      }, 1000);
    }
  }, [hideSplash, status]);

  if (isFirstTime) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <AuthGuard fallbackRoute="/(auth)/login">
      <TripNavigationProvider>
        <ModalManagerProvider>
          <Tabs
            screenOptions={({ route }) => ({
              tabBarActiveTintColor: '#0ea5e9', // Primary blue
              tabBarInactiveTintColor: isDarkMode ? '#a1a1aa' : '#737373', // Adaptive gray
              tabBarAccessibilityRole: 'tablist',
              tabBarStyle: {
                backgroundColor: isDarkMode ? '#18181b' : 'white',
                borderTopColor: isDarkMode ? '#3f3f46' : '#e5e5e5',
                paddingBottom: 12, // Increased for better touch targets
                paddingTop: 8,
                height: 88,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: isDarkMode ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: isDarkMode ? 12 : 8,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
                marginTop: 6, // Increased spacing for better accessibility
                paddingHorizontal: 4, // Added horizontal padding
              },
              headerStyle: {
                backgroundColor: isDarkMode ? '#18181b' : 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDarkMode ? 0.2 : 0.1,
                shadowRadius: 4,
                elevation: isDarkMode ? 8 : 4,
              },
              headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
                color: isDarkMode ? '#fafafa' : '#171717',
              },
              headerTintColor: '#0ea5e9',
            })}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarAccessibilityLabel: 'Home, tab 1 of 4',
                tabBarAccessibilityHint: 'Navigate to home screen',
                tabBarAccessibilityRole: 'tab',
                tabBarAllowFontScaling: true,
                tabBarIcon: ({ color }) => <HomeIcon color={color} />,
                headerRight: () => (
                  <View className="flex-row items-center">
                    <NotificationBell />
                    <QuickActionButton />
                  </View>
                ),
                tabBarButtonTestID: 'home-tab',
              }}
            />

            <Tabs.Screen
              name="trips"
              options={{
                title: 'My Trips',
                tabBarAccessibilityLabel: 'My Trips, tab 2 of 4',
                tabBarAccessibilityHint: 'Navigate to your trips list',
                tabBarAccessibilityRole: 'tab',
                headerShown: false,
                tabBarIcon: ({ color }) => <TripsIcon color={color} />,
                tabBarButtonTestID: 'trips-tab',
              }}
            />

            <Tabs.Screen
              name="explore"
              options={{
                title: 'Explore',
                tabBarAccessibilityLabel: 'Explore, tab 3 of 4',
                tabBarAccessibilityHint: 'Discover new destinations and experiences',
                tabBarAccessibilityRole: 'tab',
                headerShown: false,
                tabBarIcon: ({ color }) => <ExploreIcon color={color} />,
                tabBarButtonTestID: 'explore-tab',
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                tabBarAccessibilityLabel: 'Settings, tab 4 of 4',
                tabBarAccessibilityHint: 'Access app settings and preferences',
                tabBarAccessibilityRole: 'tab',
                headerShown: false,
                tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
                tabBarButtonTestID: 'settings-tab',
              }}
            />
          </Tabs>
          <GlobalLoadingOverlay />
        </ModalManagerProvider>
      </TripNavigationProvider>
    </AuthGuard>
  );
}

const QuickActionButton = () => {
  return (
    <Link href="/(app)/trips/create" asChild>
      <Pressable 
        style={{
          minHeight: 44, // iOS minimum touch target
          minWidth: 44,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Create new trip"
        accessibilityHint="Opens the trip creation form">
        <Text className="font-medium text-primary-500 dark:text-primary-400">+ Trip</Text>
      </Pressable>
    </Link>
  );
};
