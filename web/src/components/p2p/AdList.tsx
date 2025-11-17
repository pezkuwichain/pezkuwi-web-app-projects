import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TradeModal } from './TradeModal';
import { getActiveOffers, getUserReputation, type P2PFiatOffer, type P2PReputation } from '@shared/lib/p2p-fiat';
import { supabase } from '@/lib/supabase';

interface AdListProps {
  type: 'buy' | 'sell' | 'my-ads';
}

interface OfferWithReputation extends P2PFiatOffer {
  seller_reputation?: P2PReputation;
  payment_method_name?: string;
}

export function AdList({ type }: AdListProps) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<OfferWithReputation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithReputation | null>(null);

  useEffect(() => {
    fetchOffers();
  }, [type, user]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      let offersData: P2PFiatOffer[] = [];

      if (type === 'buy') {
        // Buy = looking for sell offers
        offersData = await getActiveOffers();
      } else if (type === 'my-ads' && user) {
        // My offers
        const { data } = await supabase
          .from('p2p_fiat_offers')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        
        offersData = data || [];
      }

      // Enrich with reputation and payment method
      const enrichedOffers = await Promise.all(
        offersData.map(async (offer) => {
          const [reputation, paymentMethod] = await Promise.all([
            getUserReputation(offer.seller_id),
            supabase
              .from('payment_methods')
              .select('method_name')
              .eq('id', offer.payment_method_id)
              .single()
          ]);

          return {
            ...offer,
            seller_reputation: reputation || undefined,
            payment_method_name: paymentMethod.data?.method_name
          };
        })
      );

      setOffers(enrichedOffers);
    } catch (error) {
      console.error('Fetch offers error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          {type === 'my-ads' ? 'You have no active offers' : 'No offers available'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map(offer => (
        <Card key={offer.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              {/* Seller Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-green-500/20 text-green-400">
                    {offer.seller_wallet.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">
                      {offer.seller_wallet.slice(0, 6)}...{offer.seller_wallet.slice(-4)}
                    </p>
                    {offer.seller_reputation?.verified_merchant && (
                      <Shield className="w-4 h-4 text-blue-400" title="Verified Merchant" />
                    )}
                    {offer.seller_reputation?.fast_trader && (
                      <Zap className="w-4 h-4 text-yellow-400" title="Fast Trader" />
                    )}
                  </div>
                  {offer.seller_reputation && (
                    <p className="text-sm text-gray-400">
                      {offer.seller_reputation.completed_trades} trades • {' '}
                      {((offer.seller_reputation.completed_trades / (offer.seller_reputation.total_trades || 1)) * 100).toFixed(0)}% completion
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-xl font-bold text-green-400">
                  {offer.price_per_unit.toFixed(2)} {offer.fiat_currency}
                </p>
              </div>

              {/* Available */}
              <div>
                <p className="text-sm text-gray-400">Available</p>
                <p className="text-lg font-semibold text-white">
                  {offer.remaining_amount} {offer.token}
                </p>
                {offer.min_order_amount && (
                  <p className="text-xs text-gray-500">
                    Min: {offer.min_order_amount} {offer.token}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-sm text-gray-400">Payment</p>
                <Badge variant="outline" className="mt-1">
                  {offer.payment_method_name || 'N/A'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {offer.time_limit_minutes} min limit
                </p>
              </div>

              {/* Action */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => setSelectedOffer(offer)}
                  disabled={type === 'my-ads'}
                  className="w-full md:w-auto"
                >
                  {type === 'buy' ? 'Buy' : 'Sell'} {offer.token}
                </Button>
              </div>
            </div>

            {/* Status badge for my-ads */}
            {type === 'my-ads' && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={offer.status === 'open' ? 'default' : 'secondary'}
                  >
                    {offer.status.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-400">
                    Created: {new Date(offer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {selectedOffer && (
        <TradeModal
          offer={selectedOffer}
          onClose={() => {
            setSelectedOffer(null);
            fetchOffers(); // Refresh list
          }}
        />
      )}
    </div>
  );
}
