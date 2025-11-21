import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TokenIcon } from './TokenIcon';
import { KurdistanColors } from '../theme/colors';

interface BalanceCardProps {
  symbol: string;
  name: string;
  balance: string;
  value?: string;
  change?: string;
  onPress?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  symbol,
  name,
  balance,
  value,
  change,
  onPress,
}) => {
  const changeValue = parseFloat(change || '0');
  const isPositive = changeValue >= 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <TokenIcon symbol={symbol} size={40} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.symbol}>{symbol}</Text>
            <Text style={styles.balance}>{balance}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.name}>{name}</Text>
            {value && <Text style={styles.value}>{value}</Text>}
          </View>
        </View>
      </View>
      {change && (
        <View style={styles.changeContainer}>
          <Text
            style={[
              styles.change,
              { color: isPositive ? KurdistanColors.kesk : KurdistanColors.sor },
            ]}
          >
            {isPositive ? '+' : ''}
            {change}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  balance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  changeContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});
