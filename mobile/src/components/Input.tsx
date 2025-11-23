import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { AppColors, KurdistanColors } from '../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

/**
 * Modern Input Component
 * Floating label, validation states, icons
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value && props.value.length > 0;

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            (isFocused || hasValue) && styles.labelFocused,
            error && styles.labelError,
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...props}
          editable={props.editable !== undefined ? props.editable : !props.disabled}
          style={[styles.input, leftIcon && styles.inputWithLeftIcon, style]}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={AppColors.textSecondary}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </Pressable>
        )}
      </View>
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textSecondary,
    marginBottom: 8,
    transition: 'all 0.2s',
  },
  labelFocused: {
    color: KurdistanColors.kesk,
  },
  labelError: {
    color: KurdistanColors.sor,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: KurdistanColors.kesk,
    borderWidth: 2,
    shadowColor: KurdistanColors.kesk,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: KurdistanColors.sor,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    marginLeft: 12,
  },
  leftIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
    marginLeft: 16,
  },
  errorText: {
    color: KurdistanColors.sor,
  },
});
