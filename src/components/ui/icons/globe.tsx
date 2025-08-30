import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path } from 'react-native-svg';

export function Globe({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M2 12h20" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
