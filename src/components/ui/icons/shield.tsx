import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ShieldProps {
  width?: number;
  height?: number;
  color?: string;
}

export function Shield({ width = 24, height = 24, color = 'currentColor' }: ShieldProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.1}
      />
    </Svg>
  );
}