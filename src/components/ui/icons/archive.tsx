import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ArchiveProps {
  width?: number;
  height?: number;
  color?: string;
}

export function Archive({
  width = 24,
  height = 24,
  color = 'currentColor',
}: ArchiveProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8v13H3V8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M1 3h22v5H1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M10 12h4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
