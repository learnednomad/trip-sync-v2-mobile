import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface CopyProps {
  width?: number;
  height?: number;
  color?: string;
}

export function Copy({ width = 24, height = 24, color = 'currentColor' }: CopyProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Rect
        x={9}
        y={9}
        width={13}
        height={13}
        rx={2}
        ry={2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}