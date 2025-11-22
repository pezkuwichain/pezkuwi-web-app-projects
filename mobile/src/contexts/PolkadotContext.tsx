import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { DEFAULT_ENDPOINT } from '../../../shared/blockchain/polkadot';

interface Account {
  address: string;
  name: string;
  meta?: {
    name?: string;
  };
}

interface PolkadotContextType {
  api: ApiPromise | null;
  isApiReady: boolean;
  isConnected: boolean;
  accounts: Account[];
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  createWallet: (name: string, mnemonic?: string) => Promise<{ address: string; mnemonic: string }>;
  getKeyPair: (address: string) => Promise<KeyringPair | null>;
  error: string | null;
}

const PolkadotContext = createContext<PolkadotContextType | undefined>(undefined);

const WALLET_STORAGE_KEY = '@pezkuwi_wallets';
const SELECTED_ACCOUNT_KEY = '@pezkuwi_selected_account';

interface PolkadotProviderProps {
  children: ReactNode;
  endpoint?: string;
}

export const PolkadotProvider: React.FC<PolkadotProviderProps> = ({
  children,
  endpoint = DEFAULT_ENDPOINT, // Beta testnet RPC from shared config
}) => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyring, setKeyring] = useState<Keyring | null>(null);

  // Initialize crypto and keyring
  useEffect(() => {
    const initCrypto = async () => {
      try {
        await cryptoWaitReady();
        const kr = new Keyring({ type: 'sr25519' });
        setKeyring(kr);
        if (__DEV__) console.log('✅ Crypto libraries initialized');
      } catch (err) {
        if (__DEV__) console.error('❌ Failed to initialize crypto:', err);
        setError('Failed to initialize crypto libraries');
      }
    };

    initCrypto();
  }, []);

  // Initialize Polkadot API
  useEffect(() => {
    const initApi = async () => {
      try {
        if (__DEV__) console.log('🔗 Connecting to Pezkuwi node:', endpoint);

        const provider = new WsProvider(endpoint);
        const apiInstance = await ApiPromise.create({ provider });

        await apiInstance.isReady;

        setApi(apiInstance);
        setIsApiReady(true);
        setError(null);

        if (__DEV__) console.log('✅ Connected to Pezkuwi node');

        // Get chain info
        const [chain, nodeName, nodeVersion] = await Promise.all([
          apiInstance.rpc.system.chain(),
          apiInstance.rpc.system.name(),
          apiInstance.rpc.system.version(),
        ]);

        if (__DEV__) {
          console.log(`📡 Chain: ${chain}`);
          console.log(`🖥️  Node: ${nodeName} v${nodeVersion}`);
        }
      } catch (err) {
        if (__DEV__) console.error('❌ Failed to connect to node:', err);
        setError(`Failed to connect to node: ${endpoint}`);
        setIsApiReady(false);
      }
    };

    initApi();

    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, [endpoint]);

  // Load stored accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const stored = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
        if (stored) {
          const wallets = JSON.parse(stored);
          setAccounts(wallets);

          // Load selected account
          const selectedAddr = await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY);
          if (selectedAddr) {
            const account = wallets.find((w: Account) => w.address === selectedAddr);
            if (account) {
              setSelectedAccount(account);
            }
          }
        }
      } catch (err) {
        if (__DEV__) console.error('Failed to load accounts:', err);
      }
    };

    loadAccounts();
  }, []);

  // Create a new wallet
  const createWallet = async (
    name: string,
    mnemonic?: string
  ): Promise<{ address: string; mnemonic: string }> => {
    if (!keyring) {
      throw new Error('Keyring not initialized');
    }

    try {
      // Generate or use provided mnemonic
      const mnemonicPhrase = mnemonic || Keyring.prototype.generateMnemonic();

      // Create account from mnemonic
      const pair = keyring.addFromMnemonic(mnemonicPhrase, { name });

      const newAccount: Account = {
        address: pair.address,
        name,
        meta: { name },
      };

      // Store account (address only, not the seed!)
      const updatedAccounts = [...accounts, newAccount];
      setAccounts(updatedAccounts);
      await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(updatedAccounts));

      // SECURITY: Store encrypted seed in SecureStore (encrypted hardware-backed storage)
      const seedKey = `pezkuwi_seed_${pair.address}`;
      await SecureStore.setItemAsync(seedKey, mnemonicPhrase);

      if (__DEV__) console.log('✅ Wallet created:', pair.address);

      return {
        address: pair.address,
        mnemonic: mnemonicPhrase,
      };
    } catch (err) {
      if (__DEV__) console.error('❌ Failed to create wallet:', err);
      throw new Error('Failed to create wallet');
    }
  };

  // Get keypair for signing transactions
  const getKeyPair = async (address: string): Promise<KeyringPair | null> => {
    if (!keyring) {
      throw new Error('Keyring not initialized');
    }

    try {
      // SECURITY: Load seed from SecureStore (encrypted storage)
      const seedKey = `pezkuwi_seed_${address}`;
      const mnemonic = await SecureStore.getItemAsync(seedKey);

      if (!mnemonic) {
        if (__DEV__) console.error('No seed found for address:', address);
        return null;
      }

      // Recreate keypair from mnemonic
      const pair = keyring.addFromMnemonic(mnemonic);
      return pair;
    } catch (err) {
      if (__DEV__) console.error('Failed to get keypair:', err);
      return null;
    }
  };

  // Connect wallet (load existing accounts)
  const connectWallet = async () => {
    try {
      setError(null);

      if (accounts.length === 0) {
        setError('No wallets found. Please create a wallet first.');
        return;
      }

      // Auto-select first account if none selected
      if (!selectedAccount && accounts.length > 0) {
        setSelectedAccount(accounts[0]);
        await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, accounts[0].address);
      }

      if (__DEV__) console.log(`✅ Connected with ${accounts.length} account(s)`);
    } catch (err) {
      if (__DEV__) console.error('❌ Wallet connection failed:', err);
      setError('Failed to connect wallet');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setSelectedAccount(null);
    AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
    if (__DEV__) console.log('🔌 Wallet disconnected');
  };

  // Update selected account storage when it changes
  useEffect(() => {
    if (selectedAccount) {
      AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, selectedAccount.address);
    }
  }, [selectedAccount]);

  const value: PolkadotContextType = {
    api,
    isApiReady,
    isConnected: isApiReady,
    accounts,
    selectedAccount,
    setSelectedAccount,
    connectWallet,
    disconnectWallet,
    createWallet,
    getKeyPair,
    error,
  };

  return <PolkadotContext.Provider value={value}>{children}</PolkadotContext.Provider>;
};

// Hook to use Polkadot context
export const usePolkadot = (): PolkadotContextType => {
  const context = useContext(PolkadotContext);
  if (!context) {
    throw new Error('usePolkadot must be used within PolkadotProvider');
  }
  return context;
};
