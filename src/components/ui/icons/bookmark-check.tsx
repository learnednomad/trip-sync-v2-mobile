import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BookmarkCheckProps {
  width?: number;
  height?: number;
  color?: string;
}

export function BookmarkCheck({
  width = 24,
  height = 24,
  color = 'currentColor',
}: BookmarkCheckProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.1}
      />
      <Path
        d="m9 12 2 2 4-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
