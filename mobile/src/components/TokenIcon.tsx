import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface TokenIconProps {
  symbol: string;
  size?: number;
  testID?: string;
  style?: ViewStyle;
}

// Token color mapping
const TOKEN_COLORS: { [key: string]: string } = {
  HEZ: '#FFD700',
  PEZ: '#9B59B6',
  wHEZ: '#FFD700',
  USDT: '#26A17B',
  wUSDT: '#26A17B',
  BTC: '#F7931A',
  ETH: '#627EEA',
  DOT: '#E6007A',
};

export const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 32, testID, style }) => {
  // Get first letter of symbol
  // For wrapped tokens (starting with 'w'), use the second letter
  let letter = symbol.charAt(0).toUpperCase();
  if (symbol.startsWith('w') && symbol.length > 1) {
    letter = symbol.charAt(1).toUpperCase();
  }

  const color = TOKEN_COLORS[symbol] || '#999999';

  return (
    <View testID={testID} style={[styles.container, { width: size, height: size, backgroundColor: color }, style]}>
      <Text style={[styles.icon, { fontSize: size * 0.5 }]}>{letter}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  icon: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
