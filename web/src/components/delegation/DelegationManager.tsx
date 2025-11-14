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
import { Users, TrendingUp, Shield, Clock, ChevronRight, Award } from 'lucide-react';
import DelegateProfile from './DelegateProfile';

const DelegationManager: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [delegationAmount, setDelegationAmount] = useState('');
  const [delegationPeriod, setDelegationPeriod] = useState('3months');

  const delegates = [
    {
      id: 1,
      name: 'Leyla Zana',
      address: '0x1234...5678',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      reputation: 9500,
      successRate: 92,
      totalDelegated: 125000,
      activeProposals: 8,
      categories: ['Treasury', 'Community'],
      description: 'Focused on community development and treasury management',
      performance: {
        proposalsCreated: 45,
        proposalsPassed: 41,
        participationRate: 98
      }
    },
    {
      id: 2,
      name: 'Mazlum Doğan',
      address: '0x8765...4321',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      reputation: 8800,
      successRate: 88,
      totalDelegated: 98000,
      activeProposals: 6,
      categories: ['Technical', 'Governance'],
      description: 'Technical expert specializing in protocol upgrades',
      performance: {
        proposalsCreated: 32,
        proposalsPassed: 28,
        participationRate: 95
      }
    },
    {
      id: 3,
      name: 'Sakine Cansız',
      address: '0x9876...1234',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      reputation: 9200,
      successRate: 90,
      totalDelegated: 110000,
      activeProposals: 7,
      categories: ['Community', 'Governance'],
      description: 'Community organizer with focus on inclusive governance',
      performance: {
        proposalsCreated: 38,
        proposalsPassed: 34,
        participationRate: 96
      }
    }
  ];

  const myDelegations = [
    {
      id: 1,
      delegate: 'Leyla Zana',
      amount: 5000,
      category: 'Treasury',
      period: '3 months',
      remaining: '45 days',
      status: 'active'
    },
    {
      id: 2,
      delegate: 'Mazlum Doğan',
      amount: 3000,
      category: 'Technical',
      period: '6 months',
      remaining: '120 days',
      status: 'active'
    }
  ];

  const handleDelegate = () => {
    console.log('Delegating:', { 
      delegate: selectedDelegate, 
      amount: delegationAmount, 
      period: delegationPeriod 
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('delegation.title')}</h1>
        <p className="text-gray-600">{t('delegation.description')}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">12</div>
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
                <div className="text-2xl font-bold">450K</div>
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
                <div className="text-2xl font-bold">89%</div>
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
                <div className="text-2xl font-bold">8K</div>
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
                {delegates.map((delegate) => (
                  <div
                    key={delegate.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDelegate(delegate)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <img
                          src={delegate.avatar}
                          alt={delegate.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {delegate.name}
                            <Badge className="bg-green-100 text-green-800">
                              {delegate.successRate}% success
                            </Badge>
                          </h3>
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
                              {(delegate.totalDelegated / 1000).toFixed(0)}K delegated
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
                ))}
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
                        placeholder="Enter PZK amount"
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
                {myDelegations.map((delegation) => (
                  <div key={delegation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{delegation.delegate}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span>{delegation.amount} PZK</span>
                          <Badge variant="secondary">{delegation.category}</Badge>
                          <span>{delegation.remaining} remaining</span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {delegation.status}
                      </Badge>
                    </div>
                    <Progress value={60} className="h-2" />
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        {t('delegation.modify')}
                      </Button>
                      <Button size="sm" variant="outline">
                        {t('delegation.revoke')}
                      </Button>
                    </div>
                  </div>
                ))}
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