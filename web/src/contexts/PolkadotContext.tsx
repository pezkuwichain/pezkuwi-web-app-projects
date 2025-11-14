import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface PolkadotContextType {
  api: ApiPromise | null;
  isApiReady: boolean;
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
  endpoint = 'wss://beta-rpc.pezkuwi.art' // Beta testnet RPC
}) => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Polkadot API
  useEffect(() => {
    const initApi = async () => {
      try {
        console.log('🔗 Connecting to Pezkuwi node:', endpoint);
        
        const provider = new WsProvider(endpoint);
        const apiInstance = await ApiPromise.create({ provider });
        
        await apiInstance.isReady;
        
        setApi(apiInstance);
        setIsApiReady(true);
        setError(null);
        
        console.log('✅ Connected to Pezkuwi node');
        
        // Get chain info
        const [chain, nodeName, nodeVersion] = await Promise.all([
          apiInstance.rpc.system.chain(),
          apiInstance.rpc.system.name(),
          apiInstance.rpc.system.version(),
        ]);
        
        console.log(`📡 Chain: ${chain}`);
        console.log(`🖥️  Node: ${nodeName} v${nodeVersion}`);
        
      } catch (err) {
        console.error('❌ Failed to connect to node:', err);
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
      
      console.log('✅ Polkadot.js extension enabled');
      
      // Get accounts
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        setError('No accounts found. Please create an account in Polkadot.js extension');
        return;
      }
      
      setAccounts(allAccounts);
      setSelectedAccount(allAccounts[0]); // Auto-select first account
      
      console.log(`✅ Found ${allAccounts.length} account(s)`);
      
    } catch (err) {
      console.error('❌ Wallet connection failed:', err);
      setError('Failed to connect wallet');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccounts([]);
    setSelectedAccount(null);
    console.log('🔌 Wallet disconnected');
  };

  const value: PolkadotContextType = {
    api,
    isApiReady,
    accounts,
    selectedAccount,
    setSelectedAccount,
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
