import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Text } from 'react-native';
import { AppColors } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  testID?: string;
  elevation?: number;
}

/**
 * Modern Card Component
 * Inspired by Material Design 3 and Kurdistan aesthetics
 */
export const Card: React.FC<CardProps> = ({
  children,
  title,
  style,
  onPress,
  variant = 'elevated',
  testID,
  elevation,
}) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'filled' && styles.filled,
    elevation && { elevation },
    style,
  ];

  const content = (
    <>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View testID={testID} style={cardStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: AppColors.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  filled: {
    backgroundColor: AppColors.background,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
