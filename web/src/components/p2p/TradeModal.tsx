import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { toast } from 'sonner';
import { type P2PFiatOffer } from '@shared/lib/p2p-fiat';

interface TradeModalProps {
  offer: P2PFiatOffer;
  onClose: () => void;
}

export function TradeModal({ offer, onClose }: TradeModalProps) {
  const { user } = useAuth();
  const { api, selectedAccount } = usePolkadot();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const cryptoAmount = parseFloat(amount) || 0;
  const fiatAmount = cryptoAmount * offer.price_per_unit;
  const isValidAmount = cryptoAmount > 0 && cryptoAmount <= offer.remaining_amount;
  
  // Check min/max order amounts
  const meetsMinOrder = !offer.min_order_amount || cryptoAmount >= offer.min_order_amount;
  const meetsMaxOrder = !offer.max_order_amount || cryptoAmount <= offer.max_order_amount;

  const handleInitiateTrade = async () => {
    if (!api || !selectedAccount || !user) {
      toast.error('Please connect your wallet and log in');
      return;
    }

    if (!isValidAmount) {
      toast.error('Invalid amount');
      return;
    }

    if (!meetsMinOrder) {
      toast.error(`Minimum order: ${offer.min_order_amount} ${offer.token}`);
      return;
    }

    if (!meetsMaxOrder) {
      toast.error(`Maximum order: ${offer.max_order_amount} ${offer.token}`);
      return;
    }

    setLoading(true);

    try {
      // const _tradeId = await acceptFiatOffer({
      //   api,
      //   account: selectedAccount,
      //   offerId: offer.id,
      //   amount: cryptoAmount
      // });

      toast.success('Trade initiated! Proceed to payment.');
      onClose();
      
      // TODO: Navigate to trade page
      // navigate(`/p2p/trade/${tradeId}`);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Accept offer error:', error);
      // Error toast already shown in acceptFiatOffer
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Buy {offer.token}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Trading with {offer.seller_wallet.slice(0, 6)}...{offer.seller_wallet.slice(-4)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Info */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Price</span>
              <span className="text-xl font-bold text-green-400">
                {offer.price_per_unit.toFixed(2)} {offer.fiat_currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Available</span>
              <span className="text-white">{offer.remaining_amount} {offer.token}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="buyAmount">Amount to Buy ({offer.token})</Label>
            <Input
              id="buyAmount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 placeholder:opacity-50"
            />
            {offer.min_order_amount && (
              <p className="text-xs text-gray-500 mt-1">
                Min: {offer.min_order_amount} {offer.token}
              </p>
            )}
            {offer.max_order_amount && (
              <p className="text-xs text-gray-500 mt-1">
                Max: {offer.max_order_amount} {offer.token}
              </p>
            )}
          </div>

          {/* Calculation */}
          {cryptoAmount > 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">You will pay</p>
              <p className="text-2xl font-bold text-green-400">
                {fiatAmount.toFixed(2)} {offer.fiat_currency}
              </p>
            </div>
          )}

          {/* Warnings */}
          {!meetsMinOrder && cryptoAmount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Minimum order: {offer.min_order_amount} {offer.token}
              </AlertDescription>
            </Alert>
          )}

          {!meetsMaxOrder && cryptoAmount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Maximum order: {offer.max_order_amount} {offer.token}
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Time Limit */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Payment deadline: {offer.time_limit_minutes} minutes after accepting
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleInitiateTrade}
            disabled={!isValidAmount || !meetsMinOrder || !meetsMaxOrder || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating...
              </>
            ) : (
              'Accept & Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
