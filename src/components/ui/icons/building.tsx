import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function Building({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M6 12h4m-4 6h4m2-6h4m-4 6h4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
