import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { toast } from 'sonner';
import { 
  getPoolMember, 
  getPoolSize, 
  getCurrentValidatorSet, 
  joinValidatorPool, 
  leaveValidatorPool, 
  updateValidatorCategory,
  ValidatorPoolCategory 
} from '@shared/lib/validator-pool';
import { Loader2, Users, UserCheck, UserX } from 'lucide-react';
import { PoolCategorySelector } from './PoolCategorySelector';

export function ValidatorPoolDashboard() {
  const { api, selectedAccount } = usePolkadot();
  const [poolMember, setPoolMember] = useState<ValidatorPoolCategory | null>(null);
  const [poolSize, setPoolSize] = useState(0);
  const [validatorCount, setValidatorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      
      const [size, validatorSet] = await Promise.all([
        getPoolSize(api),
        getCurrentValidatorSet(api),
      ]);
      
      setPoolSize(size);
      
      // Calculate total validator count
      if (validatorSet) {
        const total = validatorSet.stake_validators.length + 
                     validatorSet.parliamentary_validators.length + 
                     validatorSet.merit_validators.length;
        setValidatorCount(total);
      }

      if (selectedAccount) {
        const memberData = await getPoolMember(api, selectedAccount.address);
        setPoolMember(memberData);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to fetch validator pool data:', error);
      toast.error('Failed to fetch pool data');
    } finally {
      setLoading(false);
    }
  }, [api, selectedAccount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async (category: ValidatorPoolCategory) => {
    if (!api || !selectedAccount) return;
    setActionLoading(true);
    try {
      await joinValidatorPool(api, selectedAccount, category);
      toast.success(`Joined the ${category} pool`);
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Join pool error:', error);
      // Error toast already shown in joinValidatorPool
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!api || !selectedAccount) return;
    setActionLoading(true);
    try {
      await leaveValidatorPool(api, selectedAccount);
      toast.success('Left the validator pool');
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Leave pool error:', error);
      // Error toast already shown in leaveValidatorPool
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategorySwitch = async (newCategory: ValidatorPoolCategory) => {
    if (!api || !selectedAccount) return;
    setActionLoading(true);
    try {
      await updateValidatorCategory(api, selectedAccount, newCategory);
      toast.success(`Switched to ${newCategory}`);
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Switch category error:', error);
      // Error toast already shown in updateValidatorCategory
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading validator pool info...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Validator Pool</CardTitle>
        <CardDescription>Join a pool to support the network and earn rewards.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center text-gray-400 mb-2">
              <Users className="w-4 h-4 mr-2" />
              Pool Size
            </div>
            <div className="text-2xl font-bold text-white">{poolSize}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center text-gray-400 mb-2">
              <UserCheck className="w-4 h-4 mr-2" />
              Active Validators
            </div>
            <div className="text-2xl font-bold text-white">{validatorCount}</div>
          </div>
        </div>

        {selectedAccount ? (
          poolMember ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400">
                  You are in the <span className="font-bold">{poolMember}</span> pool
                </p>
              </div>
              <PoolCategorySelector
                currentCategory={poolMember}
                onCategoryChange={handleCategorySwitch}
                disabled={actionLoading}
              />
              <Button 
                onClick={handleLeave} 
                variant="destructive" 
                disabled={actionLoading} 
                className="w-full"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="mr-2 h-4 w-4" />
                )}
                Leave Pool
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400">You are not currently in a validator pool</p>
              </div>
              <PoolCategorySelector 
                onCategoryChange={handleJoin} 
                disabled={actionLoading} 
              />
            </div>
          )
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-400">Please connect your wallet to manage pool membership</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
