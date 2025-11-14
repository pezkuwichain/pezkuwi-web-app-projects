import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppColors, { KurdistanColors } from '../theme/colors';

interface DashboardScreenProps {
  onNavigateToWallet: () => void;
  onNavigateToSettings: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToWallet,
  onNavigateToSettings,
}) => {
  const { t } = useTranslation();

  const menuItems = [
    {
      key: 'wallet',
      title: t('dashboard.wallet'),
      icon: '💼',
      color: KurdistanColors.kesk,
      onPress: onNavigateToWallet,
    },
    {
      key: 'staking',
      title: t('dashboard.staking'),
      icon: '🔒',
      color: KurdistanColors.zer,
      onPress: () => console.log('Navigate to Staking'),
    },
    {
      key: 'governance',
      title: t('dashboard.governance'),
      icon: '🗳️',
      color: KurdistanColors.sor,
      onPress: () => console.log('Navigate to Governance'),
    },
    {
      key: 'dex',
      title: t('dashboard.dex'),
      icon: '💱',
      color: '#2196F3',
      onPress: () => console.log('Navigate to DEX'),
    },
    {
      key: 'history',
      title: t('dashboard.history'),
      icon: '📜',
      color: '#9C27B0',
      onPress: () => console.log('Navigate to History'),
    },
    {
      key: 'settings',
      title: t('dashboard.settings'),
      icon: '⚙️',
      color: '#607D8B',
      onPress: onNavigateToSettings,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[KurdistanColors.kesk, KurdistanColors.zer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome!</Text>
              <Text style={styles.headerTitle}>{t('dashboard.title')}</Text>
            </View>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>PZK</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('dashboard.balance')}</Text>
          <Text style={styles.balanceAmount}>0.00 HEZ</Text>
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('dashboard.totalStaked')}</Text>
              <Text style={styles.statValue}>0.00</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('dashboard.rewards')}</Text>
              <Text style={styles.statValue}>0.00</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.menuIconContainer, { backgroundColor: item.color }]}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Proposals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.activeProposals')}</Text>
          <View style={styles.proposalsCard}>
            <Text style={styles.proposalsCount}>0</Text>
            <Text style={styles.proposalsLabel}>Active Proposals</Text>
            <TouchableOpacity style={styles.proposalsButton}>
              <Text style={styles.proposalsButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: KurdistanColors.spi,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: KurdistanColors.spi,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: KurdistanColors.spi,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
  },
  balanceCard: {
    backgroundColor: KurdistanColors.spi,
    margin: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: KurdistanColors.reş,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KurdistanColors.reş,
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '47%',
    backgroundColor: KurdistanColors.spi,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  menuIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 28,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.reş,
    textAlign: 'center',
  },
  proposalsCard: {
    backgroundColor: KurdistanColors.spi,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  proposalsCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: KurdistanColors.kesk,
    marginBottom: 8,
  },
  proposalsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  proposalsButton: {
    backgroundColor: KurdistanColors.kesk,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  proposalsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.spi,
  },
});

export default DashboardScreen;
