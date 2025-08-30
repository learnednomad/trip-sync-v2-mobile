import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

export function Lock({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        ry="2"
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
