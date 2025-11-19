import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { 
  getPaymentMethods, 
  createFiatOffer,
  validatePaymentDetails,
  type PaymentMethod,
  type FiatCurrency,
  type CryptoToken 
} from '@shared/lib/p2p-fiat';

interface CreateAdProps {
  onAdCreated: () => void;
}

export function CreateAd({ onAdCreated }: CreateAdProps) {
  const { user } = useAuth();
  const { api, selectedAccount } = usePolkadot();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [token, setToken] = useState<CryptoToken>('HEZ');
  const [amountCrypto, setAmountCrypto] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('TRY');
  const [fiatAmount, setFiatAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [timeLimit, setTimeLimit] = useState(30);
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxOrderAmount, setMaxOrderAmount] = useState('');

  // Load payment methods when currency changes
  useEffect(() => {
    const loadPaymentMethods = async () => {
      const methods = await getPaymentMethods(fiatCurrency);
      setPaymentMethods(methods);
      setSelectedPaymentMethod(null);
      setPaymentDetails({});
    };
    loadPaymentMethods();
  }, [fiatCurrency]);

  // Calculate price per unit
  const pricePerUnit = amountCrypto && fiatAmount 
    ? (parseFloat(fiatAmount) / parseFloat(amountCrypto)).toFixed(2)
    : '0';

  const handlePaymentMethodChange = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    setSelectedPaymentMethod(method || null);
    
    // Initialize payment details with empty values
    if (method) {
      const initialDetails: Record<string, string> = {};
      Object.keys(method.fields).forEach(field => {
        initialDetails[field] = '';
      });
      setPaymentDetails(initialDetails);
    }
  };

  const handlePaymentDetailChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAd = async () => {
    if (!api || !selectedAccount || !user) {
      toast.error('Please connect your wallet and log in');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate payment details
    const validation = validatePaymentDetails(
      paymentDetails,
      selectedPaymentMethod.validation_rules
    );

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    // Validate amounts
    const cryptoAmt = parseFloat(amountCrypto);
    const fiatAmt = parseFloat(fiatAmount);

    if (!cryptoAmt || cryptoAmt <= 0) {
      toast.error('Invalid crypto amount');
      return;
    }

    if (!fiatAmt || fiatAmt <= 0) {
      toast.error('Invalid fiat amount');
      return;
    }

    if (selectedPaymentMethod.min_trade_amount && fiatAmt < selectedPaymentMethod.min_trade_amount) {
      toast.error(`Minimum trade amount: ${selectedPaymentMethod.min_trade_amount} ${fiatCurrency}`);
      return;
    }

    if (selectedPaymentMethod.max_trade_amount && fiatAmt > selectedPaymentMethod.max_trade_amount) {
      toast.error(`Maximum trade amount: ${selectedPaymentMethod.max_trade_amount} ${fiatCurrency}`);
      return;
    }

    setLoading(true);

    try {
      const offerId = await createFiatOffer({
        api,
        account: selectedAccount,
        token,
        amountCrypto: cryptoAmt,
        fiatCurrency,
        fiatAmount: fiatAmt,
        paymentMethodId: selectedPaymentMethod.id,
        paymentDetails,
        timeLimitMinutes: timeLimit,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
        maxOrderAmount: maxOrderAmount ? parseFloat(maxOrderAmount) : undefined
      });

      toast.success('Ad created successfully!');
      onAdCreated();
    } catch (error: any) {
      console.error('Create ad error:', error);
      // Error toast already shown in createFiatOffer
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Create P2P Offer</CardTitle>
        <CardDescription>
          Lock your crypto in escrow and set your price
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Crypto Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="token">Token</Label>
            <Select value={token} onValueChange={(v) => setToken(v as CryptoToken)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HEZ">HEZ</SelectItem>
                <SelectItem value="PEZ">PEZ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amountCrypto">Amount ({token})</Label>
            <Input
              id="amountCrypto"
              type="number"
              step="0.01"
              value={amountCrypto}
              onChange={e => setAmountCrypto(e.target.value)}
              placeholder="Amount"
              className="placeholder:text-gray-500 placeholder:opacity-50"
            />
          </div>
        </div>

        {/* Fiat Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fiatCurrency">Fiat Currency</Label>
            <Select value={fiatCurrency} onValueChange={(v) => setFiatCurrency(v as FiatCurrency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">🇹🇷 Turkish Lira (TRY)</SelectItem>
                <SelectItem value="IQD">🇮🇶 Iraqi Dinar (IQD)</SelectItem>
                <SelectItem value="IRR">🇮🇷 Iranian Rial (IRR)</SelectItem>
                <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                <SelectItem value="USD">🇺🇸 US Dollar (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fiatAmount">Total Amount ({fiatCurrency})</Label>
            <Input
              id="fiatAmount"
              type="number"
              step="0.01"
              value={fiatAmount}
              onChange={e => setFiatAmount(e.target.value)}
              placeholder="Amount"
              className="placeholder:text-gray-500 placeholder:opacity-50"
            />
          </div>
        </div>

        {/* Price Display */}
        {amountCrypto && fiatAmount && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-gray-400">Price per {token}</p>
            <p className="text-2xl font-bold text-green-400">
              {pricePerUnit} {fiatCurrency}
            </p>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select onValueChange={handlePaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method..." />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map(method => (
                <SelectItem key={method.id} value={method.id}>
                  {method.method_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Payment Details Fields */}
        {selectedPaymentMethod && Object.keys(selectedPaymentMethod.fields).length > 0 && (
          <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
            <h3 className="font-semibold text-white">Payment Details</h3>
            {Object.entries(selectedPaymentMethod.fields).map(([field, placeholder]) => (
              <div key={field}>
                <Label htmlFor={field}>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <Input
                  id={field}
                  value={paymentDetails[field] || ''}
                  onChange={(e) => handlePaymentDetailChange(field, e.target.value)}
                  placeholder={placeholder}
                  className="placeholder:text-gray-500 placeholder:opacity-50"
                />
              </div>
            ))}
          </div>
        )}

        {/* Order Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minOrder">Min Order (optional)</Label>
            <Input
              id="minOrder"
              type="number"
              step="0.01"
              value={minOrderAmount}
              onChange={e => setMinOrderAmount(e.target.value)}
              placeholder="Minimum amount (optional)"
              className="placeholder:text-gray-500 placeholder:opacity-50"
            />
          </div>
          <div>
            <Label htmlFor="maxOrder">Max Order (optional)</Label>
            <Input
              id="maxOrder"
              type="number"
              step="0.01"
              value={maxOrderAmount}
              onChange={e => setMaxOrderAmount(e.target.value)}
              placeholder="Maximum amount (optional)"
              className="placeholder:text-gray-500 placeholder:opacity-50"
            />
          </div>
        </div>

        {/* Time Limit */}
        <div>
          <Label htmlFor="timeLimit">Payment Time Limit (minutes)</Label>
          <Select value={timeLimit.toString()} onValueChange={(v) => setTimeLimit(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleCreateAd} 
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating offer & locking escrow...
            </>
          ) : (
            'Create Offer'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
