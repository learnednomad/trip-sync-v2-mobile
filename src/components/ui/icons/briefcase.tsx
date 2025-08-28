import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Rect, Path } from 'react-native-svg';

export function Briefcase({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={2}
        y={7}
        width={20}
        height={14}
        rx={2}
        ry={2}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}