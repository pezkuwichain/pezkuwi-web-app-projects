import React, { useState, useEffect } from 'react';
import { X, ArrowDown, ArrowUp, AlertCircle, Info, Clock, CheckCircle2 } from 'lucide-react';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  getWUSDTBalance,
  calculateWithdrawalDelay,
  getWithdrawalTier,
  formatDelay,
  formatWUSDT,
} from '@pezkuwi/lib/usdt';
import { isMultisigMember } from '@pezkuwi/lib/multisig';

interface USDTBridgeProps {
  isOpen: boolean;
  onClose: () => void;
  specificAddresses?: Record<string, string>;
}

export const USDTBridge: React.FC<USDTBridgeProps> = ({
  isOpen,
  onClose,
  specificAddresses = {},
}) => {
  const { api, selectedAccount, isApiReady } = usePolkadot();
  const { refreshBalances } = useWallet();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState(''); // Bank account or crypto address
  const [wusdtBalance, setWusdtBalance] = useState(0);
  const [isMultisigMemberState, setIsMultisigMemberState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch wUSDT balance
  useEffect(() => {
    if (!api || !isApiReady || !selectedAccount || !isOpen) return;

    const fetchBalance = async () => {
      const balance = await getWUSDTBalance(api, selectedAccount.address);
      setWusdtBalance(balance);

      // Check if user is multisig member
      const isMember = await isMultisigMember(api, selectedAccount.address, specificAddresses);
      setIsMultisigMemberState(isMember);
    };

    fetchBalance();
  }, [api, isApiReady, selectedAccount, isOpen, specificAddresses]);

  // Handle deposit (user requests deposit)
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // In real implementation:
      // 1. User transfers USDT to treasury (off-chain)
      // 2. Notary verifies the transfer
      // 3. Multisig mints wUSDT to user

      // For now, just show instructions
      setSuccess(
        `Deposit request for ${depositAmount} USDT created. Please follow the instructions to complete the deposit.`
      );
      setDepositAmount('');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Deposit error:', err);
      setError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle withdrawal (burn wUSDT)
  const handleWithdrawal = async () => {
    if (!api || !selectedAccount) return;

    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > wusdtBalance) {
      setError('Insufficient wUSDT balance');
      return;
    }

    if (!withdrawAddress) {
      setError('Please enter withdrawal address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const injector = await web3FromAddress(selectedAccount.address);

      // Burn wUSDT
      const amountBN = BigInt(Math.floor(amount * 1e6)); // 6 decimals
      const burnTx = api.tx.assets.burn(2, selectedAccount.address, amountBN.toString());

      await burnTx.signAndSend(selectedAccount.address, { signer: injector.signer }, ({ status }) => {
        if (status.isFinalized) {
          const delay = calculateWithdrawalDelay(amount);
          setSuccess(
            `Withdrawal request submitted! wUSDT burned. USDT will be sent to ${withdrawAddress} after ${formatDelay(delay)}.`
          );
          setWithdrawAmount('');
          setWithdrawAddress('');
          refreshBalances();
          setIsLoading(false);
        }
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Withdrawal error:', err);
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const withdrawalTier = withdrawAmount ? getWithdrawalTier(parseFloat(withdrawAmount)) : null;
  const withdrawalDelay = withdrawAmount ? calculateWithdrawalDelay(parseFloat(withdrawAmount)) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">USDT Bridge</h2>
            <p className="text-sm text-gray-400 mt-1">Deposit or withdraw USDT</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance Display */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Your wUSDT Balance</p>
          <p className="text-3xl font-bold text-white">{formatWUSDT(wusdtBalance)}</p>
          {isMultisigMemberState && (
            <Badge variant="outline" className="mt-2">
              Multisig Member
            </Badge>
          )}
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-4 mt-4">
            <Alert className="bg-blue-900/20 border-blue-500">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <p className="font-semibold mb-2">How to Deposit:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Transfer USDT to the treasury account (off-chain)</li>
                  <li>Notary verifies and records your transaction</li>
                  <li>Multisig (3/5) approves and mints wUSDT to your account</li>
                  <li>Receive wUSDT in 2-5 minutes</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                USDT Amount
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-500 placeholder:opacity-50"
                disabled={isLoading}
              />
            </div>

            <div className="p-4 bg-gray-800 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">You will receive:</span>
                <span className="text-white font-semibold">
                  {depositAmount || '0.00'} wUSDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Exchange rate:</span>
                <span className="text-white">1:1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated time:</span>
                <span className="text-white">2-5 minutes</span>
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={isLoading || !depositAmount}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 h-12"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5" />
                  Request Deposit
                </div>
              )}
            </Button>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-4 mt-4">
            <Alert className="bg-orange-900/20 border-orange-500">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <p className="font-semibold mb-2">How to Withdraw:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Burn your wUSDT on-chain</li>
                  <li>Wait for security delay ({withdrawalDelay > 0 && formatDelay(withdrawalDelay)})</li>
                  <li>Multisig (3/5) approves and sends USDT</li>
                  <li>Receive USDT to your specified address</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                wUSDT Amount
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount"
                max={wusdtBalance}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-500 placeholder:opacity-50"
                disabled={isLoading}
              />
              <button
                onClick={() => setWithdrawAmount(wusdtBalance.toString())}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                Max: {formatWUSDT(wusdtBalance)}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Withdrawal Address (Bank Account or Crypto Address)
              </label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="Bank account or crypto address"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-500 placeholder:opacity-50"
                disabled={isLoading}
              />
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="p-4 bg-gray-800 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">You will receive:</span>
                  <span className="text-white font-semibold">{withdrawAmount} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Withdrawal tier:</span>
                  <Badge variant={withdrawalTier === 'Large' ? 'destructive' : 'outline'}>
                    {withdrawalTier}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Security delay:</span>
                  <span className="text-white flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDelay(withdrawalDelay)}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleWithdrawal}
              disabled={isLoading || !withdrawAmount || !withdrawAddress}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-12"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5" />
                  Withdraw USDT
                </div>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
