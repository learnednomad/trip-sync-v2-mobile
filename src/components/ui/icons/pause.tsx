import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PauseProps {
  width?: number;
  height?: number;
  color?: string;
}

export function Pause({ width = 24, height = 24, color = 'currentColor' }: PauseProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h4v16H6zM14 4h4v16h-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      />
    </Svg>
  );
}