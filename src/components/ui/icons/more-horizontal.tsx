import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface MoreHorizontalProps {
  width?: number;
  height?: number;
  color?: string;
}

export function MoreHorizontal({ width = 24, height = 24, color = 'currentColor' }: MoreHorizontalProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={1} fill={color} />
      <Circle cx={19} cy={12} r={1} fill={color} />
      <Circle cx={5} cy={12} r={1} fill={color} />
    </Svg>
  );
}