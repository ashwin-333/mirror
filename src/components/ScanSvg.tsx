import React from 'react';
import Svg, { Path } from 'react-native-svg';

type ScanSvgProps = {
  width?: number;
  height?: number;
  color?: string;
};

export const ScanSvg = ({ width = 24, height = 25, color = 'black' }: ScanSvgProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 25" fill="none">
      <Path
        d="M3 7.5V5.5C3 4.96957 3.21071 4.46086 3.58579 4.08579C3.96086 3.71071 4.46957 3.5 5 3.5H7M17 3.5H19C19.5304 3.5 20.0391 3.71071 20.4142 4.08579C20.7893 4.46086 21 4.96957 21 5.5V7.5M21 17.5V19.5C21 20.0304 20.7893 20.5391 20.4142 20.9142C20.0391 21.2893 19.5304 21.5 19 21.5H17M7 21.5H5C4.46957 21.5 3.96086 21.2893 3.58579 20.9142C3.21071 20.5391 3 20.0304 3 19.5V17.5M8 14.5C8 14.5 9.5 16.5 12 16.5C14.5 16.5 16 14.5 16 14.5M9 9.5H9.01M15 9.5H15.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}; 