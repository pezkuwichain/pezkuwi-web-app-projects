import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppColors, { KurdistanColors } from '../theme/colors';
import { usePolkadot } from '../contexts/PolkadotContext';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change: string;
  logo: string;
  isLive: boolean; // true = canlı blockchain, false = coming soon
}

const WalletScreen: React.FC = () => {
  const { t } = useTranslation();
  const {
    api,
    isApiReady,
    accounts,
    selectedAccount,
    connectWallet,
    disconnectWallet,
    createWallet,
    getKeyPair,
    error: polkadotError
  } = usePolkadot();

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [createWalletModalVisible, setCreateWalletModalVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [walletName, setWalletName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Token balances from blockchain
  const [balances, setBalances] = useState<{ [key: string]: string }>({
    HEZ: '0.00',
    PEZ: '0.00',
    USDT: '0.00',
  });

  const tokens: Token[] = [
    {
      symbol: 'HEZ',
      name: 'Pezkuwi',
      balance: balances.HEZ,
      value: '$0.00',
      change: '+0.00%',
      logo: '🟡',
      isLive: true,
    },
    {
      symbol: 'PEZ',
      name: 'Pezkuwi Token',
      balance: balances.PEZ,
      value: '$0.00',
      change: '+0.00%',
      logo: '🟣',
      isLive: true,
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      balance: balances.USDT,
      value: '$0.00',
      change: '+0.00%',
      logo: '💵',
      isLive: true,
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '0.00',
      value: '$0.00',
      change: '+0.00%',
      logo: '⟠',
      isLive: false,
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: '0.00',
      value: '$0.00',
      change: '+0.00%',
      logo: '₿',
      isLive: false,
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      balance: '0.00',
      value: '$0.00',
      change: '+0.00%',
      logo: '●',
      isLive: false,
    },
    {
      symbol: 'BNB',
      name: 'Binance Coin',
      balance: '0.00',
      value: '$0.00',
      change: '+0.00%',
      logo: '◆',
      isLive: false,
    },
  ];

  // Fetch token balances from blockchain
  useEffect(() => {
    const fetchBalances = async () => {
      if (!api || !isApiReady || !selectedAccount) {
        return;
      }

      setIsLoadingBalances(true);
      try {
        // Fetch HEZ balance (native token)
        const accountInfo: any = await api.query.system.account(selectedAccount.address);
        const freeBalance = accountInfo.data.free.toString();
        const hezBalance = (Number(freeBalance) / 1e12).toFixed(2);

        // Fetch PEZ balance (asset ID 1)
        let pezBalance = '0.00';
        try {
          if (api.query.assets?.account) {
            const pezAsset: any = await api.query.assets.account(1, selectedAccount.address);
            if (pezAsset.isSome) {
              const pezData = pezAsset.unwrap();
              pezBalance = (Number(pezData.balance.toString()) / 1e12).toFixed(2);
            }
          }
        } catch (err) {
          if (__DEV__) console.log('PEZ asset not found or not accessible');
        }

        // Fetch USDT balance (wUSDT - asset ID 2)
        let usdtBalance = '0.00';
        try {
          if (api.query.assets?.account) {
            const usdtAsset: any = await api.query.assets.account(2, selectedAccount.address);
            if (usdtAsset.isSome) {
              const usdtData = usdtAsset.unwrap();
              usdtBalance = (Number(usdtData.balance.toString()) / 1e12).toFixed(2);
            }
          }
        } catch (err) {
          if (__DEV__) console.log('USDT asset not found or not accessible');
        }

        setBalances({
          HEZ: hezBalance,
          PEZ: pezBalance,
          USDT: usdtBalance,
        });
      } catch (err) {
        if (__DEV__) console.error('Failed to fetch balances:', err);
        Alert.alert('Error', 'Failed to fetch token balances');
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();

    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [api, isApiReady, selectedAccount]);

  const handleConnectWallet = async () => {
    try {
      if (accounts.length === 0) {
        // No wallet exists, show create wallet modal
        setCreateWalletModalVisible(true);
        return;
      }

      // Connect existing wallet
      await connectWallet();
      Alert.alert('Connected', 'Wallet connected successfully!');
    } catch (err) {
      if (__DEV__) console.error('Failed to connect wallet:', err);
      Alert.alert('Error', 'Failed to connect wallet');
    }
  };

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    try {
      const { address, mnemonic } = await createWallet(walletName);
      setCreateWalletModalVisible(false);
      setWalletName('');

      Alert.alert(
        'Wallet Created',
        `Your wallet has been created!\n\nAddress: ${address.substring(0, 10)}...\n\nIMPORTANT: Save your recovery phrase:\n${mnemonic}\n\nStore it securely - you'll need it to recover your wallet!`,
        [{ text: 'OK', onPress: () => connectWallet() }]
      );
    } catch (err) {
      if (__DEV__) console.error('Failed to create wallet:', err);
      Alert.alert('Error', 'Failed to create wallet');
    }
  };

  const handleTokenPress = (token: Token) => {
    if (!token.isLive) {
      Alert.alert(
        'Coming Soon',
        `${token.name} (${token.symbol}) support is coming soon!`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedToken(token);
  };

  const handleSend = () => {
    if (!selectedToken) return;
    setSendModalVisible(true);
  };

  const handleReceive = () => {
    setReceiveModalVisible(true);
  };

  const handleConfirmSend = async () => {
    if (!recipientAddress || !sendAmount || !selectedToken || !selectedAccount || !api) {
      Alert.alert('Error', 'Please enter recipient address and amount');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Alert.alert(
      'Confirm Transaction',
      `Send ${sendAmount} ${selectedToken.symbol} to ${recipientAddress.substring(0, 10)}...?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsSending(true);
            try {
              const keypair = await getKeyPair(selectedAccount.address);
              if (!keypair) {
                throw new Error('Failed to load keypair');
              }

              // Convert amount to blockchain units (12 decimals)
              const amountInUnits = BigInt(Math.floor(amount * 1e12));

              let tx;
              if (selectedToken.symbol === 'HEZ') {
                // Send native token
                tx = api.tx.balances.transfer(recipientAddress, amountInUnits);
              } else if (selectedToken.symbol === 'PEZ') {
                // Send PEZ asset (asset ID 1)
                tx = api.tx.assets.transfer(1, recipientAddress, amountInUnits);
              } else if (selectedToken.symbol === 'USDT') {
                // Send USDT (wUSDT on blockchain - asset ID 2)
                tx = api.tx.assets.transfer(2, recipientAddress, amountInUnits);
              } else {
                throw new Error('Unsupported token');
              }

              // Sign and send transaction
              await tx.signAndSend(keypair, ({ status, events }: any) => {
                if (status.isInBlock) {
                  console.log(`Transaction included in block: ${status.asInBlock}`);
                } else if (status.isFinalized) {
                  console.log(`Transaction finalized: ${status.asFinalized}`);

                  setSendModalVisible(false);
                  setRecipientAddress('');
                  setSendAmount('');
                  setIsSending(false);

                  Alert.alert(
                    'Success',
                    `Successfully sent ${sendAmount} ${selectedToken.symbol}!`
                  );

                  // Refresh balances
                  // The useEffect will automatically refresh after 30s, but we could trigger it manually here
                }
              });
            } catch (err) {
              console.error('Transaction failed:', err);
              setIsSending(false);
              Alert.alert('Error', `Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  // Show loading state while API is initializing
  if (!isApiReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KurdistanColors.kesk} />
          <Text style={styles.loadingText}>Connecting to blockchain...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show connect/create wallet screen if no account is selected
  if (!selectedAccount) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[KurdistanColors.kesk, KurdistanColors.zer]}
          style={styles.connectGradient}
        >
          <View style={styles.connectContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>👛</Text>
            </View>
            <Text style={styles.connectTitle}>{t('wallet.title')}</Text>
            <Text style={styles.connectSubtitle}>
              {accounts.length === 0
                ? 'Create a new wallet to get started'
                : 'Connect your wallet to manage your tokens'}
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.connectButtonText}>
                {accounts.length === 0 ? 'Create Wallet' : t('wallet.connect')}
              </Text>
            </TouchableOpacity>
            {polkadotError && (
              <Text style={styles.errorText}>{polkadotError}</Text>
            )}
          </View>
        </LinearGradient>

        {/* Create Wallet Modal */}
        <Modal
          visible={createWalletModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCreateWalletModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Wallet</Text>
              <TextInput
                style={styles.input}
                placeholder="Wallet Name"
                value={walletName}
                onChangeText={setWalletName}
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setCreateWalletModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreateWallet}
                >
                  <Text style={styles.confirmButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[KurdistanColors.kesk, KurdistanColors.zer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{t('wallet.title')}</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>{t('wallet.address')}:</Text>
          <Text style={styles.addressText}>
            {selectedAccount.address.substring(0, 8)}...{selectedAccount.address.substring(selectedAccount.address.length - 6)}
          </Text>
        </View>
        {isLoadingBalances && (
          <ActivityIndicator size="small" color={KurdistanColors.spi} style={{ marginTop: 8 }} />
        )}
        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={disconnectWallet}
        >
          <Text style={styles.disconnectButtonText}>{t('wallet.disconnect')}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tokens List */}
      <ScrollView style={styles.tokensContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Tokens</Text>
        {tokens.map((token, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tokenCard,
              !token.isLive && styles.tokenCardDisabled,
            ]}
            onPress={() => handleTokenPress(token)}
            activeOpacity={0.7}
          >
            <View style={styles.tokenInfo}>
              <View style={styles.tokenLogoContainer}>
                <Text style={styles.tokenLogo}>{token.logo}</Text>
              </View>
              <View style={styles.tokenDetails}>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                <Text style={styles.tokenName}>{token.name}</Text>
              </View>
            </View>
            <View style={styles.tokenBalance}>
              <Text style={styles.balanceAmount}>{token.balance}</Text>
              <Text style={styles.balanceValue}>{token.value}</Text>
            </View>
            {!token.isLive && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      {selectedToken && selectedToken.isLive && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>{t('wallet.send')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
            <Text style={styles.actionIcon}>📥</Text>
            <Text style={styles.actionText}>{t('wallet.receive')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Send Modal */}
      <Modal
        visible={sendModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isSending && setSendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Send {selectedToken?.symbol}
            </Text>
            <Text style={styles.balanceHint}>
              Available: {selectedToken?.balance} {selectedToken?.symbol}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Recipient Address"
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholderTextColor="#999"
              editable={!isSending}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
              editable={!isSending}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSendModalVisible(false)}
                disabled={isSending}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, isSending && styles.disabledButton]}
                onPress={handleConfirmSend}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={KurdistanColors.spi} />
                ) : (
                  <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receive Modal */}
      <Modal
        visible={receiveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReceiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Receive {selectedToken?.symbol}</Text>
            <Text style={styles.qrPlaceholder}>QR Code Here</Text>
            <Text style={styles.addressDisplay}>{selectedAccount.address}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => setReceiveModalVisible(false)}
            >
              <Text style={styles.confirmButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 20,
    fontSize: 14,
    color: KurdistanColors.sor,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  connectGradient: {
    flex: 1,
  },
  connectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: KurdistanColors.spi,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  connectTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
    marginBottom: 12,
  },
  connectSubtitle: {
    fontSize: 16,
    color: KurdistanColors.spi,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 40,
  },
  connectButton: {
    backgroundColor: KurdistanColors.spi,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    color: KurdistanColors.spi,
    opacity: 0.9,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: KurdistanColors.spi,
    fontFamily: 'monospace',
  },
  disconnectButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  disconnectButtonText: {
    fontSize: 12,
    color: KurdistanColors.spi,
    fontWeight: '600',
  },
  tokensContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 16,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KurdistanColors.spi,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  tokenCardDisabled: {
    opacity: 0.6,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenLogo: {
    fontSize: 24,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 4,
  },
  tokenName: {
    fontSize: 14,
    color: '#666',
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 14,
    color: '#666',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: KurdistanColors.zer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: KurdistanColors.reş,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: KurdistanColors.kesk,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: KurdistanColors.kesk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.spi,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: KurdistanColors.spi,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: KurdistanColors.reş,
    marginBottom: 12,
    textAlign: 'center',
  },
  balanceHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: KurdistanColors.kesk,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: KurdistanColors.spi,
  },
  disabledButton: {
    opacity: 0.5,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 200,
    fontSize: 16,
    color: '#999',
  },
  addressDisplay: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
});

export default WalletScreen;
