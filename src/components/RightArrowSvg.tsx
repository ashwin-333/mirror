import React from 'react';
import Svg, { Path } from 'react-native-svg';

type RightArrowSvgProps = {
  width?: number;
  height?: number;
  color?: string;
};

export const RightArrowSvg = ({ width = 7, height = 11, color = 'black' }: RightArrowSvgProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 7 11" fill="none">
      <Path
        d="M1.50003 1.99997L5.00006 5.5L1.50003 9.00003"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
      />
    </Svg>
  );
}; 