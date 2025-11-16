import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, Shield, Clock, ChevronRight, Award, Loader2, Activity } from 'lucide-react';
import DelegateProfile from './DelegateProfile';
import { useDelegation } from '@/hooks/useDelegation';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { formatNumber } from '@/lib/utils';
import { LoadingState } from '@pezkuwi/components/AsyncComponent';

const DelegationManager: React.FC = () => {
  const { t } = useTranslation();
  const { selectedAccount } = usePolkadot();
  const { delegates, userDelegations, stats, loading, error } = useDelegation(selectedAccount?.address);
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [delegationAmount, setDelegationAmount] = useState('');
  const [delegationPeriod, setDelegationPeriod] = useState('3months');

  // Format token amounts from blockchain units (assuming 12 decimals for HEZ)
  const formatTokenAmount = (amount: string | number) => {
    const value = typeof amount === 'string' ? BigInt(amount) : BigInt(amount);
    return formatNumber(Number(value) / 1e12, 2);
  };

  const handleDelegate = () => {
    console.log('Delegating:', {
      delegate: selectedDelegate,
      amount: delegationAmount,
      period: delegationPeriod
    });
  };

  if (loading) {
    return <LoadingState message="Loading delegation data from blockchain..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading delegation data: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('delegation.title')}</h1>
            <p className="text-gray-600">{t('delegation.description')}</p>
          </div>
          <Badge variant="outline" className="bg-green-500/10 border-green-500 text-green-700">
            <Activity className="h-3 w-3 mr-1" />
            Live Blockchain Data
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.activeDelegates}</div>
                <div className="text-sm text-gray-600">{t('delegation.activeDelegates')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{formatTokenAmount(stats.totalDelegated)}</div>
                <div className="text-sm text-gray-600">{t('delegation.totalDelegated')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
                <div className="text-sm text-gray-600">{t('delegation.avgSuccessRate')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{formatTokenAmount(stats.userDelegated)}</div>
                <div className="text-sm text-gray-600">{t('delegation.yourDelegated')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-green-50 text-gray-900">
          <TabsTrigger value="explore">{t('delegation.explore')}</TabsTrigger>
          <TabsTrigger value="my-delegations">{t('delegation.myDelegations')}</TabsTrigger>
          <TabsTrigger value="delegate-profile">{t('delegation.becomeDelegate')}</TabsTrigger>
        </TabsList>

        <TabsContent value="explore">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle>{t('delegation.topDelegates')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {delegates.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                      No active delegates found on the blockchain.
                    </CardContent>
                  </Card>
                ) : (
                  delegates.map((delegate) => (
                    <div
                      key={delegate.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedDelegate(delegate)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                            {delegate.address.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {delegate.name}
                              <Badge className="bg-green-100 text-green-800">
                                {delegate.successRate}% success
                              </Badge>
                            </h3>
                            <p className="text-sm text-gray-600 mb-1 font-mono">{delegate.address}</p>
                            <p className="text-sm text-gray-600 mb-2">{delegate.description}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {delegate.categories.map((cat) => (
                                <Badge key={cat} variant="secondary">{cat}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {delegate.reputation} rep
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {formatTokenAmount(delegate.totalDelegated)} HEZ delegated
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {delegate.delegatorCount} delegators
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {delegate.activeProposals} active
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Delegation Form */}
              {selectedDelegate && (
                <Card className="mt-6 border-2 border-green-500">
                  <CardHeader>
                    <CardTitle>{t('delegation.delegateTo')} {selectedDelegate.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount">{t('delegation.amount')}</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter HEZ amount"
                        value={delegationAmount}
                        onChange={(e) => setDelegationAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="period">{t('delegation.period')}</Label>
                      <Select value={delegationPeriod} onValueChange={setDelegationPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1month">1 Month</SelectItem>
                          <SelectItem value="3months">3 Months</SelectItem>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="1year">1 Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('delegation.categories')}</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Treasury', 'Technical', 'Community', 'Governance'].map((cat) => (
                          <label key={cat} className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span>{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={handleDelegate}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {t('delegation.confirmDelegation')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-delegations">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle>{t('delegation.yourDelegations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userDelegations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                      {selectedAccount
                        ? "You haven't delegated any voting power yet."
                        : "Connect your wallet to view your delegations."}
                    </CardContent>
                  </Card>
                ) : (
                  userDelegations.map((delegation) => (
                    <div key={delegation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{delegation.delegate}</h4>
                          <p className="text-xs text-gray-500 font-mono mb-2">{delegation.delegateAddress}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span>{formatTokenAmount(delegation.amount)} HEZ</span>
                            <Badge variant="secondary">Conviction: {delegation.conviction}x</Badge>
                            {delegation.category && <Badge variant="secondary">{delegation.category}</Badge>}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {delegation.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          {t('delegation.modify')}
                        </Button>
                        <Button size="sm" variant="outline">
                          {t('delegation.revoke')}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delegate-profile">
          <DelegateProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DelegationManager;