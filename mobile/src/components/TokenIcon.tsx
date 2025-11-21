import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TokenIconProps {
  symbol: string;
  size?: number;
}

// Token emoji mapping
const TOKEN_ICONS: { [key: string]: string } = {
  HEZ: '🟡',
  PEZ: '🟣',
  wHEZ: '🟡',
  USDT: '💵',
  wUSDT: '💵',
  BTC: '₿',
  ETH: '⟠',
  DOT: '●',
};

export const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 32 }) => {
  const icon = TOKEN_ICONS[symbol] || '❓';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.7 }]}>{icon}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
  },
  icon: {
    textAlign: 'center',
  },
});
