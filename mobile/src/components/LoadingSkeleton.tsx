import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { AppColors } from '../theme/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Loading Skeleton Component
 * Shimmer animation for loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = React.useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

/**
 * Card Skeleton for loading states
 */
export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <Skeleton width="60%" height={24} style={{ marginBottom: 12 }} />
    <Skeleton width="40%" height={16} style={{ marginBottom: 8 }} />
    <Skeleton width="80%" height={16} style={{ marginBottom: 16 }} />
    <View style={styles.row}>
      <Skeleton width={60} height={32} borderRadius={16} />
      <Skeleton width={80} height={32} borderRadius={16} />
    </View>
  </View>
);

/**
 * List Item Skeleton
 */
export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItem}>
    <Skeleton width={48} height={48} borderRadius={24} />
    <View style={styles.listItemContent}>
      <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={14} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: AppColors.border,
  },
  cardSkeleton: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
  },
});
