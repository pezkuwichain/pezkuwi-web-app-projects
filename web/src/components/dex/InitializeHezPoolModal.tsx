import React, { useState, useEffect } from 'react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { useWallet } from '@/contexts/WalletContext';
import { X, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface InitializeHezPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TransactionStatus = 'idle' | 'signing' | 'submitting' | 'success' | 'error';

export const InitializeHezPoolModal: React.FC<InitializeHezPoolModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { api, isApiReady } = usePolkadot();
  const { account, signer } = useWallet();
  const { toast } = useToast();

  const [hezAmount, setHezAmount] = useState('100000');

  const [hezBalance, setHezBalance] = useState<string>('0');
  const [whezBalance, setWhezBalance] = useState<string>('0');

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHezAmount('100000');
      setTxStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!api || !isApiReady || !account) return;

      try {
        // HEZ balance (native)
        const balance = await api.query.system.account(account);
        const freeBalance = balance.data.free.toString();
        setHezBalance(freeBalance);

        // wHEZ balance (asset 0)
        const whezData = await api.query.assets.account(0, account);
        setWhezBalance(whezData.isSome ? whezData.unwrap().balance.toString() : '0');
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      }
    };

    fetchBalances();
  }, [api, isApiReady, account]);

  const handleWrap = async () => {
    if (!api || !isApiReady || !signer || !account) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return;
    }

    const hezAmountRaw = BigInt(parseFloat(hezAmount) * 10 ** 12);

    if (hezAmountRaw <= BigInt(0)) {
      setErrorMessage('Amount must be greater than zero');
      return;
    }

    if (hezAmountRaw > BigInt(hezBalance)) {
      setErrorMessage('Insufficient HEZ balance');
      return;
    }

    setTxStatus('signing');
    setErrorMessage('');

    try {
      console.log('🔄 Wrapping HEZ to wHEZ...', {
        hezAmount,
        hezAmountRaw: hezAmountRaw.toString(),
      });

      const wrapTx = api.tx.tokenWrapper.wrap(hezAmountRaw.toString());

      setTxStatus('submitting');

      await wrapTx.signAndSend(
        account,
        { signer },
        ({ status, dispatchError, events }) => {
          console.log('📦 Transaction status:', status.type);

          if (status.isInBlock) {
            console.log('✅ In block:', status.asInBlock.toHex());

            if (dispatchError) {
              let errorMsg = '';

              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                console.error('❌ Module error:', errorMsg);
              } else {
                errorMsg = dispatchError.toString();
                console.error('❌ Dispatch error:', errorMsg);
              }

              setErrorMessage(errorMsg);
              setTxStatus('error');
              toast({
                title: 'Transaction Failed',
                description: errorMsg,
                variant: 'destructive',
              });
            } else {
              console.log('✅ Wrap successful!');
              console.log('📋 Events:', events.map(e => e.event.method).join(', '));
              setTxStatus('success');
              toast({
                title: 'Success!',
                description: `Successfully wrapped ${hezAmount} HEZ to wHEZ`,
              });
              setTimeout(() => {
                onSuccess?.();
                onClose();
              }, 2000);
            }
          }
        }
      );
    } catch (error: any) {
      console.error('Wrap failed:', error);
      setErrorMessage(error.message || 'Transaction failed');
      setTxStatus('error');
      toast({
        title: 'Error',
        description: error.message || 'Wrap failed',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  const hezBalanceDisplay = (parseFloat(hezBalance) / 10 ** 12).toFixed(4);
  const whezBalanceDisplay = (parseFloat(whezBalance) / 10 ** 12).toFixed(4);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">
              Wrap HEZ to wHEZ
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={txStatus === 'signing' || txStatus === 'submitting'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 w-fit mt-2">
            Admin Only - Token Wrapping
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Info Banner */}
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              Convert native HEZ tokens to wHEZ (wrapped HEZ) tokens for use in DEX pools.
              Ratio is always 1:1.
            </AlertDescription>
          </Alert>

          {/* HEZ Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">HEZ Amount</label>
              <span className="text-xs text-gray-500">
                Balance: {hezBalanceDisplay} HEZ
              </span>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={hezAmount}
                onChange={(e) => setHezAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg"
                disabled={txStatus === 'signing' || txStatus === 'submitting'}
              />
              <button
                onClick={() => setHezAmount((parseFloat(hezBalance) / 10 ** 12).toFixed(4))}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded border border-green-600/30 transition-colors"
                disabled={txStatus === 'signing' || txStatus === 'submitting'}
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-500">
              💡 You will receive {hezAmount} wHEZ (1:1 ratio)
            </p>
          </div>

          {/* Current wHEZ Balance */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Current wHEZ Balance</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              {whezBalanceDisplay} wHEZ
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {txStatus === 'success' && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 text-sm">
                Successfully wrapped {hezAmount} HEZ to wHEZ!
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 hover:bg-gray-800"
              disabled={txStatus === 'signing' || txStatus === 'submitting'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWrap}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={
                txStatus === 'signing' ||
                txStatus === 'submitting' ||
                txStatus === 'success'
              }
            >
              {txStatus === 'signing' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing...
                </>
              )}
              {txStatus === 'submitting' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Wrapping...
                </>
              )}
              {txStatus === 'idle' && 'Wrap HEZ'}
              {txStatus === 'error' && 'Retry'}
              {txStatus === 'success' && (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Success
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
