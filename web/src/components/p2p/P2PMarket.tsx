import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Search, Filter, TrendingUp, TrendingDown, User, Shield, Clock, DollarSign, Plus, X, SlidersHorizontal, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface P2POffer {
  id: string;
  type: 'buy' | 'sell';
  token: 'HEZ' | 'PEZ';
  amount: number;
  price: number;
  paymentMethod: string;
  seller: {
    name: string;
    rating: number;
    completedTrades: number;
    verified: boolean;
  };
  minOrder: number;
  maxOrder: number;
  timeLimit: number;
}

export const P2PMarket: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedToken, setSelectedToken] = useState<'HEZ' | 'PEZ'>('HEZ');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<P2POffer | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');

  // Advanced filters
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'trades'>('price');
  const [showFilters, setShowFilters] = useState(false);

  // Order creation
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderPrice, setNewOrderPrice] = useState('');
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState('Bank Transfer');

  const offers: P2POffer[] = [
    {
      id: '1',
      type: 'sell',
      token: 'HEZ',
      amount: 10000,
      price: 0.95,
      paymentMethod: 'Bank Transfer',
      seller: {
        name: 'CryptoTrader',
        rating: 4.8,
        completedTrades: 234,
        verified: true
      },
      minOrder: 100,
      maxOrder: 5000,
      timeLimit: 30
    },
    {
      id: '2',
      type: 'sell',
      token: 'HEZ',
      amount: 5000,
      price: 0.96,
      paymentMethod: 'PayPal',
      seller: {
        name: 'TokenMaster',
        rating: 4.9,
        completedTrades: 567,
        verified: true
      },
      minOrder: 50,
      maxOrder: 2000,
      timeLimit: 15
    },
    {
      id: '3',
      type: 'buy',
      token: 'PEZ',
      amount: 15000,
      price: 1.02,
      paymentMethod: 'Crypto',
      seller: {
        name: 'PezWhale',
        rating: 4.7,
        completedTrades: 123,
        verified: false
      },
      minOrder: 500,
      maxOrder: 10000,
      timeLimit: 60
    },
    {
      id: '4',
      type: 'sell',
      token: 'PEZ',
      amount: 8000,
      price: 1.01,
      paymentMethod: 'Wire Transfer',
      seller: {
        name: 'QuickTrade',
        rating: 4.6,
        completedTrades: 89,
        verified: true
      },
      minOrder: 200,
      maxOrder: 3000,
      timeLimit: 45
    }
  ];

  // Payment methods list
  const paymentMethods = ['Bank Transfer', 'PayPal', 'Crypto', 'Wire Transfer', 'Cash', 'Mobile Money'];

  // Advanced filtering and sorting
  const filteredOffers = offers
    .filter(offer => {
      // Basic filters
      if (offer.type !== activeTab) return false;
      if (offer.token !== selectedToken) return false;
      if (searchTerm && !offer.seller.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // Payment method filter
      if (paymentMethodFilter !== 'all' && offer.paymentMethod !== paymentMethodFilter) return false;

      // Price range filter
      if (minPrice && offer.price < parseFloat(minPrice)) return false;
      if (maxPrice && offer.price > parseFloat(maxPrice)) return false;

      return true;
    })
    .sort((a, b) => {
      // Sorting logic
      if (sortBy === 'price') {
        return activeTab === 'buy' ? a.price - b.price : b.price - a.price;
      } else if (sortBy === 'rating') {
        return b.seller.rating - a.seller.rating;
      } else if (sortBy === 'trades') {
        return b.seller.completedTrades - a.seller.completedTrades;
      }
      return 0;
    });

  // Escrow state
  const [showEscrow, setShowEscrow] = useState(false);
  const [escrowStep, setEscrowStep] = useState<'funding' | 'confirmation' | 'release'>('funding');
  const [escrowOffer, setEscrowOffer] = useState<P2POffer | null>(null);

  const handleTrade = (offer: P2POffer) => {
    console.log('Initiating trade:', tradeAmount, offer.token, 'with', offer.seller.name);
    setEscrowOffer(offer);
    setShowEscrow(true);
    setEscrowStep('funding');
  };

  const handleEscrowFund = () => {
    console.log('Funding escrow with:', tradeAmount, escrowOffer?.token);
    setEscrowStep('confirmation');
  };

  const handleEscrowConfirm = () => {
    console.log('Confirming payment received');
    setEscrowStep('release');
  };

  const handleEscrowRelease = () => {
    console.log('Releasing escrow funds');
    setShowEscrow(false);
    setSelectedOffer(null);
    setEscrowOffer(null);
    setEscrowStep('funding');
  };

  return (
    <div className="space-y-6">
      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">HEZ Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$0.95</div>
            <div className="flex items-center text-green-500 text-xs mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.3%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">PEZ Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$1.02</div>
            <div className="flex items-center text-red-500 text-xs mt-1">
              <TrendingDown className="w-3 h-3 mr-1" />
              -0.8%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$2.4M</div>
            <p className="text-xs text-gray-500 mt-1">1,234 trades</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">Active Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">342</div>
            <p className="text-xs text-gray-500 mt-1">89 verified sellers</p>
          </CardContent>
        </Card>
      </div>

      {/* P2P Trading Interface */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-white">P2P Market</CardTitle>
          <CardDescription className="text-gray-400">
            Buy and sell tokens directly with other users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Top Action Bar */}
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setShowCreateOrder(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-700"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Basic Filters */}
            <div className="flex flex-wrap gap-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')} className="flex-1">
                <TabsList className="grid w-full max-w-[200px] grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v as 'HEZ' | 'PEZ')}>
                <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEZ">HEZ</SelectItem>
                  <SelectItem value="PEZ">PEZ</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search sellers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              {/* Sort Selector */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'price' | 'rating' | 'trades')}>
                <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="trades">Trades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters Panel (Binance P2P style) */}
            {showFilters && (
              <Card className="bg-gray-800 border-gray-700 p-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Advanced Filters
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Payment Method Filter */}
                    <div>
                      <Label className="text-sm text-gray-400">Payment Method</Label>
                      <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                        <SelectTrigger className="bg-gray-900 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Methods</SelectItem>
                          {paymentMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Min Price Filter */}
                    <div>
                      <Label className="text-sm text-gray-400">Min Price ($)</Label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>

                    {/* Max Price Filter */}
                    <div>
                      <Label className="text-sm text-gray-400">Max Price ($)</Label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPaymentMethodFilter('all');
                      setMinPrice('');
                      setMaxPrice('');
                      setSearchTerm('');
                    }}
                    className="border-gray-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All Filters
                  </Button>
                </div>
              </Card>
            )}

            {/* Offers List */}
            <div className="space-y-3">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{offer.seller.name}</span>
                            {offer.seller.verified && (
                              <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>⭐ {offer.seller.rating}</span>
                            <span>{offer.seller.completedTrades} trades</span>
                            <span>{offer.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold text-white">
                          ${offer.price} / {offer.token}
                        </div>
                        <div className="text-sm text-gray-400">
                          Available: {offer.amount.toLocaleString()} {offer.token}
                        </div>
                        <div className="text-xs text-gray-500">
                          Limits: {offer.minOrder} - {offer.maxOrder} {offer.token}
                        </div>
                      </div>

                      <Button 
                        className="ml-4 bg-green-600 hover:bg-green-700"
                        onClick={() => setSelectedOffer(offer)}
                      >
                        {activeTab === 'buy' ? 'Buy' : 'Sell'} {offer.token}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Modal */}
      {selectedOffer && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>
              {activeTab === 'buy' ? 'Buy' : 'Sell'} {selectedOffer.token} from {selectedOffer.seller.name}
            </CardTitle>
            <CardDescription>Complete your P2P trade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Amount ({selectedOffer.token})</Label>
              <Input
                type="number"
                placeholder={`Min: ${selectedOffer.minOrder}, Max: ${selectedOffer.maxOrder}`}
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price per {selectedOffer.token}</span>
                <span className="text-white">${selectedOffer.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Amount</span>
                <span className="text-white font-semibold">
                  ${(parseFloat(tradeAmount || '0') * selectedOffer.price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Payment Method</span>
                <span className="text-white">{selectedOffer.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Time Limit</span>
                <span className="text-white">{selectedOffer.timeLimit} minutes</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleTrade(selectedOffer)}
              >
                Confirm {activeTab === 'buy' ? 'Purchase' : 'Sale'}
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedOffer(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Order Modal (Binance P2P style) */}
      {showCreateOrder && (
        <Card className="bg-gray-900 border-gray-800 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Create P2P Order</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateOrder(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              Create a {activeTab === 'buy' ? 'buy' : 'sell'} order for {selectedToken}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Order Type</Label>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label>Token</Label>
              <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v as 'HEZ' | 'PEZ')}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEZ">HEZ</SelectItem>
                  <SelectItem value="PEZ">PEZ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount ({selectedToken})</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={newOrderAmount}
                onChange={(e) => setNewOrderAmount(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div>
              <Label>Price per {selectedToken} ($)</Label>
              <Input
                type="number"
                placeholder="Enter price"
                value={newOrderPrice}
                onChange={(e) => setNewOrderPrice(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select value={newOrderPaymentMethod} onValueChange={setNewOrderPaymentMethod}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Value</span>
                <span className="text-white font-semibold">
                  ${(parseFloat(newOrderAmount || '0') * parseFloat(newOrderPrice || '0')).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  console.log('Creating order:', {
                    type: activeTab,
                    token: selectedToken,
                    amount: newOrderAmount,
                    price: newOrderPrice,
                    paymentMethod: newOrderPaymentMethod
                  });
                  // TODO: Implement blockchain integration
                  setShowCreateOrder(false);
                }}
              >
                Create Order
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateOrder(false)}
              >
                Cancel
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Note: Blockchain integration for P2P orders is coming soon
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escrow Modal (Binance P2P Escrow style) */}
      {showEscrow && escrowOffer && (
        <Card className="bg-gray-900 border-gray-800 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                Secure Escrow Trade
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowEscrow(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              Trade safely with escrow protection • {activeTab === 'buy' ? 'Buying' : 'Selling'} {escrowOffer.token}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Escrow Steps Indicator */}
            <div className="flex justify-between items-center">
              {[
                { step: 'funding', label: 'Fund Escrow', icon: Lock },
                { step: 'confirmation', label: 'Payment', icon: Clock },
                { step: 'release', label: 'Complete', icon: CheckCircle }
              ].map((item, idx) => (
                <div key={item.step} className="flex-1 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    escrowStep === item.step ? 'bg-blue-600' :
                    ['funding', 'confirmation', 'release'].indexOf(escrowStep) > idx ? 'bg-green-600' : 'bg-gray-700'
                  }`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{item.label}</span>
                  {idx < 2 && (
                    <div className={`absolute w-32 h-0.5 mt-5 ${
                      ['funding', 'confirmation', 'release'].indexOf(escrowStep) > idx ? 'bg-green-600' : 'bg-gray-700'
                    }`} style={{ left: `calc(${(idx + 1) * 33.33}% - 64px)` }}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Trade Details Card */}
            <Card className="bg-gray-800 border-gray-700 p-4">
              <h4 className="font-semibold text-white mb-3">Trade Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Seller</span>
                  <span className="text-white font-semibold">{escrowOffer.seller.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-semibold">{tradeAmount} {escrowOffer.token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price per {escrowOffer.token}</span>
                  <span className="text-white font-semibold">${escrowOffer.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-white font-semibold">{escrowOffer.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Total</span>
                  <span className="text-lg font-bold text-white">
                    ${(parseFloat(tradeAmount || '0') * escrowOffer.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Step Content */}
            {escrowStep === 'funding' && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      <strong>Escrow Protection:</strong> Your funds will be held securely in smart contract escrow until both parties confirm the trade. This protects both buyer and seller.
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  1. Fund the escrow with {tradeAmount} {escrowOffer.token}<br />
                  2. Wait for seller to provide payment details<br />
                  3. Complete payment via {escrowOffer.paymentMethod}<br />
                  4. Confirm payment to release escrow
                </div>

                <Button
                  onClick={handleEscrowFund}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Fund Escrow ({tradeAmount} {escrowOffer.token})
                </Button>
              </div>
            )}

            {escrowStep === 'confirmation' && (
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                      <strong>Waiting for Payment:</strong> Complete your {escrowOffer.paymentMethod} payment and click confirm when done. Do not release escrow until payment is verified!
                    </div>
                  </div>
                </div>

                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h4 className="font-semibold text-white mb-2">Payment Instructions</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>• Payment Method: {escrowOffer.paymentMethod}</p>
                    <p>• Amount: ${(parseFloat(tradeAmount || '0') * escrowOffer.price).toFixed(2)}</p>
                    <p>• Time Limit: {escrowOffer.timeLimit} minutes</p>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEscrow(false);
                      setEscrowStep('funding');
                    }}
                    className="flex-1"
                  >
                    Cancel Trade
                  </Button>
                  <Button
                    onClick={handleEscrowConfirm}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    I've Made Payment
                  </Button>
                </div>
              </div>
            )}

            {escrowStep === 'release' && (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-200">
                      <strong>Payment Confirmed:</strong> Your payment has been verified. The escrow will be released to the seller automatically.
                    </div>
                  </div>
                </div>

                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h4 className="font-semibold text-white mb-2">Trade Summary</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>✅ Escrow Funded: {tradeAmount} {escrowOffer.token}</p>
                    <p>✅ Payment Sent: ${(parseFloat(tradeAmount || '0') * escrowOffer.price).toFixed(2)}</p>
                    <p>✅ Payment Verified</p>
                    <p className="text-green-400 font-semibold mt-2">🎉 Trade Completed Successfully!</p>
                  </div>
                </Card>

                <Button
                  onClick={handleEscrowRelease}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Close & Release Escrow
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center">
              Note: Smart contract escrow integration coming soon
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overlay */}
      {(showCreateOrder || selectedOffer || showEscrow) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => {
          setShowCreateOrder(false);
          setSelectedOffer(null);
          setShowEscrow(false);
        }}></div>
      )}
    </div>
  );
};