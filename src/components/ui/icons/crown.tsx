import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface CrownProps {
  width?: number;
  height?: number;
  color?: string;
}

export function Crown({
  width = 24,
  height = 24,
  color = 'currentColor',
}: CrownProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 18h20l-2-12-3 7-5-7-5 7-3-7-2 12z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.1}
      />
      <Path
        d="M12 2v4M8 4l2-2 2 2 2-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
