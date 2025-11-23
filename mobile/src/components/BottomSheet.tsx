import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  Pressable,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { AppColors } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
  showHandle?: boolean;
}

/**
 * Modern Bottom Sheet Component
 * Swipe to dismiss, smooth animations
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  height = SCREEN_HEIGHT * 0.6,
  showHandle = true,
}) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const openSheet = React.useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
    }).start();
  }, [translateY]);

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [visible, openSheet]);

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeSheet}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeSheet} />
        <Animated.View
          style={[
            styles.sheet,
            { height, transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.border,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
