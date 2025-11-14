// ========================================
// WalletContext - Polkadot.js Wallet Integration
// ========================================
// This context wraps PolkadotContext and provides wallet functionality
// ⚠️ MIGRATION NOTE: This now uses Polkadot.js instead of MetaMask/Ethereum

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePolkadot } from './PolkadotContext';
import { WALLET_ERRORS, formatBalance, ASSET_IDS } from '@/lib/wallet';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { Signer } from '@polkadot/api/types';
import { web3FromAddress } from '@polkadot/extension-dapp';

interface TokenBalances {
  HEZ: string;
  PEZ: string;
  wHEZ: string;
  USDT: string;  // User-facing key for wUSDT (backend uses wUSDT asset ID 2)
}

interface WalletContextType {
  isConnected: boolean;
  account: string | null;  // Current selected account address
  accounts: InjectedAccountWithMeta[];
  balance: string;  // Legacy: HEZ balance
  balances: TokenBalances;  // All token balances
  error: string | null;
  signer: Signer | null;  // Polkadot.js signer for transactions
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  switchAccount: (account: InjectedAccountWithMeta) => void;
  signTransaction: (tx: any) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  refreshBalances: () => Promise<void>;  // Refresh all token balances
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const polkadot = usePolkadot();

  console.log('🎯 WalletProvider render:', {
    hasApi: !!polkadot.api,
    isApiReady: polkadot.isApiReady,
    selectedAccount: polkadot.selectedAccount?.address,
    accountsCount: polkadot.accounts.length
  });

