import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

export type ContinueButtonProps = {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
  style?: ViewStyle;
};

export const ContinueButton = ({ 
  onPress, 
  text = "Continue", 
  disabled = false, 
  style 
}: ContinueButtonProps) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style, disabled && styles.disabledButton]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{text}</Text>
      <Svg width={28} height={28} viewBox="118 11 28 28" fill="none">
        <Circle cx={132} cy={25} r={14.5} fill={disabled ? "#D3D3D3" : "#CA5A5E"} stroke="white" />
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
    letterSpacing: -1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#888',
  },
}); 