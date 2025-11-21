import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
} from 'react-native';
import { KurdistanColors } from '../theme/colors';

interface AddressDisplayProps {
  address: string;
  label?: string;
  copyable?: boolean;
}

/**
 * Format address for display (e.g., "5GrwV...xQjz")
 */
const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  label,
  copyable = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyable) return;

    Clipboard.setString(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={handleCopy}
        disabled={!copyable}
        activeOpacity={0.7}
      >
        <View style={styles.addressContainer}>
          <Text style={styles.address}>{formatAddress(address)}</Text>
          {copyable && (
            <Text style={styles.copyIcon}>{copied ? '✅' : '📋'}</Text>
          )}
        </View>
      </TouchableOpacity>
      {copied && <Text style={styles.copiedText}>Copied!</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  address: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#000',
  },
  copyIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  copiedText: {
    fontSize: 12,
    color: KurdistanColors.kesk,
    marginTop: 4,
    textAlign: 'center',
  },
});
