import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePolkadot } from '../contexts/PolkadotContext';
import { TokenSelector, Token } from '../components/TokenSelector';
import { Button, Card } from '../components';
import { KurdistanColors, AppColors } from '../theme/colors';

// Import shared utilities
import {
  formatTokenBalance,
  parseTokenInput,
  calculatePriceImpact,
  getAmountOut,
  calculateMinAmount,
} from '../../../shared/utils/dex';

interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  loading: boolean;
  swapping: boolean;
}

// Available tokens for swapping
const AVAILABLE_TOKENS: Token[] = [
  { symbol: 'HEZ', name: 'Pezkuwi Native', decimals: 12 },
  { symbol: 'wHEZ', name: 'Wrapped HEZ', assetId: 0, decimals: 12 },
  { symbol: 'PEZ', name: 'Pezkuwi Token', assetId: 1, decimals: 12 },
  { symbol: 'wUSDT', name: 'Wrapped USDT', assetId: 2, decimals: 6 },
];

const SwapScreen: React.FC = () => {
  const { t } = useTranslation();
  const { api, isApiReady, selectedAccount, getKeyPair } = usePolkadot();

  const [state, setState] = useState<SwapState>({
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    slippage: 1, // 1% default slippage
    loading: false,
    swapping: false,
  });

  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [poolReserves, setPoolReserves] = useState<{
    reserve1: string;
    reserve2: string;
  } | null>(null);
  const [priceImpact, setPriceImpact] = useState<string>('0');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [tempSlippage, setTempSlippage] = useState('1');

  // Fetch user balances for all tokens
  const fetchBalances = useCallback(async () => {
    if (!api || !isApiReady || !selectedAccount) return;

    try {
      const newBalances: { [key: string]: string } = {};

      // Fetch HEZ (native) balance
      const { data } = await api.query.system.account(selectedAccount.address);
      newBalances.HEZ = formatTokenBalance(data.free.toString(), 12, 4);

      // Fetch asset balances
      for (const token of AVAILABLE_TOKENS) {
        if (token.assetId !== undefined) {
          try {
            const assetData = await api.query.assets.account(
              token.assetId,
              selectedAccount.address
            );

            if (assetData.isSome) {
              const balance = assetData.unwrap().balance.toString();
              newBalances[token.symbol] = formatTokenBalance(
                balance,
                token.decimals,
                4
              );
            } else {
              newBalances[token.symbol] = '0.0000';
            }
          } catch (error) {
            console.log(`No balance for ${token.symbol}`);
            newBalances[token.symbol] = '0.0000';
          }
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  }, [api, isApiReady, selectedAccount]);

  // Fetch pool reserves
  const fetchPoolReserves = useCallback(async () => {
    if (
      !api ||
      !isApiReady ||
      !state.fromToken ||
      !state.toToken ||
      state.fromToken.assetId === undefined ||
      state.toToken.assetId === undefined
    ) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Get pool account
      const poolAccount = await api.query.assetConversion.pools([
        state.fromToken.assetId,
        state.toToken.assetId,
      ]);

      if (poolAccount.isNone) {
        Alert.alert('Pool Not Found', 'No liquidity pool exists for this pair.');
        setPoolReserves(null);
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Get reserves
      const reserve1Data = await api.query.assets.account(
        state.fromToken.assetId,
        poolAccount.unwrap()
      );
      const reserve2Data = await api.query.assets.account(
        state.toToken.assetId,
        poolAccount.unwrap()
      );

      const reserve1 = reserve1Data.isSome
        ? reserve1Data.unwrap().balance.toString()
        : '0';
      const reserve2 = reserve2Data.isSome
        ? reserve2Data.unwrap().balance.toString()
        : '0';

      setPoolReserves({ reserve1, reserve2 });
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Failed to fetch pool reserves:', error);
      Alert.alert('Error', 'Failed to fetch pool information.');
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [api, isApiReady, state.fromToken, state.toToken]);

  // Calculate output amount when input changes
  useEffect(() => {
    if (
      !state.fromAmount ||
      !state.fromToken ||
      !state.toToken ||
      !poolReserves
    ) {
      setState((prev) => ({ ...prev, toAmount: '' }));
      setPriceImpact('0');
      return;
    }

    try {
      const fromAmountRaw = parseTokenInput(
        state.fromAmount,
        state.fromToken.decimals
      );

      if (fromAmountRaw === '0') {
        setState((prev) => ({ ...prev, toAmount: '' }));
        setPriceImpact('0');
        return;
      }

      // Calculate output amount
      const toAmountRaw = getAmountOut(
        fromAmountRaw,
        poolReserves.reserve1,
        poolReserves.reserve2,
        30 // 0.3% fee
      );

      const toAmountFormatted = formatTokenBalance(
        toAmountRaw,
        state.toToken.decimals,
        6
      );

      // Calculate price impact
      const impact = calculatePriceImpact(
        poolReserves.reserve1,
        poolReserves.reserve2,
        fromAmountRaw
      );

      setState((prev) => ({ ...prev, toAmount: toAmountFormatted }));
      setPriceImpact(impact);
    } catch (error) {
      console.error('Calculation error:', error);
      setState((prev) => ({ ...prev, toAmount: '' }));
    }
  }, [state.fromAmount, state.fromToken, state.toToken, poolReserves]);

  // Load balances on mount
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Load pool reserves when tokens change
  useEffect(() => {
    if (state.fromToken && state.toToken) {
      fetchPoolReserves();
    }
  }, [state.fromToken, state.toToken, fetchPoolReserves]);

  // Handle token selection
  const handleFromTokenSelect = (token: Token) => {
    // Prevent selecting same token
    if (state.toToken && token.symbol === state.toToken.symbol) {
      setState((prev) => ({
        ...prev,
        fromToken: token,
        toToken: null,
        fromAmount: '',
        toAmount: '',
      }));
    } else {
      setState((prev) => ({
        ...prev,
        fromToken: token,
        fromAmount: '',
        toAmount: '',
      }));
    }
  };

  const handleToTokenSelect = (token: Token) => {
    // Prevent selecting same token
    if (state.fromToken && token.symbol === state.fromToken.symbol) {
      setState((prev) => ({
        ...prev,
        toToken: token,
        fromToken: null,
        fromAmount: '',
        toAmount: '',
      }));
    } else {
      setState((prev) => ({
        ...prev,
        toToken: token,
        fromAmount: '',
        toAmount: '',
      }));
    }
  };

  // Swap token positions
  const handleSwapTokens = () => {
    setState((prev) => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  };

  // Execute swap
  const handleSwap = async () => {
    if (
      !api ||
      !isApiReady ||
      !selectedAccount ||
      !state.fromToken ||
      !state.toToken ||
      !state.fromAmount ||
      !state.toAmount ||
      state.fromToken.assetId === undefined ||
      state.toToken.assetId === undefined
    ) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      setState((prev) => ({ ...prev, swapping: true }));

      // Get keypair for signing
      const keyPair = await getKeyPair(selectedAccount.address);
      if (!keyPair) {
        throw new Error('Failed to load keypair');
      }

      // Parse amounts
      const amountIn = parseTokenInput(
        state.fromAmount,
        state.fromToken.decimals
      );
      const amountOutExpected = parseTokenInput(
        state.toAmount,
        state.toToken.decimals
      );
      const amountOutMin = calculateMinAmount(
        amountOutExpected,
        state.slippage
      );

      // Create swap path
      const path = [state.fromToken.assetId, state.toToken.assetId];

      console.log('Swap params:', {
        path,
        amountIn,
        amountOutMin,
        slippage: state.slippage,
      });

      // Create transaction
      const tx = api.tx.assetConversion.swapTokensForExactTokens(
        path,
        amountOutMin,
        amountIn,
        selectedAccount.address,
        false // keep_alive
      );

      // Sign and send
      await new Promise<void>((resolve, reject) => {
        let unsub: (() => void) | undefined;

        tx.signAndSend(keyPair, ({ status, events, dispatchError }) => {
          console.log('Transaction status:', status.type);

          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                dispatchError.asModule
              );
              reject(
                new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`)
              );
            } else {
              reject(new Error(dispatchError.toString()));
            }
            if (unsub) unsub();
            return;
          }

          if (status.isInBlock || status.isFinalized) {
            console.log('Transaction included in block');
            resolve();
            if (unsub) unsub();
          }
        })
          .then((unsubscribe) => {
            unsub = unsubscribe;
          })
          .catch(reject);
      });

      // Success!
      Alert.alert(
        'Swap Successful',
        `Swapped ${state.fromAmount} ${state.fromToken.symbol} for ${state.toAmount} ${state.toToken.symbol}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setState((prev) => ({
                ...prev,
                fromAmount: '',
                toAmount: '',
                swapping: false,
              }));
              // Refresh balances
              fetchBalances();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Swap failed:', error);
      Alert.alert('Swap Failed', error.message || 'An error occurred.');
      setState((prev) => ({ ...prev, swapping: false }));
    }
  };

  // Save slippage settings
  const handleSaveSettings = () => {
    const slippageValue = parseFloat(tempSlippage);
    if (isNaN(slippageValue) || slippageValue < 0.1 || slippageValue > 50) {
      Alert.alert('Invalid Slippage', 'Please enter a value between 0.1% and 50%');
      return;
    }
    setState((prev) => ({ ...prev, slippage: slippageValue }));
    setSettingsModalVisible(false);
  };

  const availableFromTokens = AVAILABLE_TOKENS.map((token) => ({
    ...token,
    balance: balances[token.symbol] || '0.0000',
  }));

  const availableToTokens = AVAILABLE_TOKENS.filter(
    (token) => token.symbol !== state.fromToken?.symbol
  ).map((token) => ({
    ...token,
    balance: balances[token.symbol] || '0.0000',
  }));

  const canSwap =
    !state.swapping &&
    !state.loading &&
    state.fromToken &&
    state.toToken &&
    state.fromAmount &&
    state.toAmount &&
    parseFloat(state.fromAmount) > 0 &&
    selectedAccount;

  const impactLevel =
    parseFloat(priceImpact) < 1
      ? 'low'
      : parseFloat(priceImpact) < 3
      ? 'medium'
      : 'high';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Swap Tokens</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              setTempSlippage(state.slippage.toString());
              setSettingsModalVisible(true);
            }}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {!isApiReady && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningText}>Connecting to blockchain...</Text>
          </Card>
        )}

        {!selectedAccount && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningText}>Please connect your wallet</Text>
          </Card>
        )}

        {/* Swap Card */}
        <Card style={styles.swapCard}>
          {/* From Token */}
          <View style={styles.swapSection}>
            <TokenSelector
              label="From"
              selectedToken={state.fromToken}
              tokens={availableFromTokens}
              onSelectToken={handleFromTokenSelect}
              disabled={!isApiReady || !selectedAccount}
            />

            <TextInput
              style={styles.amountInput}
              value={state.fromAmount}
              onChangeText={(text) =>
                setState((prev) => ({ ...prev, fromAmount: text }))
              }
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!state.loading && !state.swapping}
            />

            {state.fromToken && (
              <Text style={styles.balanceText}>
                Balance: {balances[state.fromToken.symbol] || '0.0000'}{' '}
                {state.fromToken.symbol}
              </Text>
            )}
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            style={styles.swapIconContainer}
            onPress={handleSwapTokens}
            disabled={state.loading || state.swapping}
          >
            <View style={styles.swapIcon}>
              <Text style={styles.swapIconText}>⇅</Text>
            </View>
          </TouchableOpacity>

          {/* To Token */}
          <View style={styles.swapSection}>
            <TokenSelector
              label="To"
              selectedToken={state.toToken}
              tokens={availableToTokens}
              onSelectToken={handleToTokenSelect}
              disabled={!isApiReady || !selectedAccount || !state.fromToken}
            />

            <TextInput
              style={[styles.amountInput, styles.disabledInput]}
              value={state.toAmount}
              placeholder="0.00"
              editable={false}
            />

            {state.toToken && (
              <Text style={styles.balanceText}>
                Balance: {balances[state.toToken.symbol] || '0.0000'}{' '}
                {state.toToken.symbol}
              </Text>
            )}
          </View>
        </Card>

        {/* Swap Details */}
        {state.fromToken && state.toToken && state.toAmount && (
          <Card style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Swap Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price Impact</Text>
              <Text
                style={[
                  styles.detailValue,
                  impactLevel === 'high' && styles.highImpact,
                  impactLevel === 'medium' && styles.mediumImpact,
                ]}
              >
                {priceImpact}%
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Slippage Tolerance</Text>
              <Text style={styles.detailValue}>{state.slippage}%</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Minimum Received</Text>
              <Text style={styles.detailValue}>
                {formatTokenBalance(
                  calculateMinAmount(
                    parseTokenInput(state.toAmount, state.toToken.decimals),
                    state.slippage
                  ),
                  state.toToken.decimals,
                  6
                )}{' '}
                {state.toToken.symbol}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fee (0.3%)</Text>
              <Text style={styles.detailValue}>
                {formatTokenBalance(
                  (
                    BigInt(
                      parseTokenInput(state.fromAmount, state.fromToken.decimals)
                    ) *
                    BigInt(30) /
                    BigInt(10000)
                  ).toString(),
                  state.fromToken.decimals,
                  6
                )}{' '}
                {state.fromToken.symbol}
              </Text>
            </View>
          </Card>
        )}

        {/* Swap Button */}
        <Button
          variant={canSwap ? 'primary' : 'disabled'}
          onPress={handleSwap}
          disabled={!canSwap}
          style={styles.swapButton}
        >
          {state.swapping ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : state.loading ? (
            'Loading...'
          ) : !selectedAccount ? (
            'Connect Wallet'
          ) : !state.fromToken || !state.toToken ? (
            'Select Tokens'
          ) : !state.fromAmount ? (
            'Enter Amount'
          ) : (
            'Swap'
          )}
        </Button>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Swap Settings</Text>

            <Text style={styles.inputLabel}>Slippage Tolerance (%)</Text>
            <TextInput
              style={styles.settingsInput}
              value={tempSlippage}
              onChangeText={setTempSlippage}
              keyboardType="decimal-pad"
              placeholder="1.0"
            />

            <View style={styles.presetContainer}>
              {['0.5', '1.0', '2.0', '5.0'].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.presetButton,
                    tempSlippage === value && styles.presetButtonActive,
                  ]}
                  onPress={() => setTempSlippage(value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      tempSlippage === value && styles.presetTextActive,
                    ]}
                  >
                    {value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSettings}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  warningCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFE69C',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  swapCard: {
    padding: 20,
    marginBottom: 16,
  },
  swapSection: {
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    opacity: 0.6,
  },
  balanceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KurdistanColors.kesk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapIconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  detailsCard: {
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  highImpact: {
    color: KurdistanColors.sor,
  },
  mediumImpact: {
    color: KurdistanColors.zer,
  },
  swapButton: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  settingsInput: {
    fontSize: 18,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  presetButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  presetButtonActive: {
    backgroundColor: KurdistanColors.kesk,
    borderColor: KurdistanColors.kesk,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  presetTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: KurdistanColors.kesk,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SwapScreen;
