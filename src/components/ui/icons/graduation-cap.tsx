import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function GraduationCap({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21.42 6.11a1 1 0 0 0 0-.22 1 1 0 0 0-.21-.32 1 1 0 0 0-.32-.21 1 1 0 0 0-.76 0L12 8.64 3.87 5.36a1 1 0 0 0-.76 0 1 1 0 0 0-.32.21 1 1 0 0 0-.21.32 1 1 0 0 0 0 .22v.22a1 1 0 0 0 .08.38 1 1 0 0 0 .21.32L5.64 9.86a1 1 0 0 0 .71.29 1 1 0 0 0 .38-.08L12 7.36l5.27 2.71a1 1 0 0 0 .38.08 1 1 0 0 0 .71-.29l2.77-2.43a1 1 0 0 0 .21-.32 1 1 0 0 0 .08-.38v-.62z"
        fill={color}
      />
      <Path
        d="M7 11v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-5l-4 2.11a1 1 0 0 1-.76 0L7 11z"
        fill={color}
      />
    </Svg>
  );
}