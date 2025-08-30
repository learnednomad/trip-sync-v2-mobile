import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

const card = tv({
  slots: {
    container: 'overflow-hidden rounded-lg border bg-white dark:bg-neutral-900',
    header: 'border-b px-4 py-3',
    body: 'p-4',
    footer: 'border-t bg-neutral-50 px-4 py-3 dark:bg-neutral-800',
  },
  variants: {
    variant: {
      default: {
        container: 'border-neutral-200 dark:border-neutral-700',
        header: 'border-neutral-200 dark:border-neutral-700',
        footer: 'border-neutral-200 dark:border-neutral-700',
      },
      elevated: {
        container: 'border-neutral-200 shadow-md dark:border-neutral-700',
        header: 'border-neutral-200 dark:border-neutral-700',
        footer: 'border-neutral-200 dark:border-neutral-700',
      },
      outlined: {
        container: 'border-2 border-primary-200 dark:border-primary-700',
        header: 'border-primary-200 dark:border-primary-700',
        footer: 'border-primary-200 dark:border-primary-700',
      },
      success: {
        container:
          'border-success-200 bg-success-50 dark:bg-success-900 dark:border-success-700',
        header: 'border-success-200 dark:border-success-700',
        footer:
          'border-success-200 bg-success-100 dark:bg-success-800 dark:border-success-700',
      },
      warning: {
        container:
          'border-warning-200 bg-warning-50 dark:bg-warning-900 dark:border-warning-700',
        header: 'border-warning-200 dark:border-warning-700',
        footer:
          'border-warning-200 bg-warning-100 dark:bg-warning-800 dark:border-warning-700',
      },
      error: {
        container:
          'border-error-200 bg-error-50 dark:bg-error-900 dark:border-error-700',
        header: 'border-error-200 dark:border-error-700',
        footer:
          'border-error-200 bg-error-100 dark:bg-error-800 dark:border-error-700',
      },
    },
    size: {
      sm: {
        body: 'p-3',
        header: 'px-3 py-2',
        footer: 'px-3 py-2',
      },
      md: {
        body: 'p-4',
        header: 'px-4 py-3',
        footer: 'px-4 py-3',
      },
      lg: {
        body: 'p-6',
        header: 'px-6 py-4',
        footer: 'px-6 py-4',
      },
    },
    interactive: {
      true: {
        container:
          'transition-colors active:bg-neutral-50 dark:active:bg-neutral-800',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    interactive: false,
  },
});

type CardVariants = VariantProps<typeof card>;

interface CardRootProps extends CardVariants, ViewProps {
  className?: string;
  children?: React.ReactNode;
}

interface CardSectionProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

const CardRoot: React.FC<CardRootProps> = ({
  variant,
  size,
  interactive,
  className = '',
  children,
  ...props
}) => {
  const styles = card({ variant, size, interactive });

  return (
    <View className={styles.container({ className })} {...props}>
      {children}
    </View>
  );
};

const CardHeader: React.FC<CardSectionProps> = ({
  className = '',
  children,
  ...props
}) => {
  const styles = card();

  return (
    <View className={styles.header({ className })} {...props}>
      {children}
    </View>
  );
};

const CardBody: React.FC<CardSectionProps> = ({
  className = '',
  children,
  ...props
}) => {
  const styles = card();

  return (
    <View className={styles.body({ className })} {...props}>
      {children}
    </View>
  );
};

const CardFooter: React.FC<CardSectionProps> = ({
  className = '',
  children,
  ...props
}) => {
  const styles = card();

  return (
    <View className={styles.footer({ className })} {...props}>
      {children}
    </View>
  );
};

// Compound component pattern
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
