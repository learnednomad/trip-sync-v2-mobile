import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SparklesProps {
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkles({ width = 24, height = 24, color = 'currentColor' }: SparklesProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6zM19 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"
        fill={color}
      />
    </Svg>
  );
}