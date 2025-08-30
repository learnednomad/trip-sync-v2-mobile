import { Link } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { ChevronRight as ChevronRightIcon } from '@/components/ui/icons';

import { Text } from './text';

interface BreadcrumbItem {
  label: string;
  route?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  maxItems?: number;
}

/**
 * Breadcrumb navigation component
 * Shows navigation hierarchy with clickable links
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  maxItems = 3,
}) => {
  // Show ellipsis if too many items
  const shouldTruncate = items.length > maxItems;
  const displayItems = shouldTruncate
    ? [
        items[0], // First item (Home)
        { label: '...' }, // Ellipsis
        ...items.slice(-2), // Last 2 items
      ]
    : items;

  return (
    <View className={`flex-row items-center px-4 py-2 ${className}`}>
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isEllipsis = item.label === '...';

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {isEllipsis ? (
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                ...
              </Text>
            ) : item.route && !isLast ? (
              <Link href={item.route as any} asChild>
                <Text className="text-sm text-primary-600 active:text-primary-700 dark:text-primary-400 dark:active:text-primary-300">
                  {item.label}
                </Text>
              </Link>
            ) : (
              <Text
                className={`text-sm ${
                  isLast
                    ? 'font-medium text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {item.label}
              </Text>
            )}

            {!isLast && (
              <View className="mx-2">
                <ChevronRightIcon color="#a3a3a3" width={12} height={12} />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

/**
 * Trip-specific breadcrumb component
 */
interface TripBreadcrumbsProps {
  className?: string;
}

export const TripBreadcrumbs: React.FC<TripBreadcrumbsProps> = ({
  className = '',
}) => {
  // This would use useTripBreadcrumbs hook when navigation context is implemented
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', route: '/(app)' },
    { label: 'Trips', route: '/(app)/trips' },
    { label: 'Current Trip' }, // Would be dynamic
  ];

  return <Breadcrumbs items={breadcrumbs} className={className} />;
};
