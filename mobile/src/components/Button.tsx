import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { AppColors, KurdistanColors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  testID?: string;
}

/**
 * Modern Button Component
 * Uses Kurdistan colors for primary branding
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...buttonStyle,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : AppColors.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  // Variants
  primary: {
    backgroundColor: KurdistanColors.kesk,
    shadowColor: KurdistanColors.kesk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: KurdistanColors.zer,
    shadowColor: KurdistanColors.zer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: KurdistanColors.kesk,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: KurdistanColors.sor,
    shadowColor: KurdistanColors.sor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  // Sizes
  smallSize: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mediumSize: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  largeSize: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#000000',
  },
  outlineText: {
    color: KurdistanColors.kesk,
  },
  ghostText: {
    color: KurdistanColors.kesk,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.7,
  },
});
