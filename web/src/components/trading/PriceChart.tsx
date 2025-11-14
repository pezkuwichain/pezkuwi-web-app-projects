import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChartProps {
  fromToken: string;
  toToken: string;
  currentPrice: number;
}

// Helper: Convert backend token symbols to user-facing display names
const getDisplayName = (token: string): string => {
  if (token === 'wUSDT') return 'USDT';
  if (token === 'wHEZ') return 'HEZ';
  return token; // HEZ, PEZ, etc. remain the same
};

export const PriceChart: React.FC<PriceChartProps> = ({ fromToken, toToken, currentPrice }) => {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [chartData, setChartData] = useState<any[]>([]);
  const [priceChange, setPriceChange] = useState<{ value: number; percent: number }>({ value: 0, percent: 0 });

  useEffect(() => {
    // Generate mock historical data (in production, fetch from blockchain/oracle)
    const generateMockData = () => {
      const dataPoints = timeframe === '1H' ? 60 : timeframe === '24H' ? 24 : timeframe === '7D' ? 7 : 30;
      const basePrice = currentPrice || 1.0;

      const data = [];
      let price = basePrice * 0.95; // Start 5% below current

      for (let i = 0; i < dataPoints; i++) {
        // Random walk with slight upward trend
        const change = (Math.random() - 0.48) * 0.02; // Slight bullish bias
        price = price * (1 + change);

        let timeLabel = '';
        const now = new Date();

        if (timeframe === '1H') {
          now.setMinutes(now.getMinutes() - (dataPoints - i));
          timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (timeframe === '24H') {
          now.setHours(now.getHours() - (dataPoints - i));
          timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit' });
        } else if (timeframe === '7D') {
          now.setDate(now.getDate() - (dataPoints - i));
          timeLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          now.setDate(now.getDate() - (dataPoints - i));
          timeLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        data.push({
          time: timeLabel,
          price: parseFloat(price.toFixed(4)),
          timestamp: now.getTime()
        });
      }

      // Add current price as last point
      data.push({
        time: 'Now',
        price: basePrice,
        timestamp: Date.now()
      });

      return data;
    };

    const data = generateMockData();
    setChartData(data);

    // Calculate price change
    if (data.length > 1) {
      const firstPrice = data[0].price;
      const lastPrice = data[data.length - 1].price;
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;
      setPriceChange({ value: change, percent: changePercent });
    }
  }, [timeframe, currentPrice]);

  const isPositive = priceChange.percent >= 0;

  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">
            {getDisplayName(fromToken)}/{getDisplayName(toToken)} Price
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">
              ${currentPrice.toFixed(4)}
            </span>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%
            </div>
          </div>
        </div>

        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="1H" className="text-xs">1H</TabsTrigger>
            <TabsTrigger value="24H" className="text-xs">24H</TabsTrigger>
            <TabsTrigger value="7D" className="text-xs">7D</TabsTrigger>
            <TabsTrigger value="30D" className="text-xs">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${isPositive ? 'green' : 'red'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(3)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '8px'
            }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => [`$${value.toFixed(4)}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            fill={`url(#gradient-${isPositive ? 'green' : 'red'})`}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Historical price data • Updated in real-time
      </div>
    </Card>
  );
};
