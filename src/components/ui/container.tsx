import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

const container = tv({
  base: 'mx-auto w-full px-4',
  variants: {
    size: {
      sm: 'max-w-sm', // 384px
      md: 'max-w-md', // 448px
      lg: 'max-w-lg', // 512px
      xl: 'max-w-xl', // 576px
      '2xl': 'max-w-2xl', // 672px
      '4xl': 'max-w-4xl', // 896px
      '6xl': 'max-w-6xl', // 1152px
      full: 'max-w-full',
    },
    padding: {
      none: 'px-0',
      sm: 'px-3',
      md: 'px-4',
      lg: 'px-6',
      xl: 'px-8',
    },
    centered: {
      true: 'items-center',
    },
  },
  defaultVariants: {
    size: 'full',
    padding: 'md',
    centered: false,
  },
});

type ContainerVariants = VariantProps<typeof container>;

interface ContainerProps extends ContainerVariants, ViewProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive container component with consistent spacing
 */
export const Container: React.FC<ContainerProps> = ({
  size,
  padding,
  centered,
  children,
  className = '',
  ...props
}) => {
  return (
    <View
      className={container({ size, padding, centered, className })}
      {...props}
    >
      {children}
    </View>
  );
};

/**
 * Stack component for vertical/horizontal layouts
 */
interface StackProps extends ViewProps {
  direction?: 'row' | 'column';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  children,
  className = '',
  ...props
}) => {
  const spacingClasses = {
    xs: direction === 'row' ? 'space-x-1' : 'space-y-1',
    sm: direction === 'row' ? 'space-x-2' : 'space-y-2',
    md: direction === 'row' ? 'space-x-4' : 'space-y-4',
    lg: direction === 'row' ? 'space-x-6' : 'space-y-6',
    xl: direction === 'row' ? 'space-x-8' : 'space-y-8',
  };

  const alignClasses = {
    start: direction === 'row' ? 'items-start' : 'justify-start',
    center: direction === 'row' ? 'items-center' : 'justify-center',
    end: direction === 'row' ? 'items-end' : 'justify-end',
    stretch: direction === 'row' ? 'items-stretch' : 'justify-stretch',
  };

  const justifyClasses = {
    start: direction === 'row' ? 'justify-start' : 'items-start',
    center: direction === 'row' ? 'justify-center' : 'items-center',
    end: direction === 'row' ? 'justify-end' : 'items-end',
    between: direction === 'row' ? 'justify-between' : 'items-between',
    around: direction === 'row' ? 'justify-around' : 'items-around',
    evenly: direction === 'row' ? 'justify-evenly' : 'items-evenly',
  };

  const flexClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const wrapClass = wrap ? 'flex-wrap' : '';

  return (
    <View
      className={`
        ${flexClass} 
        ${wrapClass}
        ${spacingClasses[spacing]}
        ${alignClasses[align]}
        ${justifyClasses[justify]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </View>
  );
};

/**
 * Grid component for responsive layouts
 */
interface GridProps extends ViewProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  cols = 2,
  gap = 'md',
  responsive = true,
  children,
  className = '',
  ...props
}) => {
  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const colClasses = responsive
    ? {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
      }
    : {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      };

  return (
    <View
      className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
