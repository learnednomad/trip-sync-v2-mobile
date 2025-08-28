import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface RotateCcwProps {
  width?: number;
  height?: number;
  color?: string;
}

export function RotateCcw({ width = 24, height = 24, color = 'currentColor' }: RotateCcwProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 4v6h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}