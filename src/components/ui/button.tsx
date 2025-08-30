import React from 'react';
import type { PressableProps, View } from 'react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

const button = tv({
  slots: {
    container:
      'my-2 flex flex-row items-center justify-center rounded-lg px-4 transition-all duration-200',
    label: 'font-inter text-base font-semibold',
    indicator: 'h-6 text-white',
  },

  variants: {
    variant: {
      default: {
        container:
          'bg-primary-500 shadow-sm hover:bg-primary-600 active:bg-primary-700',
        label: 'text-white',
        indicator: 'text-white',
      },
      primary: {
        container:
          'bg-primary-500 shadow-sm hover:bg-primary-600 active:bg-primary-700',
        label: 'text-white',
        indicator: 'text-white',
      },
      secondary: {
        container:
          'bg-secondary-500 shadow-sm hover:bg-secondary-600 active:bg-secondary-700',
        label: 'text-white',
        indicator: 'text-white',
      },
      outline: {
        container:
          'border-2 border-primary-500 bg-transparent hover:bg-primary-50 active:bg-primary-100 dark:hover:bg-primary-900 dark:active:bg-primary-800',
        label: 'text-primary-500 dark:text-primary-400',
        indicator: 'text-primary-500 dark:text-primary-400',
      },
      ghost: {
        container:
          'bg-transparent hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
        label: 'text-neutral-700 dark:text-neutral-300',
        indicator: 'text-neutral-700 dark:text-neutral-300',
      },
      destructive: {
        container:
          'bg-error-500 shadow-sm hover:bg-error-600 active:bg-error-700',
        label: 'text-white',
        indicator: 'text-white',
      },
      success: {
        container:
          'bg-success-500 shadow-sm hover:bg-success-600 active:bg-success-700',
        label: 'text-white',
        indicator: 'text-white',
      },
      link: {
        container: 'bg-transparent',
        label: 'text-primary-600 underline dark:text-primary-400',
        indicator: 'text-primary-600 dark:text-primary-400',
      },
    },
    size: {
      default: {
        container: 'h-10 px-4',
        label: 'text-base',
      },
      lg: {
        container: 'h-12 px-8',
        label: 'text-xl',
      },
      sm: {
        container: 'h-8 px-3',
        label: 'text-sm',
        indicator: 'h-2',
      },
      icon: { container: 'size-9' },
    },
    disabled: {
      true: {
        container: 'bg-neutral-300 dark:bg-neutral-300',
        label: 'text-neutral-600 dark:text-neutral-600',
        indicator: 'text-neutral-400 dark:text-neutral-400',
      },
    },
    fullWidth: {
      true: {
        container: '',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: true,
    size: 'default',
  },
});

type ButtonVariants = VariantProps<typeof button>;
interface Props extends ButtonVariants, Omit<PressableProps, 'disabled'> {
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button = React.forwardRef<View, Props>(
  (
    {
      label: text,
      loading = false,
      variant = 'default',
      disabled = false,
      size = 'default',
      className = '',
      testID,
      textClassName = '',
      ...props
    },
    ref
  ) => {
    const styles = React.useMemo(
      () => button({ variant, disabled, size }),
      [variant, disabled, size]
    );

    return (
      <Pressable
        disabled={disabled || loading}
        className={styles.container({ className })}
        {...props}
        ref={ref}
        testID={testID}
      >
        {props.children ? (
          props.children
        ) : (
          <>
            {loading ? (
              <ActivityIndicator
                size="small"
                className={styles.indicator()}
                testID={testID ? `${testID}-activity-indicator` : undefined}
              />
            ) : (
              <Text
                testID={testID ? `${testID}-label` : undefined}
                className={styles.label({ className: textClassName })}
              >
                {text}
              </Text>
            )}
          </>
        )}
      </Pressable>
    );
  }
);
