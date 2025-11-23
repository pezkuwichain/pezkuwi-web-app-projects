import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { KurdistanColors } from '../theme/colors';

interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'error';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  icon?: React.ReactNode;
  testID?: string;
}

/**
 * Badge Component
 * For tiki roles, status indicators, labels
 */
export const Badge: React.FC<BadgeProps> = ({
  label,
  children,
  variant = 'primary',
  size = 'medium',
  style,
  icon,
  testID,
}) => {
  const content = label || children;

  return (
    <View testID={testID} style={[styles.badge, styles[variant], styles[`${size}Size`], style]}>
      {icon}
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {content}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  // Variants
  primary: {
    backgroundColor: `${KurdistanColors.kesk}15`,
  },
  secondary: {
    backgroundColor: `${KurdistanColors.zer}15`,
  },
  success: {
    backgroundColor: '#10B98115',
  },
  warning: {
    backgroundColor: `${KurdistanColors.zer}20`,
  },
  danger: {
    backgroundColor: `${KurdistanColors.sor}15`,
  },
  error: {
    backgroundColor: `${KurdistanColors.sor}15`,
  },
  info: {
    backgroundColor: '#3B82F615',
  },
  // Sizes
  smallSize: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediumSize: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  largeSize: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: KurdistanColors.kesk,
  },
  secondaryText: {
    color: '#855D00',
  },
  successText: {
    color: '#10B981',
  },
  warningText: {
    color: '#D97706',
  },
  dangerText: {
    color: KurdistanColors.sor,
  },
  errorText: {
    color: KurdistanColors.sor,
  },
  infoText: {
    color: '#3B82F6',
  },
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 13,
  },
  largeText: {
    fontSize: 15,
  },
});
