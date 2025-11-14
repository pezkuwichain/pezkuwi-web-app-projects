import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, Crown, Shield, Users } from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { getUserTikis } from '@/lib/citizenship-workflow';
import type { TikiInfo } from '@/lib/citizenship-workflow';

// Icon map for different Tiki roles
const getTikiIcon = (role: string) => {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('hemwelatî') || roleLower.includes('welati') || roleLower.includes('citizen')) {
    return <Shield className="w-6 h-6 text-cyan-500" />;
  }
  if (roleLower.includes('leader') || roleLower.includes('chief')) {
    return <Crown className="w-6 h-6 text-yellow-500" />;
  }
  if (roleLower.includes('elder') || roleLower.includes('wise')) {
    return <Award className="w-6 h-6 text-purple-500" />;
  }
  return <Users className="w-6 h-6 text-green-500" />;
};

// Color scheme for different roles
const getRoleBadgeColor = (role: string) => {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('hemwelatî') || roleLower.includes('welati') || roleLower.includes('citizen')) {
    return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30';
  }
  if (roleLower.includes('leader') || roleLower.includes('chief')) {
    return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
  }
  if (roleLower.includes('elder') || roleLower.includes('wise')) {
    return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
  }
  return 'bg-green-500/10 text-green-500 border-green-500/30';
};

export const NftList: React.FC = () => {
  const { api, isApiReady, selectedAccount } = usePolkadot();
  const [tikis, setTikis] = useState<TikiInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTikis = async () => {
      if (!api || !isApiReady || !selectedAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userTikis = await getUserTikis(api, selectedAccount.address);
        setTikis(userTikis);
      } catch (err) {
        console.error('Error fetching Tikis:', err);
        setError('Failed to load NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchTikis();
  }, [api, isApiReady, selectedAccount]);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your NFTs (Tikis)</CardTitle>
          <CardDescription>Your Tiki collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your NFTs (Tikis)</CardTitle>
          <CardDescription>Your Tiki collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tikis.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your NFTs (Tikis)</CardTitle>
          <CardDescription>Your Tiki collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No NFTs yet</p>
            <p className="text-gray-600 text-sm">
              Complete your citizenship application to receive your Welati Tiki NFT
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Award className="w-5 h-5" />
          Your NFTs (Tikiler)
        </CardTitle>
        <CardDescription>Your Tiki collection ({tikis.length} total)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tikis.map((tiki, index) => (
            <div
              key={index}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getTikiIcon(tiki.role)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm">
                      Tiki #{tiki.id}
                    </h3>
                    <Badge className={getRoleBadgeColor(tiki.role)}>
                      {tiki.role === 'Hemwelatî' ? 'Welati' : tiki.role}
                    </Badge>
                  </div>

                  {/* Metadata if available */}
                  {tiki.metadata && typeof tiki.metadata === 'object' && (
                    <div className="space-y-1 mt-2">
                      {Object.entries(tiki.metadata).map(([key, value]) => (
                        <div key={key} className="text-xs text-gray-400">
                          <span className="font-medium">{key}:</span>{' '}
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
