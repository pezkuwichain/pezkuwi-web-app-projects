import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { usePolkadot } from '../contexts/PolkadotContext';
import AppColors, { KurdistanColors } from '../theme/colors';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: string;
  pendingRewards: string;
}

interface Referral {
  id: string;
  address: string;
  joinedDate: string;
  status: 'active' | 'pending';
  earned: string;
}

const ReferralScreen: React.FC = () => {
  const { t } = useTranslation();
  const { selectedAccount, api, connectWallet } = usePolkadot();
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status
  useEffect(() => {
    setIsConnected(!!selectedAccount);
  }, [selectedAccount]);

  // Generate referral code from wallet address
  const referralCode = selectedAccount
    ? `PZK-${selectedAccount.address.slice(0, 8).toUpperCase()}`
    : 'PZK-CONNECT-WALLET';

  // Mock stats - will be fetched from pallet_referral
  // TODO: Fetch real stats from blockchain
  const stats: ReferralStats = {
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: '0.00 HEZ',
    pendingRewards: '0.00 HEZ',
  };

  // Mock referrals - will be fetched from blockchain
  // TODO: Query pallet-trust or referral pallet for actual referrals
  const referrals: Referral[] = [];

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      if (selectedAccount) {
        setIsConnected(true);
        Alert.alert('Connected', 'Your wallet has been connected to the referral system!');
      }
    } catch (error) {
      if (__DEV__) console.error('Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect wallet. Please try again.');
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleShareCode = async () => {
    try {
      const result = await Share.share({
        message: `Join Pezkuwi using my referral code: ${referralCode}\n\nGet rewards for becoming a citizen!`,
        title: 'Join Pezkuwi',
      });

      if (result.action === Share.sharedAction) {
        if (__DEV__) console.log('Shared successfully');
      }
    } catch (error) {
      if (__DEV__) console.error('Error sharing:', error);
    }
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[KurdistanColors.sor, KurdistanColors.zer]}
          style={styles.connectGradient}
        >
          <View style={styles.connectContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🤝</Text>
            </View>
            <Text style={styles.connectTitle}>Referral Program</Text>
            <Text style={styles.connectSubtitle}>
              Connect your wallet to access your referral dashboard
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[KurdistanColors.sor, KurdistanColors.zer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Referral Program</Text>
        <Text style={styles.headerSubtitle}>Earn rewards by inviting friends</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>
          <View style={styles.codeActions}>
            <TouchableOpacity
              style={[styles.codeButton, styles.copyButton]}
              onPress={handleCopyCode}
            >
              <Text style={styles.codeButtonIcon}>📋</Text>
              <Text style={styles.codeButtonText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.codeButton, styles.shareButton]}
              onPress={handleShareCode}
            >
              <Text style={styles.codeButtonIcon}>📤</Text>
              <Text style={styles.codeButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeReferrals}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalEarned}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pendingRewards}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Share your unique referral code with friends
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Joins</Text>
              <Text style={styles.stepDescription}>
                They use your code when applying for citizenship
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn Rewards</Text>
              <Text style={styles.stepDescription}>
                Get HEZ tokens when they become active citizens
              </Text>
            </View>
          </View>
        </View>

        {/* Referrals List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={styles.emptyStateText}>No referrals yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start inviting friends to earn rewards!
              </Text>
            </View>
          ) : (
            referrals.map((referral) => (
              <View key={referral.id} style={styles.referralCard}>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralAddress}>
                    {referral.address.substring(0, 8)}...
                    {referral.address.substring(referral.address.length - 6)}
                  </Text>
                  <Text style={styles.referralDate}>{referral.joinedDate}</Text>
                </View>
                <View style={styles.referralStats}>
                  <Text
                    style={[
                      styles.referralStatus,
                      referral.status === 'active'
                        ? styles.statusActive
                        : styles.statusPending,
                    ]}
                  >
                    {referral.status}
                  </Text>
                  <Text style={styles.referralEarned}>{referral.earned}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  connectGradient: {
    flex: 1,
  },
  connectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: KurdistanColors.spi,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  connectTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
    marginBottom: 12,
  },
  connectSubtitle: {
    fontSize: 16,
    color: KurdistanColors.spi,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 40,
  },
  connectButton: {
    backgroundColor: KurdistanColors.spi,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: KurdistanColors.sor,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: KurdistanColors.spi,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  codeCard: {
    backgroundColor: KurdistanColors.spi,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: KurdistanColors.sor,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#F0F0F0',
  },
  shareButton: {
    backgroundColor: KurdistanColors.sor,
  },
  codeButtonIcon: {
    fontSize: 16,
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.reş,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: KurdistanColors.spi,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: KurdistanColors.sor,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: KurdistanColors.spi,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KurdistanColors.sor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  referralCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: KurdistanColors.spi,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  referralInfo: {
    flex: 1,
  },
  referralAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  referralDate: {
    fontSize: 12,
    color: '#666',
  },
  referralStats: {
    alignItems: 'flex-end',
  },
  referralStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statusActive: {
    color: KurdistanColors.kesk,
  },
  statusPending: {
    color: KurdistanColors.zer,
  },
  referralEarned: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.sor,
  },
});

export default ReferralScreen;
