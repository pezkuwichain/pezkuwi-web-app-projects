import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface LimitOrder {
  id: string;
  type: 'buy' | 'sell';
  fromToken: string;
  toToken: string;
  fromAmount: number;
  limitPrice: number;
  currentPrice: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
}

interface LimitOrdersProps {
  fromToken: string;
  toToken: string;
  currentPrice: number;
  onCreateOrder?: (order: Omit<LimitOrder, 'id' | 'status' | 'createdAt' | 'expiresAt'>) => void;
}

export const LimitOrders: React.FC<LimitOrdersProps> = ({
  fromToken,
  toToken,
  currentPrice,
  onCreateOrder
}) => {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock orders (in production, fetch from blockchain)
  const [orders, setOrders] = useState<LimitOrder[]>([
    {
      id: '1',
      type: 'buy',
      fromToken: 'PEZ',
      toToken: 'HEZ',
      fromAmount: 100,
      limitPrice: 0.98,
      currentPrice: 1.02,
      status: 'pending',
      createdAt: Date.now() - 3600000,
      expiresAt: Date.now() + 82800000
    },
    {
      id: '2',
      type: 'sell',
      fromToken: 'HEZ',
      toToken: 'PEZ',
      fromAmount: 50,
      limitPrice: 1.05,
      currentPrice: 1.02,
      status: 'pending',
      createdAt: Date.now() - 7200000,
      expiresAt: Date.now() + 79200000
    }
  ]);

  const handleCreateOrder = () => {
    const newOrder: Omit<LimitOrder, 'id' | 'status' | 'createdAt' | 'expiresAt'> = {
      type: orderType,
      fromToken: orderType === 'buy' ? toToken : fromToken,
      toToken: orderType === 'buy' ? fromToken : toToken,
      fromAmount: parseFloat(amount),
      limitPrice: parseFloat(limitPrice),
      currentPrice
    };

    console.log('Creating limit order:', newOrder);

    // Add to orders list (mock)
    const order: LimitOrder = {
      ...newOrder,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 // 24 hours
    };

    setOrders([order, ...orders]);
    setShowCreateForm(false);
    setAmount('');
    setLimitPrice('');

    if (onCreateOrder) {
      onCreateOrder(newOrder);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: 'cancelled' as const } : order
    ));
  };

  const getStatusBadge = (status: LimitOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'filled':
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Filled
        </Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30">
          <X className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>;
    }
  };

  const getPriceDistance = (order: LimitOrder) => {
    const distance = ((order.limitPrice - order.currentPrice) / order.currentPrice) * 100;
    return distance;
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Limit Orders</CardTitle>
            <CardDescription>
              Set orders to execute at your target price
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : '+ New Order'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm && (
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="space-y-4">
              <div>
                <Label>Order Type</Label>
                <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'buy' | 'sell')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy">Buy {fromToken}</TabsTrigger>
                    <TabsTrigger value="sell">Sell {fromToken}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <Label>Amount ({orderType === 'buy' ? toToken : fromToken})</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>

              <div>
                <Label>Limit Price (1 {fromToken} = ? {toToken})</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Current market price: ${currentPrice.toFixed(4)}
                </div>
              </div>

              <div className="bg-gray-900 p-3 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You will {orderType}</span>
                  <span className="text-white font-semibold">
                    {amount || '0'} {orderType === 'buy' ? fromToken : toToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">When price reaches</span>
                  <span className="text-white font-semibold">
                    ${limitPrice || '0'} per {fromToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated total</span>
                  <span className="text-white font-semibold">
                    {((parseFloat(amount || '0') * parseFloat(limitPrice || '0'))).toFixed(2)} {orderType === 'buy' ? toToken : fromToken}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCreateOrder}
                disabled={!amount || !limitPrice}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Create Limit Order
              </Button>

              <div className="text-xs text-gray-500 text-center">
                Order will expire in 24 hours if not filled
              </div>
            </div>
          </Card>
        )}

        {/* Orders List */}
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No limit orders yet. Create one to get started!
            </div>
          ) : (
            orders.map(order => {
              const priceDistance = getPriceDistance(order);
              return (
                <Card key={order.id} className="bg-gray-800 border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.type === 'buy' ? 'default' : 'secondary'}>
                        {order.type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-white">
                        {order.fromToken} → {order.toToken}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-gray-400">Amount</div>
                      <div className="text-white font-semibold">
                        {order.fromAmount} {order.fromToken}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Limit Price</div>
                      <div className="text-white font-semibold">
                        ${order.limitPrice.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Price</div>
                      <div className="text-white">
                        ${order.currentPrice.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Distance</div>
                      <div className={priceDistance > 0 ? 'text-green-400' : 'text-red-400'}>
                        {priceDistance > 0 ? '+' : ''}{priceDistance.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created {new Date(order.createdAt).toLocaleString()}
                    </span>
                    {order.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="text-xs text-gray-500 text-center pt-2">
          Note: Limit orders require blockchain integration to execute automatically
        </div>
      </CardContent>
    </Card>
  );
};
