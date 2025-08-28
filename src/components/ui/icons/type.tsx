import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Polyline } from 'react-native-svg';

export function Type({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Polyline points="4,7 4,4 20,4 20,7" stroke={color} strokeWidth={2} />
      <Path d="M12 4v16" stroke={color} strokeWidth={2} />
      <Path d="M8 20h8" stroke={color} strokeWidth={2} />
    </Svg>
  );
}