import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface QrCodeProps {
  width?: number;
  height?: number;
  color?: string;
}

export function QrCode({ width = 24, height = 24, color = 'currentColor' }: QrCodeProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      {/* Corner squares */}
      <Rect x={3} y={3} width={5} height={5} rx={1} fill={color} />
      <Rect x={16} y={3} width={5} height={5} rx={1} fill={color} />
      <Rect x={3} y={16} width={5} height={5} rx={1} fill={color} />
      
      {/* Center square */}
      <Rect x={10} y={10} width={4} height={4} rx={0.5} fill={color} />
      
      {/* Small squares pattern */}
      <Rect x={10} y={3} width={1} height={1} fill={color} />
      <Rect x={12} y={3} width={1} height={1} fill={color} />
      <Rect x={14} y={3} width={1} height={1} fill={color} />
      <Rect x={10} y={5} width={1} height={1} fill={color} />
      <Rect x={12} y={5} width={1} height={1} fill={color} />
      <Rect x={14} y={5} width={1} height={1} fill={color} />
      
      <Rect x={3} y={10} width={1} height={1} fill={color} />
      <Rect x={5} y={10} width={1} height={1} fill={color} />
      <Rect x={7} y={10} width={1} height={1} fill={color} />
      <Rect x={3} y={12} width={1} height={1} fill={color} />
      <Rect x={5} y={12} width={1} height={1} fill={color} />
      <Rect x={7} y={12} width={1} height={1} fill={color} />
      
      <Rect x={16} y={10} width={1} height={1} fill={color} />
      <Rect x={18} y={10} width={1} height={1} fill={color} />
      <Rect x={20} y={10} width={1} height={1} fill={color} />
      <Rect x={16} y={12} width={1} height={1} fill={color} />
      <Rect x={18} y={12} width={1} height={1} fill={color} />
      <Rect x={20} y={12} width={1} height={1} fill={color} />
      
      <Rect x={10} y={16} width={1} height={1} fill={color} />
      <Rect x={12} y={16} width={1} height={1} fill={color} />
      <Rect x={14} y={16} width={1} height={1} fill={color} />
      <Rect x={10} y={18} width={1} height={1} fill={color} />
      <Rect x={12} y={18} width={1} height={1} fill={color} />
      <Rect x={14} y={18} width={1} height={1} fill={color} />
    </Svg>
  );
}