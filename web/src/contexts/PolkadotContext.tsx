import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { DEFAULT_ENDPOINT } from '../../../shared/blockchain/polkadot';

interface PolkadotContextType {
  api: ApiPromise | null;
  isApiReady: boolean;
  isConnected: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  setSelectedAccount: (account: InjectedAccountWithMeta | null) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
}

const PolkadotContext = createContext<PolkadotContextType | undefined>(undefined);

interface PolkadotProviderProps {
  children: ReactNode;
  endpoint?: string;
}

export const PolkadotProvider: React.FC<PolkadotProviderProps> = ({
  children,
  endpoint = DEFAULT_ENDPOINT // Beta testnet RPC from shared config
}) => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wrapper to trigger events when wallet changes
  const handleSetSelectedAccount = (account: InjectedAccountWithMeta | null) => {
    setSelectedAccount(account);
    if (account) {
      localStorage.setItem('selectedWallet', account.address);
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.log('💾 Wallet saved:', account.address);
      }
      window.dispatchEvent(new Event('walletChanged'));
    } else {
      localStorage.removeItem('selectedWallet');
      window.dispatchEvent(new Event('walletChanged'));
    }
  };

  // Initialize Polkadot API with fallback endpoints
  useEffect(() => {
    const FALLBACK_ENDPOINTS = [
      endpoint,
      import.meta.env.VITE_WS_ENDPOINT_FALLBACK_1,
      import.meta.env.VITE_WS_ENDPOINT_FALLBACK_2,
    ].filter(Boolean);

    const initApi = async () => {
      let lastError: unknown = null;

      for (const currentEndpoint of FALLBACK_ENDPOINTS) {
        try {
          if (import.meta.env.DEV) {
            if (import.meta.env.DEV) console.log('🔗 Connecting to Pezkuwi node:', currentEndpoint);
          }

          const provider = new WsProvider(currentEndpoint);
          const apiInstance = await ApiPromise.create({ provider });

          await apiInstance.isReady;

          setApi(apiInstance);
          setIsApiReady(true);
          setError(null);

          if (import.meta.env.DEV) {
            if (import.meta.env.DEV) console.log('✅ Connected to Pezkuwi node');

            // Get chain info
            const [chain, nodeName, nodeVersion] = await Promise.all([
              apiInstance.rpc.system.chain(),
              apiInstance.rpc.system.name(),
              apiInstance.rpc.system.version(),
            ]);

            if (import.meta.env.DEV) console.log(`📡 Chain: ${chain}`);
            if (import.meta.env.DEV) console.log(`🖥️  Node: ${nodeName} v${nodeVersion}`);
          }

          return;
        } catch (err) {
          lastError = err;
          if (import.meta.env.DEV) {
            if (import.meta.env.DEV) console.warn(`⚠️ Failed to connect to ${currentEndpoint}, trying next...`);
          }
          continue;
        }
      }

      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.error('❌ Failed to connect to all endpoints:', lastError);
      }
      setError('Failed to connect to blockchain network. Please try again later.');
      setIsApiReady(false);
    };

    initApi();

    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, [endpoint]);

  // Auto-restore wallet on page load
  useEffect(() => {
    const restoreWallet = async () => {
      const savedAddress = localStorage.getItem('selectedWallet');
      if (!savedAddress) return;

      try {
        // Enable extension
        const extensions = await web3Enable('PezkuwiChain');
        if (extensions.length === 0) return;

        // Get accounts
        const allAccounts = await web3Accounts();
        if (allAccounts.length === 0) return;

        // Find saved account
        const savedAccount = allAccounts.find(acc => acc.address === savedAddress);
        if (savedAccount) {
          setAccounts(allAccounts);
          handleSetSelectedAccount(savedAccount);
          if (import.meta.env.DEV) {
            if (import.meta.env.DEV) console.log('✅ Wallet restored:', savedAddress.slice(0, 8) + '...');
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) console.error('Failed to restore wallet:', err);
        }
      }
    };

    restoreWallet();
  }, []);

  // Connect wallet (Polkadot.js extension)
  const connectWallet = async () => {
    try {
      setError(null);

      // Enable extension
      const extensions = await web3Enable('PezkuwiChain');

      if (extensions.length === 0) {
        setError('Please install Polkadot.js extension');
        window.open('https://polkadot.js.org/extension/', '_blank');
        return;
      }

      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.log('✅ Polkadot.js extension enabled');
      }

      // Get accounts
      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        setError('No accounts found. Please create an account in Polkadot.js extension');
        return;
      }

      setAccounts(allAccounts);

      // Try to restore previously selected account, otherwise use first
      const savedAddress = localStorage.getItem('selectedWallet');
      const accountToSelect = savedAddress
        ? allAccounts.find(acc => acc.address === savedAddress) || allAccounts[0]
        : allAccounts[0];

      // Use wrapper to trigger events
      handleSetSelectedAccount(accountToSelect);

      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.log(`✅ Found ${allAccounts.length} account(s)`);
      }

    } catch (err) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.error('❌ Wallet connection failed:', err);
      }
      setError('Failed to connect wallet');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccounts([]);
    handleSetSelectedAccount(null);
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) console.log('🔌 Wallet disconnected');
    }
  };

  const value: PolkadotContextType = {
    api,
    isApiReady,
    isConnected: isApiReady, // Alias for backward compatibility
    accounts,
    selectedAccount,
    setSelectedAccount: handleSetSelectedAccount,
    connectWallet,
    disconnectWallet,
    error,
  };

  return (
    <PolkadotContext.Provider value={value}>
      {children}
    </PolkadotContext.Provider>
  );
};

// Hook to use Polkadot context
export const usePolkadot = (): PolkadotContextType => {
  const context = useContext(PolkadotContext);
  if (!context) {
    throw new Error('usePolkadot must be used within PolkadotProvider');
  }
  return context;
};
