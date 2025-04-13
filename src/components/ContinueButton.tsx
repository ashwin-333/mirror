import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type ContinueButtonProps = {
  onPress: () => void;
  text?: string;
};

export const ContinueButton = ({ onPress, text = "Continue" }: ContinueButtonProps) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{text}</Text>
      <Svg width={28} height={28} viewBox="118 11 28 28" fill="none">
        <Circle cx={132} cy={25} r={14.5} fill="#CA5A5E" stroke="white" />
        <Path d="M130 18L137 25L130 32" stroke="white" strokeWidth={3} strokeLinecap="square" />
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: scaleWidth(-5),
    paddingHorizontal: scaleWidth(10),
  },
  text: {
    fontSize: scaleWidth(24),
    fontWeight: '600',
    color: 'black',
    fontFamily: 'InstrumentSans',
    fontStyle: 'normal',
    marginRight: scaleWidth(8),
  },
}); 