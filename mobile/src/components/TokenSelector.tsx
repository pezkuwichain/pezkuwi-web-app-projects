import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { TokenIcon } from './TokenIcon';
import { KurdistanColors } from '../theme/colors';

export interface Token {
  symbol: string;
  name: string;
  assetId?: number; // undefined for native HEZ
  decimals: number;
  balance?: string;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
  label?: string;
  disabled?: boolean;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  tokens,
  onSelectToken,
  label,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (token: Token) => {
    onSelectToken(token);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.selector, disabled && styles.disabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {selectedToken ? (
          <View style={styles.selectedToken}>
            <TokenIcon symbol={selectedToken.symbol} size={32} />
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>{selectedToken.symbol}</Text>
              <Text style={styles.tokenName}>{selectedToken.name}</Text>
            </View>
            <Text style={styles.chevron}>▼</Text>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Select Token</Text>
            <Text style={styles.chevron}>▼</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Token</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={tokens}
              keyExtractor={(item) => item.symbol}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tokenItem,
                    selectedToken?.symbol === item.symbol && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <TokenIcon symbol={item.symbol} size={40} />
                  <View style={styles.tokenDetails}>
                    <Text style={styles.itemSymbol}>{item.symbol}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  {item.balance && (
                    <Text style={styles.itemBalance}>{item.balance}</Text>
                  )}
                  {selectedToken?.symbol === item.symbol && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  selector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  selectedToken: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  tokenName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chevron: {
    fontSize: 12,
    color: '#999',
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    paddingHorizontal: 8,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedItem: {
    backgroundColor: '#F0F9F4',
  },
  tokenDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  itemName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemBalance: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  checkmark: {
    fontSize: 20,
    color: KurdistanColors.kesk,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
});
