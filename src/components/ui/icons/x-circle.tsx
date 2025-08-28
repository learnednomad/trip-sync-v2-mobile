import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface XCircleProps {
  width?: number;
  height?: number;
  color?: string;
}

export function XCircle({ width = 24, height = 24, color = 'currentColor' }: XCircleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}