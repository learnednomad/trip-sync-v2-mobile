import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface CheckCircleProps {
  width?: number;
  height?: number;
  color?: string;
}

export function CheckCircle({
  width = 24,
  height = 24,
  color = 'currentColor',
}: CheckCircleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="m9 11 3 3L22 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
