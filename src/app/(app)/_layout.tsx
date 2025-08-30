import { Link, Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect } from 'react';

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
              tabBarInactiveTintColor: '#737373', // Neutral gray
              tabBarStyle: {
                backgroundColor: 'white',
                borderTopColor: '#e5e5e5',
                paddingBottom: 8,
                paddingTop: 8,
                height: 88,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 8,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
                marginTop: 4,
              },
              headerStyle: {
                backgroundColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              },
              headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
                color: '#171717',
              },
              headerTintColor: '#0ea5e9',
            })}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
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
                headerShown: false,
                tabBarIcon: ({ color }) => <TripsIcon color={color} />,
                tabBarButtonTestID: 'trips-tab',
              }}
            />

            <Tabs.Screen
              name="explore"
              options={{
                title: 'Explore',
                headerShown: false,
                tabBarIcon: ({ color }) => <ExploreIcon color={color} />,
                tabBarButtonTestID: 'explore-tab',
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
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
      <Pressable>
        <Text className="px-3 font-medium text-primary-500">+ Trip</Text>
      </Pressable>
    </Link>
  );
};
