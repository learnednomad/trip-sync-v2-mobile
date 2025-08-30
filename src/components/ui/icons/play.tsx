import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PlayProps {
  width?: number;
  height?: number;
  color?: string;
}

export function Play({
  width = 24,
  height = 24,
  color = 'currentColor',
}: PlayProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="m9 18 6-6-6-6v12z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      />
    </Svg>
  );
}
