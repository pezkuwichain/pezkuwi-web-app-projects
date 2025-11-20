import React, { useEffect, useState } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, ArrowDownRight, RefreshCw, Award, Plus, Coins, Send, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ASSET_IDS, getAssetSymbol } from '@pezkuwi/lib/wallet';
import { AddTokenModal } from './AddTokenModal';
import { TransferModal } from './TransferModal';
import { getAllScores, type UserScores } from '@pezkuwi/lib/scores';

interface TokenBalance {
  assetId: number;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: number;
}

export const AccountBalance: React.FC = () => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const [balance, setBalance] = useState<{
    free: string;
    reserved: string;
    total: string;
  }>({
    free: '0',
    reserved: '0',
    total: '0',
  });
  const [pezBalance, setPezBalance] = useState<string>('0');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [hezUsdPrice, setHezUsdPrice] = useState<number>(0);
  const [pezUsdPrice, setPezUsdPrice] = useState<number>(0);
  const [scores, setScores] = useState<UserScores>({
    trustScore: 0,
    referralScore: 0,
    stakingScore: 0,
    tikiScore: 0,
    totalScore: 0
  });
  const [loadingScores, setLoadingScores] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otherTokens, setOtherTokens] = useState<TokenBalance[]>([]);
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTokenForTransfer, setSelectedTokenForTransfer] = useState<TokenBalance | null>(null);
  const [customTokenIds, setCustomTokenIds] = useState<number[]>(() => {
    const stored = localStorage.getItem('customTokenIds');
    return stored ? JSON.parse(stored) : [];
  });

  // Helper function to get asset decimals
  const getAssetDecimals = (assetId: number): number => {
    if (assetId === ASSET_IDS.WUSDT) return 6; // wUSDT has 6 decimals
    return 12; // wHEZ, PEZ and others have 12 decimals by default
  };

  // Helper to decode hex string to UTF-8
  const hexToString = (hex: string): string => {
    if (!hex || hex === '0x') return '';
    try {
      const hexStr = hex.startsWith('0x') ? hex.slice(2) : hex;
      const bytes = new Uint8Array(hexStr.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      return new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '');
    } catch {
      return '';
    }
  };

  // Get token color based on assetId
  const getTokenColor = (assetId: number) => {
    const colors = {
      [ASSET_IDS.WHEZ]: { bg: 'from-green-500/20 to-yellow-500/20', text: 'text-green-400', border: 'border-green-500/30' },
      [ASSET_IDS.WUSDT]: { bg: 'from-emerald-500/20 to-teal-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    };
    return colors[assetId] || { bg: 'from-cyan-500/20 to-blue-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' };
  };

  // Fetch token prices from pools using pool account ID
  const fetchTokenPrices = async () => {
    if (!api || !isApiReady) return;

    try {
      if (import.meta.env.DEV) console.log('💰 Fetching token prices from pools...');

      // Import utilities for pool account derivation
      const { stringToU8a } = await import('@polkadot/util');
      const { blake2AsU8a } = await import('@polkadot/util-crypto');
      const PALLET_ID = stringToU8a('py/ascon');

      // Fetch wHEZ/wUSDT pool reserves (Asset 0 / Asset 2)
      const whezPoolId = api.createType('(u32, u32)', [0, 2]);
      const whezPalletIdType = api.createType('[u8; 8]', PALLET_ID);
      const whezFullTuple = api.createType('([u8; 8], (u32, u32))', [whezPalletIdType, whezPoolId]);
      const whezAccountHash = blake2AsU8a(whezFullTuple.toU8a(), 256);
      const whezPoolAccountId = api.createType('AccountId32', whezAccountHash);

      const whezReserve0Query = await api.query.assets.account(0, whezPoolAccountId);
      const whezReserve1Query = await api.query.assets.account(2, whezPoolAccountId);

      if (whezReserve0Query.isSome && whezReserve1Query.isSome) {
        const reserve0Data = whezReserve0Query.unwrap();
        const reserve1Data = whezReserve1Query.unwrap();

        const reserve0 = BigInt(reserve0Data.balance.toString()); // wHEZ (12 decimals)
        const reserve1 = BigInt(reserve1Data.balance.toString()); // wUSDT (6 decimals)

        // Calculate price: 1 HEZ = ? USD
        const hezPrice = Number(reserve1 * BigInt(10 ** 12)) / Number(reserve0 * BigInt(10 ** 6));
        if (import.meta.env.DEV) console.log('✅ HEZ price:', hezPrice, 'USD');
        setHezUsdPrice(hezPrice);
      } else {
        if (import.meta.env.DEV) console.warn('⚠️ wHEZ/wUSDT pool has no reserves');
      }

      // Fetch PEZ/wUSDT pool reserves (Asset 1 / Asset 2)
      const pezPoolId = api.createType('(u32, u32)', [1, 2]);
      const pezPalletIdType = api.createType('[u8; 8]', PALLET_ID);
      const pezFullTuple = api.createType('([u8; 8], (u32, u32))', [pezPalletIdType, pezPoolId]);
      const pezAccountHash = blake2AsU8a(pezFullTuple.toU8a(), 256);
      const pezPoolAccountId = api.createType('AccountId32', pezAccountHash);

      const pezReserve0Query = await api.query.assets.account(1, pezPoolAccountId);
      const pezReserve1Query = await api.query.assets.account(2, pezPoolAccountId);

      if (pezReserve0Query.isSome && pezReserve1Query.isSome) {
        const reserve0Data = pezReserve0Query.unwrap();
        const reserve1Data = pezReserve1Query.unwrap();

        const reserve0 = BigInt(reserve0Data.balance.toString()); // PEZ (12 decimals)
        const reserve1 = BigInt(reserve1Data.balance.toString()); // wUSDT (6 decimals)

        // Calculate price: 1 PEZ = ? USD
        const pezPrice = Number(reserve1 * BigInt(10 ** 12)) / Number(reserve0 * BigInt(10 ** 6));
        if (import.meta.env.DEV) console.log('✅ PEZ price:', pezPrice, 'USD');
        setPezUsdPrice(pezPrice);
      } else {
        if (import.meta.env.DEV) console.warn('⚠️ PEZ/wUSDT pool has no reserves');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ Failed to fetch token prices:', error);
    }
  };

  // Fetch other tokens (only custom tokens - wrapped tokens are backend-only)
  const fetchOtherTokens = async () => {
    if (!api || !isApiReady || !selectedAccount) return;

    try {
      const tokens: TokenBalance[] = [];

      // IMPORTANT: Only show custom tokens added by user
      // Wrapped tokens (wHEZ, wUSDT) are for backend operations only
      // Core tokens (HEZ, PEZ) are shown in their own dedicated cards
      const assetIdsToCheck = customTokenIds.filter((id) =>
        id !== ASSET_IDS.WHEZ &&  // Exclude wrapped tokens
        id !== ASSET_IDS.WUSDT &&
        id !== ASSET_IDS.PEZ      // Exclude core tokens
      );

      for (const assetId of assetIdsToCheck) {
        try {
          const assetBalance = await api.query.assets.account(assetId, selectedAccount.address);
          const assetMetadata = await api.query.assets.metadata(assetId);

          if (assetBalance.isSome) {
            const assetData = assetBalance.unwrap();
            const balance = assetData.balance.toString();

            const metadata = assetMetadata.toJSON() as { symbol?: string; name?: string; decimals?: number };

            // Decode hex strings properly
            let symbol = metadata.symbol || '';
            let name = metadata.name || '';

            if (typeof symbol === 'string' && symbol.startsWith('0x')) {
              symbol = hexToString(symbol);
            }
            if (typeof name === 'string' && name.startsWith('0x')) {
              name = hexToString(name);
            }

            // Fallback to known symbols if metadata is empty
            if (!symbol || symbol.trim() === '') {
              symbol = getAssetSymbol(assetId);
            }
            if (!name || name.trim() === '') {
              name = symbol;
            }

            const decimals = metadata.decimals || getAssetDecimals(assetId);
            const balanceFormatted = (parseInt(balance) / Math.pow(10, decimals)).toFixed(6);

            // Simple USD calculation (would use real price feed in production)
            let usdValue = 0;
            if (assetId === ASSET_IDS.WUSDT) {
              usdValue = parseFloat(balanceFormatted); // 1 wUSDT = 1 USD
            } else if (assetId === ASSET_IDS.WHEZ) {
              usdValue = parseFloat(balanceFormatted) * 0.5; // Placeholder price
            }

            tokens.push({
              assetId,
              symbol: symbol.trim(),
              name: name.trim(),
              balance: balanceFormatted,
              decimals,
              usdValue
            });
          }
        } catch (error) {
          if (import.meta.env.DEV) console.error(`Failed to fetch token ${assetId}:`, error);
        }
      }

      setOtherTokens(tokens);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to fetch other tokens:', error);
    }
  };

  const fetchBalance = async () => {
    if (!api || !isApiReady || !selectedAccount) return;

    setIsLoading(true);
    try {
      // Fetch HEZ balance
      const { data: balanceData } = await api.query.system.account(selectedAccount.address);

      const free = balanceData.free.toString();
      const reserved = balanceData.reserved.toString();

      // Convert from plancks to tokens (12 decimals)
      const decimals = 12;
      const divisor = Math.pow(10, decimals);

      const freeTokens = (parseInt(free) / divisor).toFixed(4);
      const reservedTokens = (parseInt(reserved) / divisor).toFixed(4);
      const totalTokens = ((parseInt(free) + parseInt(reserved)) / divisor).toFixed(4);

      setBalance({
        free: freeTokens,
        reserved: reservedTokens,
        total: totalTokens,
      });

      // Fetch PEZ balance (Asset ID: 1)
      try {
        const pezAssetBalance = await api.query.assets.account(1, selectedAccount.address);

        if (pezAssetBalance.isSome) {
          const assetData = pezAssetBalance.unwrap();
          const pezAmount = assetData.balance.toString();
          const pezTokens = (parseInt(pezAmount) / divisor).toFixed(4);
          setPezBalance(pezTokens);
        } else {
          setPezBalance('0');
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to fetch PEZ balance:', error);
        setPezBalance('0');
      }

      // Fetch USDT balance (wUSDT - Asset ID: 2)
      try {
        const usdtAssetBalance = await api.query.assets.account(2, selectedAccount.address);

        if (usdtAssetBalance.isSome) {
          const assetData = usdtAssetBalance.unwrap();
          const usdtAmount = assetData.balance.toString();
          const usdtDecimals = 6; // wUSDT has 6 decimals
          const usdtDivisor = Math.pow(10, usdtDecimals);
          const usdtTokens = (parseInt(usdtAmount) / usdtDivisor).toFixed(2);
          setUsdtBalance(usdtTokens);
        } else {
          setUsdtBalance('0');
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to fetch USDT balance:', error);
        setUsdtBalance('0');
      }

      // Fetch token prices from pools
      await fetchTokenPrices();

      // Fetch other tokens
      await fetchOtherTokens();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add custom token handler
  const handleAddToken = async (assetId: number) => {
    if (customTokenIds.includes(assetId)) {
      alert('Token already added!');
      return;
    }

    // Update custom tokens list
    const updatedTokenIds = [...customTokenIds, assetId];
    setCustomTokenIds(updatedTokenIds);
    localStorage.setItem('customTokenIds', JSON.stringify(updatedTokenIds));

    // Fetch the new token
    await fetchOtherTokens();
    setIsAddTokenModalOpen(false);
  };

  // Remove token handler (unused but kept for future feature)
  // const handleRemoveToken = (assetId: number) => {
  //   const updatedTokenIds = customTokenIds.filter(id => id !== assetId);
  //   setCustomTokenIds(updatedTokenIds);
  //   localStorage.setItem('customTokenIds', JSON.stringify(updatedTokenIds));
  //
  //   // Remove from displayed tokens
  //   setOtherTokens(prev => prev.filter(t => t.assetId !== assetId));
  // };

  useEffect(() => {
    fetchBalance();
    fetchTokenPrices(); // Fetch token USD prices from pools

    // Fetch All Scores from blockchain
    const fetchAllScores = async () => {
      if (!api || !isApiReady || !selectedAccount?.address) {
        setScores({
          trustScore: 0,
          referralScore: 0,
          stakingScore: 0,
          tikiScore: 0,
          totalScore: 0
        });
        return;
      }

      setLoadingScores(true);
      try {
        const userScores = await getAllScores(api, selectedAccount.address);
        setScores(userScores);
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to fetch scores:', err);
        setScores({
          trustScore: 0,
          referralScore: 0,
          stakingScore: 0,
          tikiScore: 0,
          totalScore: 0
        });
      } finally {
        setLoadingScores(false);
      }
    };

    fetchAllScores();

    // Subscribe to HEZ balance updates
    let unsubscribeHez: () => void;
    let unsubscribePez: () => void;
    let unsubscribeUsdt: () => void;

    const subscribeBalance = async () => {
      if (!api || !isApiReady || !selectedAccount) return;

      // Subscribe to HEZ balance
      unsubscribeHez = await api.query.system.account(
        selectedAccount.address,
        ({ data: balanceData }) => {
          const free = balanceData.free.toString();
          const reserved = balanceData.reserved.toString();

          const decimals = 12;
          const divisor = Math.pow(10, decimals);

          const freeTokens = (parseInt(free) / divisor).toFixed(4);
          const reservedTokens = (parseInt(reserved) / divisor).toFixed(4);
          const totalTokens = ((parseInt(free) + parseInt(reserved)) / divisor).toFixed(4);

          setBalance({
            free: freeTokens,
            reserved: reservedTokens,
            total: totalTokens,
          });
        }
      );

      // Subscribe to PEZ balance (Asset ID: 1)
      try {
        unsubscribePez = await api.query.assets.account(
          1,
          selectedAccount.address,
          (assetBalance) => {
            if (assetBalance.isSome) {
              const assetData = assetBalance.unwrap();
              const pezAmount = assetData.balance.toString();
              const decimals = 12;
              const divisor = Math.pow(10, decimals);
              const pezTokens = (parseInt(pezAmount) / divisor).toFixed(4);
              setPezBalance(pezTokens);
            } else {
              setPezBalance('0');
            }
          }
        );
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to subscribe to PEZ balance:', error);
      }

      // Subscribe to USDT balance (wUSDT - Asset ID: 2)
      try {
        unsubscribeUsdt = await api.query.assets.account(
          2,
          selectedAccount.address,
          (assetBalance) => {
            if (assetBalance.isSome) {
              const assetData = assetBalance.unwrap();
              const usdtAmount = assetData.balance.toString();
              const decimals = 6; // wUSDT has 6 decimals
              const divisor = Math.pow(10, decimals);
              const usdtTokens = (parseInt(usdtAmount) / divisor).toFixed(2);
              setUsdtBalance(usdtTokens);
            } else {
              setUsdtBalance('0');
            }
          }
        );
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to subscribe to USDT balance:', error);
      }
    };

    subscribeBalance();

    return () => {
      if (unsubscribeHez) unsubscribeHez();
      if (unsubscribePez) unsubscribePez();
      if (unsubscribeUsdt) unsubscribeUsdt();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, isApiReady, selectedAccount]);

  if (!selectedAccount) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Connect your wallet to view balance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEZ Balance Card */}
      <Card className="bg-gradient-to-br from-green-900/30 to-yellow-900/30 border-green-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-300">
              HEZ Balance
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchBalance}
              disabled={isLoading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-4xl font-bold text-white mb-1">
                {isLoading ? '...' : balance.total}
                <span className="text-2xl text-gray-400 ml-2">HEZ</span>
              </div>
              <div className="text-sm text-gray-400">
                {hezUsdPrice > 0
                  ? `≈ $${(parseFloat(balance.total) * hezUsdPrice).toFixed(2)} USD`
                  : 'Price loading...'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Transferable</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {balance.free} HEZ
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownRight className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">Reserved</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {balance.reserved} HEZ
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PEZ Balance Card */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-300">
            PEZ Token Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              {isLoading ? '...' : pezBalance}
              <span className="text-2xl text-gray-400 ml-2">PEZ</span>
            </div>
            <div className="text-sm text-gray-400">
              {pezUsdPrice > 0
                ? `≈ $${(parseFloat(pezBalance) * pezUsdPrice).toFixed(2)} USD`
                : 'Price loading...'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Governance & Rewards Token
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USDT Balance Card */}
      <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-300">
            USDT Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              {isLoading ? '...' : usdtBalance}
              <span className="text-2xl text-gray-400 ml-2">USDT</span>
            </div>
            <div className="text-sm text-gray-400">
              ≈ ${usdtBalance} USD • Stablecoin
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info & Scores */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-300">
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Account Details */}
            <div className="space-y-2 pb-4 border-b border-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Account</span>
                <span className="text-white font-mono">
                  {selectedAccount.meta.name || 'Unnamed'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Address</span>
                <span className="text-white font-mono text-xs">
                  {selectedAccount.address.slice(0, 8)}...{selectedAccount.address.slice(-8)}
                </span>
              </div>
            </div>

            {/* Scores from Blockchain */}
            <div>
              <div className="text-xs text-gray-400 mb-3">Scores from Blockchain</div>
              {loadingScores ? (
                <div className="text-sm text-gray-400">Loading scores...</div>
              ) : (
                <div className="space-y-3">
                  {/* Score Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Shield className="h-3 w-3 text-purple-400" />
                        <span className="text-xs text-gray-400">Trust</span>
                      </div>
                      <span className="text-base font-bold text-purple-400">{scores.trustScore}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3 text-cyan-400" />
                        <span className="text-xs text-gray-400">Referral</span>
                      </div>
                      <span className="text-base font-bold text-cyan-400">{scores.referralScore}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-gray-400">Staking</span>
                      </div>
                      <span className="text-base font-bold text-green-400">{scores.stakingScore}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Award className="h-3 w-3 text-pink-400" />
                        <span className="text-xs text-gray-400">Tiki</span>
                      </div>
                      <span className="text-base font-bold text-pink-400">{scores.tikiScore}</span>
                    </div>
                  </div>

                  {/* Total Score */}
                  <div className="pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Total Score</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        {scores.totalScore}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Tokens */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-lg font-medium text-gray-300">
                Other Assets
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddTokenModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Token
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {otherTokens.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
              <p className="text-gray-500 text-sm">No custom tokens yet</p>
              <p className="text-gray-600 text-xs mt-1">
                Add custom tokens to track additional assets
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {otherTokens.map((token) => {
                const tokenColor = getTokenColor(token.assetId);
                return (
                  <div
                    key={token.assetId}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-all duration-200 group border border-transparent hover:border-gray-700"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Token Logo */}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tokenColor.bg} flex items-center justify-center border ${tokenColor.border} shadow-lg`}>
                        <span className={`text-base font-bold ${tokenColor.text}`}>
                          {token.symbol.slice(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* Token Info */}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-semibold text-white">
                            {token.symbol}
                          </span>
                          <span className="text-xs text-gray-500">
                            #{token.assetId}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {token.name}
                        </div>
                      </div>
                    </div>

                    {/* Balance & Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-base font-semibold text-white">
                          {parseFloat(token.balance).toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${token.usdValue.toFixed(2)} USD
                        </div>
                      </div>

                      {/* Send Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTokenForTransfer(token);
                          setIsTransferModalOpen(true);
                        }}
                        className={`${tokenColor.text} hover:${tokenColor.text} hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Token Modal */}
      <AddTokenModal
        isOpen={isAddTokenModalOpen}
        onClose={() => setIsAddTokenModalOpen(false)}
        onAddToken={handleAddToken}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedTokenForTransfer(null);
        }}
        selectedAsset={selectedTokenForTransfer}
      />
    </div>
  );
};