  const [balance, setBalance] = useState<string>('0');
  const [balances, setBalances] = useState<TokenBalances>({ HEZ: '0', PEZ: '0', wHEZ: '0', USDT: '0' });
  const [error, setError] = useState<string | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);

  // Fetch all token balances when account changes
  const updateBalance = useCallback(async (address: string) => {
    if (!polkadot.api || !polkadot.isApiReady) {
      console.warn('API not ready, cannot fetch balance');
      return;
    }

    try {
      console.log('💰 Fetching all token balances for:', address);

      // Fetch HEZ (native token)
      const { data: nativeBalance } = await polkadot.api.query.system.account(address);
      const hezBalance = formatBalance(nativeBalance.free.toString());
      setBalance(hezBalance); // Legacy support

      // Fetch PEZ (Asset ID: 1)
      let pezBalance = '0';
      try {
        const pezData = await polkadot.api.query.assets.account(ASSET_IDS.PEZ, address);
        console.log('📊 Raw PEZ data:', pezData.toHuman());

        if (pezData.isSome) {
          const assetData = pezData.unwrap();
          const pezAmount = assetData.balance.toString();
          pezBalance = formatBalance(pezAmount);
          console.log('✅ PEZ balance found:', pezBalance);
        } else {
          console.warn('⚠️ PEZ asset not found for this account');
        }
      } catch (err) {
        console.error('❌ Failed to fetch PEZ balance:', err);
      }

      // Fetch wHEZ (Asset ID: 0)
      let whezBalance = '0';
      try {
        const whezData = await polkadot.api.query.assets.account(ASSET_IDS.WHEZ, address);
        console.log('📊 Raw wHEZ data:', whezData.toHuman());

        if (whezData.isSome) {
          const assetData = whezData.unwrap();
          const whezAmount = assetData.balance.toString();
          whezBalance = formatBalance(whezAmount);
          console.log('✅ wHEZ balance found:', whezBalance);
        } else {
          console.warn('⚠️ wHEZ asset not found for this account');
        }
      } catch (err) {
        console.error('❌ Failed to fetch wHEZ balance:', err);
      }

      // Fetch wUSDT (Asset ID: 2) - IMPORTANT: wUSDT has 6 decimals, not 12!
      let wusdtBalance = '0';
      try {
        const wusdtData = await polkadot.api.query.assets.account(ASSET_IDS.WUSDT, address);
        console.log('📊 Raw wUSDT data:', wusdtData.toHuman());

        if (wusdtData.isSome) {
          const assetData = wusdtData.unwrap();
          const wusdtAmount = assetData.balance.toString();
          wusdtBalance = formatBalance(wusdtAmount, 6); // wUSDT uses 6 decimals!
          console.log('✅ wUSDT balance found:', wusdtBalance);
        } else {
          console.warn('⚠️ wUSDT asset not found for this account');
        }
      } catch (err) {
        console.error('❌ Failed to fetch wUSDT balance:', err);
      }

      setBalances({
        HEZ: hezBalance,
        PEZ: pezBalance,
        wHEZ: whezBalance,
        USDT: wusdtBalance,
      });

      console.log('✅ Balances updated:', { HEZ: hezBalance, PEZ: pezBalance, wHEZ: whezBalance, wUSDT: wusdtBalance });
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      setError('Failed to fetch balances');
    }
  }, [polkadot.api, polkadot.isApiReady]);

  // Connect wallet (Polkadot.js extension)
  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      await polkadot.connectWallet();
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || WALLET_ERRORS.CONNECTION_FAILED);
    }
  }, [polkadot]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    polkadot.disconnectWallet();
    setBalance('0');
    setError(null);
  }, [polkadot]);

  // Switch account
  const switchAccount = useCallback((account: InjectedAccountWithMeta) => {
    polkadot.setSelectedAccount(account);
  }, [polkadot]);

  // Sign and submit transaction
  const signTransaction = useCallback(async (tx: any): Promise<string> => {
    if (!polkadot.api || !polkadot.selectedAccount) {
      throw new Error(WALLET_ERRORS.API_NOT_READY);
    }

    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(polkadot.selectedAccount.address);

      // Sign and send transaction
      const hash = await tx.signAndSend(
        polkadot.selectedAccount.address,
        { signer: injector.signer }
      );

      return hash.toHex();
    } catch (error: any) {
      console.error('Transaction failed:', error);
      throw new Error(error.message || WALLET_ERRORS.TRANSACTION_FAILED);
    }
  }, [polkadot.api, polkadot.selectedAccount]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!polkadot.selectedAccount) {
      throw new Error('No account selected');
    }

    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(polkadot.selectedAccount.address);

      if (!injector.signer.signRaw) {
        throw new Error('Wallet does not support message signing');
      }

      const { signature } = await injector.signer.signRaw({
        address: polkadot.selectedAccount.address,
        data: message,
        type: 'bytes'
      });

      return signature;
    } catch (error: any) {
      console.error('Message signing failed:', error);
      throw new Error(error.message || 'Failed to sign message');
    }
  }, [polkadot.selectedAccount]);

  // Get signer from extension when account changes
  useEffect(() => {
    const getSigner = async () => {
      if (polkadot.selectedAccount) {
        try {
          const injector = await web3FromAddress(polkadot.selectedAccount.address);
          setSigner(injector.signer);
          console.log('✅ Signer obtained for', polkadot.selectedAccount.address);
        } catch (error) {
          console.error('Failed to get signer:', error);
          setSigner(null);
        }
      } else {
        setSigner(null);
      }
    };

    getSigner();
  }, [polkadot.selectedAccount]);

  // Update balance when selected account changes
  useEffect(() => {
    console.log('🔄 WalletContext useEffect triggered!', {
      hasAccount: !!polkadot.selectedAccount,
      isApiReady: polkadot.isApiReady,
      address: polkadot.selectedAccount?.address
    });

    if (polkadot.selectedAccount && polkadot.isApiReady) {
      updateBalance(polkadot.selectedAccount.address);
    }
  }, [polkadot.selectedAccount, polkadot.isApiReady]);

  // Sync error state with PolkadotContext
  useEffect(() => {
    if (polkadot.error) {
      setError(polkadot.error);
    }
  }, [polkadot.error]);

  // Refresh balances for current account
  const refreshBalances = useCallback(async () => {
    if (polkadot.selectedAccount) {
      await updateBalance(polkadot.selectedAccount.address);
    }
  }, [polkadot.selectedAccount, updateBalance]);

  const value: WalletContextType = {
    isConnected: polkadot.accounts.length > 0,
    account: polkadot.selectedAccount?.address || null,
    accounts: polkadot.accounts,
    balance,
    balances,
    error: error || polkadot.error,
    signer,
    connectWallet,
    disconnect,
    switchAccount,
    signTransaction,
    signMessage,
    refreshBalances,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};