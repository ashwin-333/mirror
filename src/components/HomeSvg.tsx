import React from 'react';
import Svg, { Path } from 'react-native-svg';

type HomeSvgProps = {
  width?: number;
  height?: number;
  color?: string;
};

export const HomeSvg = ({ width = 25, height = 25, color = 'black' }: HomeSvgProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 25 25" fill="none">
      {/* House outline/roof */}
      <Path
        d="M3.5 10.5L12.5 3.5L21.5 10.5V20.5C21.5 21.0304 21.2893 21.5391 20.9142 21.9142C20.5391 22.2893 20.0304 22.5 19.5 22.5H5.5C4.96957 22.5 4.46086 22.2893 4.08579 21.9142C3.71071 21.5391 3.5 21.0304 3.5 20.5V10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Door */}
      <Path
        d="M9.5 22.5V12.5H15.5V22.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}; 