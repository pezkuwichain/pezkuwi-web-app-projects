import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { usePolkadot } from '../contexts/PolkadotContext';
import { AppColors, KurdistanColors } from '../theme/colors';
import {
  Card,
  Button,
  Input,
  BottomSheet,
  Badge,
  CardSkeleton,
} from '../components';
import {
  calculateTikiScore,
  calculateWeightedScore,
  calculateMonthlyPEZReward,
  SCORE_WEIGHTS,
} from '@pezkuwi/lib/staking';
import { fetchUserTikis } from '@pezkuwi/lib/tiki';
import { formatBalance } from '@pezkuwi/lib/wallet';

interface StakingData {
  stakedAmount: string;
  unbondingAmount: string;
  totalRewards: string;
  monthlyReward: string;
  tikiScore: number;
  weightedScore: number;
  estimatedAPY: string;
}

/**
 * Staking Screen
 * View staking status, stake/unstake, track rewards
 * Inspired by Polkadot.js and Argent staking interfaces
 */
export default function StakingScreen() {
  const { api, selectedAccount, isApiReady } = usePolkadot();
  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stakeSheetVisible, setStakeSheetVisible] = useState(false);
  const [unstakeSheetVisible, setUnstakeSheetVisible] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchStakingData = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!api || !selectedAccount) return;

      // Get staking info from chain
      const stakingInfo = await api.query.staking?.ledger(selectedAccount.address);

      let stakedAmount = '0';
      let unbondingAmount = '0';

      if (stakingInfo && stakingInfo.isSome) {
        const ledger = stakingInfo.unwrap();
        stakedAmount = ledger.active.toString();

        // Calculate unbonding
        if (ledger.unlocking && ledger.unlocking.length > 0) {
          unbondingAmount = ledger.unlocking
            .reduce((sum: bigint, unlock: { value: { toString: () => string } }) => sum + BigInt(unlock.value.toString()), BigInt(0))
            .toString();
        }
      }

      // Get user's tiki roles
      const tikis = await fetchUserTikis(api, selectedAccount.address);
      const tikiScore = calculateTikiScore(tikis);

      // Get citizenship status score
      const citizenStatus = await api.query.identityKyc?.kycStatus(selectedAccount.address);
      const citizenshipScore = citizenStatus && !citizenStatus.isEmpty ? 100 : 0;

      // Calculate weighted score
      const weightedScore = calculateWeightedScore(
        tikiScore,
        citizenshipScore,
        0 // NFT score (would need to query NFT ownership)
      );

      // Calculate monthly reward
      const monthlyReward = calculateMonthlyPEZReward(weightedScore);

      // Get total rewards (would need historical data)
      const totalRewards = '0'; // Placeholder

      // Estimated APY (simplified calculation)
      const stakedAmountNum = parseFloat(formatBalance(stakedAmount, 12));
      const monthlyRewardNum = monthlyReward;
      const yearlyReward = monthlyRewardNum * 12;
      const estimatedAPY = stakedAmountNum > 0
        ? ((yearlyReward / stakedAmountNum) * 100).toFixed(2)
        : '0';

      setStakingData({
        stakedAmount,
        unbondingAmount,
        totalRewards,
        monthlyReward: monthlyReward.toFixed(2),
        tikiScore,
        weightedScore,
        estimatedAPY,
      });
    } catch (error) {
      if (__DEV__) console.error('Error fetching staking data:', error);
      Alert.alert('Error', 'Failed to load staking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, selectedAccount]);

  useEffect(() => {
    if (isApiReady && selectedAccount) {
      void fetchStakingData();
    }
  }, [isApiReady, selectedAccount, fetchStakingData]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);

      if (!api || !selectedAccount) return;

      // Convert amount to planck (smallest unit)
      const amountPlanck = BigInt(Math.floor(parseFloat(stakeAmount) * 1e12));

      // Bond tokens
      const tx = api.tx.staking.bond(amountPlanck.toString(), 'Staked');
      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock) {
          Alert.alert('Success', `Successfully staked ${stakeAmount} HEZ!`);
          setStakeSheetVisible(false);
          setStakeAmount('');
          fetchStakingData();
        }
      });
    } catch (error: unknown) {
      if (__DEV__) console.error('Staking error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to stake tokens');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);

      if (!api || !selectedAccount) return;

      const amountPlanck = BigInt(Math.floor(parseFloat(unstakeAmount) * 1e12));

      // Unbond tokens
      const tx = api.tx.staking.unbond(amountPlanck.toString());
      await tx.signAndSend(selectedAccount.address, ({ status }) => {
        if (status.isInBlock) {
          Alert.alert(
            'Success',
            `Successfully initiated unstaking of ${unstakeAmount} HEZ!\n\nTokens will be available after the unbonding period (28 eras / ~28 days).`
          );
          setUnstakeSheetVisible(false);
          setUnstakeAmount('');
          fetchStakingData();
        }
      });
    } catch (error: unknown) {
      if (__DEV__) console.error('Unstaking error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to unstake tokens');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !stakingData) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

  if (!stakingData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load staking data</Text>
          <Button title="Retry" onPress={fetchStakingData} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchStakingData();
          }} />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Text style={styles.headerTitle}>Total Staked</Text>
          <Text style={styles.headerAmount}>
            {formatBalance(stakingData.stakedAmount, 12)} HEZ
          </Text>
          <Text style={styles.headerSubtitle}>
            ≈ ${(parseFloat(formatBalance(stakingData.stakedAmount, 12)) * 0.15).toFixed(2)} USD
          </Text>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Monthly Reward</Text>
            <Text style={styles.statValue}>{stakingData.monthlyReward} PEZ</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Est. APY</Text>
            <Text style={styles.statValue}>{stakingData.estimatedAPY}%</Text>
          </Card>
        </View>

        {/* Score Card */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Your Staking Score</Text>
            <Badge label={`${stakingData.weightedScore} pts`} variant="primary" />
          </View>
          <View style={styles.scoreBreakdown}>
            <ScoreItem
              label="Tiki Score"
              value={stakingData.tikiScore}
              weight={SCORE_WEIGHTS.tiki}
            />
            <ScoreItem
              label="Citizenship"
              value={100}
              weight={SCORE_WEIGHTS.citizenship}
            />
          </View>
          <Text style={styles.scoreNote}>
            Higher score = Higher monthly PEZ rewards
          </Text>
        </Card>

        {/* Unbonding Card */}
        {parseFloat(formatBalance(stakingData.unbondingAmount, 12)) > 0 && (
          <Card style={styles.unbondingCard}>
            <Text style={styles.unbondingTitle}>Unbonding</Text>
            <Text style={styles.unbondingAmount}>
              {formatBalance(stakingData.unbondingAmount, 12)} HEZ
            </Text>
            <Text style={styles.unbondingNote}>
              Available after unbonding period (~28 days)
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Stake HEZ"
            onPress={() => setStakeSheetVisible(true)}
            variant="primary"
            fullWidth
          />
          <Button
            title="Unstake"
            onPress={() => setUnstakeSheetVisible(true)}
            variant="outline"
            fullWidth
          />
        </View>

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 About Staking</Text>
          <Text style={styles.infoText}>
            Stake HEZ tokens to earn monthly PEZ rewards. Your reward amount is based on your staking score, which includes your Tiki roles and citizenship status.
          </Text>
        </Card>
      </ScrollView>

      {/* Stake Bottom Sheet */}
      <BottomSheet
        visible={stakeSheetVisible}
        onClose={() => setStakeSheetVisible(false)}
        title="Stake HEZ"
      >
        <Input
          label="Amount (HEZ)"
          value={stakeAmount}
          onChangeText={setStakeAmount}
          keyboardType="numeric"
          placeholder="0.00"
        />
        <Button
          title="Stake"
          onPress={handleStake}
          loading={processing}
          disabled={processing}
          fullWidth
          style={{ marginTop: 16 }}
        />
      </BottomSheet>

      {/* Unstake Bottom Sheet */}
      <BottomSheet
        visible={unstakeSheetVisible}
        onClose={() => setUnstakeSheetVisible(false)}
        title="Unstake HEZ"
      >
        <Input
          label="Amount (HEZ)"
          value={unstakeAmount}
          onChangeText={setUnstakeAmount}
          keyboardType="numeric"
          placeholder="0.00"
        />
        <Text style={styles.warningText}>
          ⚠️ Unstaked tokens will be locked for ~28 days (unbonding period)
        </Text>
        <Button
          title="Unstake"
          onPress={handleUnstake}
          loading={processing}
          disabled={processing}
          fullWidth
          style={{ marginTop: 16 }}
        />
      </BottomSheet>
    </View>
  );
}

const ScoreItem: React.FC<{ label: string; value: number; weight: number }> = ({
  label,
  value,
  weight,
}) => (
  <View style={styles.scoreItem}>
    <Text style={styles.scoreItemLabel}>{label}</Text>
    <View style={styles.scoreItemRight}>
      <Text style={styles.scoreItemValue}>{value} pts</Text>
      <Text style={styles.scoreItemWeight}>×{weight}%</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  headerAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: KurdistanColors.kesk,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
  },
  scoreCard: {
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
  },
  scoreBreakdown: {
    gap: 12,
    marginBottom: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreItemLabel: {
    fontSize: 14,
    color: AppColors.text,
  },
  scoreItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  scoreItemWeight: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  scoreNote: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
  unbondingCard: {
    marginBottom: 16,
    backgroundColor: `${KurdistanColors.zer}10`,
  },
  unbondingTitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  unbondingAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  unbondingNote: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    color: KurdistanColors.sor,
    marginVertical: 12,
    padding: 12,
    backgroundColor: `${KurdistanColors.sor}10`,
    borderRadius: 8,
  },
});
