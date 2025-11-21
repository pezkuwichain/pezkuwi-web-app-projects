import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { BottomTabParamList } from '../navigation/BottomTabNavigator';
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
  const navigation = useNavigation<NavigationProp<BottomTabParamList>>();

  const showComingSoon = (featureName: string) => {
    Alert.alert(
      'Coming Soon',
      `${featureName} feature is under development and will be available soon!`,
      [{ text: 'OK' }]
    );
  };

  const quickActions = [
    {
      key: 'education',
      title: 'Education',
      image: require('../../../shared/images/quick-actions/qa_education.png'),
      available: true,
      onPress: () => navigation.navigate('Education'),
    },
    {
      key: 'exchange',
      title: 'Exchange',
      image: require('../../../shared/images/quick-actions/qa_exchange.png'),
      available: true,
      onPress: () => navigation.navigate('Swap'),
    },
    {
      key: 'forum',
      title: 'Forum',
      image: require('../../../shared/images/quick-actions/qa_forum.jpg'),
      available: true,
      onPress: () => navigation.navigate('Forum'),
    },
    {
      key: 'governance',
      title: 'Governance',
      image: require('../../../shared/images/quick-actions/qa_governance.jpg'),
      available: true,
      onPress: () => navigation.navigate('Home'), // TODO: Navigate to Governance screen
    },
    {
      key: 'trading',
      title: 'Trading',
      image: require('../../../shared/images/quick-actions/qa_trading.jpg'),
      available: true,
      onPress: () => navigation.navigate('P2P'),
    },
    {
      key: 'b2b',
      title: 'B2B Trading',
      image: require('../../../shared/images/quick-actions/qa_b2b.png'),
      available: false,
      onPress: () => showComingSoon('B2B Trading'),
    },
    {
      key: 'bank',
      title: 'Banking',
      image: require('../../../shared/images/quick-actions/qa_bank.png'),
      available: false,
      onPress: () => showComingSoon('Banking'),
    },
    {
      key: 'games',
      title: 'Games',
      image: require('../../../shared/images/quick-actions/qa_games.png'),
      available: false,
      onPress: () => showComingSoon('Games'),
    },
    {
      key: 'kurdmedia',
      title: 'Kurd Media',
      image: require('../../../shared/images/quick-actions/qa_kurdmedia.jpg'),
      available: false,
      onPress: () => showComingSoon('Kurd Media'),
    },
    {
      key: 'university',
      title: 'University',
      image: require('../../../shared/images/quick-actions/qa_university.png'),
      available: false,
      onPress: () => showComingSoon('University'),
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
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.quickActionItem,
                  !action.available && styles.quickActionDisabled
                ]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionImageContainer}>
                  <Image
                    source={action.image}
                    style={styles.quickActionImage}
                    resizeMode="cover"
                  />
                  {!action.available && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickActionTitle} numberOfLines={2}>
                  {action.title}
                </Text>
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '30%',
    marginBottom: 16,
    alignItems: 'center',
  },
  quickActionDisabled: {
    opacity: 0.6,
  },
  quickActionImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  quickActionImage: {
    width: '100%',
    height: '100%',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: KurdistanColors.zer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    color: KurdistanColors.reş,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: KurdistanColors.reş,
    textAlign: 'center',
    lineHeight: 16,
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
