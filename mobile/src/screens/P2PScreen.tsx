import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge } from '../components';
import { KurdistanColors, AppColors } from '../theme/colors';
import { usePolkadot } from '../contexts/PolkadotContext';

// Import from shared library
import {
  getActiveOffers,
  type P2PFiatOffer,
  type P2PReputation,
} from '../../../shared/lib/p2p-fiat';

interface OfferWithReputation extends P2PFiatOffer {
  seller_reputation?: P2PReputation;
  payment_method_name?: string;
}

type TabType = 'buy' | 'sell' | 'my-offers';

const P2PScreen: React.FC = () => {
  const { t: _t } = useTranslation();
  const { selectedAccount } = usePolkadot();

  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [offers, setOffers] = useState<OfferWithReputation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithReputation | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');

  const fetchOffers = React.useCallback(async () => {
    setLoading(true);
    try {
      let offersData: P2PFiatOffer[] = [];

      if (activeTab === 'buy') {
        // Buy = looking for sell offers
        offersData = await getActiveOffers();
      } else if (activeTab === 'my-offers' && selectedAccount) {
        // TODO: Implement getUserOffers from shared library
        offersData = [];
      }

      // Enrich with reputation (simplified for now)
      const enrichedOffers: OfferWithReputation[] = offersData.map((offer) => ({
        ...offer,
      }));

      setOffers(enrichedOffers);
    } catch (error) {
      if (__DEV__) console.error('Fetch offers error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedAccount]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const getTrustLevelColor = (
    level: 'new' | 'basic' | 'intermediate' | 'advanced' | 'verified'
  ) => {
    const colors = {
      new: '#999',
      basic: KurdistanColors.zer,
      intermediate: '#2196F3',
      advanced: KurdistanColors.kesk,
      verified: '#9C27B0',
    };
    return colors[level];
  };

  const getTrustLevelLabel = (
    level: 'new' | 'basic' | 'intermediate' | 'advanced' | 'verified'
  ) => {
    const labels = {
      new: 'New',
      basic: 'Basic',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      verified: 'Verified',
    };
    return labels[level];
  };

  const renderOfferCard = ({ item }: { item: OfferWithReputation }) => (
    <Card style={styles.offerCard}>
      {/* Seller Info */}
      <View style={styles.sellerRow}>
        <View style={styles.sellerInfo}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>
              {item.seller_wallet.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.sellerDetails}>
            <Text style={styles.sellerName}>
              {item.seller_wallet.slice(0, 6)}...{item.seller_wallet.slice(-4)}
            </Text>
            {item.seller_reputation && (
              <View style={styles.reputationRow}>
                <Badge
                  text={getTrustLevelLabel(item.seller_reputation.trust_level)}
                  variant="success"
                  style={{
                    backgroundColor: getTrustLevelColor(
                      item.seller_reputation.trust_level
                    ),
                  }}
                />
                <Text style={styles.tradesCount}>
                  {item.seller_reputation.completed_trades} trades
                </Text>
              </View>
            )}
          </View>
        </View>

        {item.seller_reputation?.verified_merchant && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}
      </View>

      {/* Offer Details */}
      <View style={styles.offerDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>
            {item.amount_crypto} {item.token}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price</Text>
          <Text style={styles.detailValue}>
            {item.price_per_unit.toFixed(2)} {item.fiat_currency}/{item.token}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {item.fiat_amount.toFixed(2)} {item.fiat_currency}
          </Text>
        </View>

        {item.payment_method_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Badge text={item.payment_method_name} variant="outline" />
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Limits</Text>
          <Text style={styles.detailValue}>
            {item.min_order_amount || 0} - {item.max_order_amount || item.fiat_amount}{' '}
            {item.fiat_currency}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time Limit</Text>
          <Text style={styles.detailValue}>{item.time_limit_minutes} min</Text>
        </View>
      </View>

      {/* Action Button */}
      <Button
        variant="primary"
        onPress={() => {
          setSelectedOffer(item);
          setShowTradeModal(true);
        }}
        style={styles.tradeButton}
      >
        Buy {item.token}
      </Button>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No Offers Available</Text>
      <Text style={styles.emptyText}>
        {activeTab === 'my-offers'
          ? 'You haven\'t created any offers yet'
          : 'No active offers at the moment'}
      </Text>
      {activeTab === 'my-offers' && (
        <Button
          variant="primary"
          onPress={() => setShowCreateOffer(true)}
          style={styles.createButton}
        >
          Create Your First Offer
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>P2P Trading</Text>
          <Text style={styles.subtitle}>Buy and sell crypto with local currency</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateOffer(true)}
        >
          <Text style={styles.createButtonText}>+ Post Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buy' && styles.activeTab]}
          onPress={() => setActiveTab('buy')}
        >
          <Text style={[styles.tabText, activeTab === 'buy' && styles.activeTabText]}>
            Buy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sell' && styles.activeTab]}
          onPress={() => setActiveTab('sell')}
        >
          <Text
            style={[styles.tabText, activeTab === 'sell' && styles.activeTabText]}
          >
            Sell
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-offers' && styles.activeTab]}
          onPress={() => setActiveTab('my-offers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my-offers' && styles.activeTabText,
            ]}
          >
            My Offers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offer List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KurdistanColors.kesk} />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderOfferCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={KurdistanColors.kesk}
            />
          }
        />
      )}

      {/* Trade Modal */}
      <Modal
        visible={showTradeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Buy {selectedOffer?.token || 'Token'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTradeModal(false);
                  setTradeAmount('');
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedOffer && (
                <>
                  {/* Seller Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Trading with</Text>
                    <Text style={styles.modalAddress}>
                      {selectedOffer.seller_wallet.slice(0, 6)}...
                      {selectedOffer.seller_wallet.slice(-4)}
                    </Text>
                  </View>

                  {/* Price Info */}
                  <View style={[styles.modalSection, styles.priceSection]}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Price</Text>
                      <Text style={styles.priceValue}>
                        {selectedOffer.price_per_unit.toFixed(2)}{' '}
                        {selectedOffer.fiat_currency}
                      </Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Available</Text>
                      <Text style={styles.priceValue}>
                        {selectedOffer.remaining_amount} {selectedOffer.token}
                      </Text>
                    </View>
                  </View>

                  {/* Amount Input */}
                  <View style={styles.modalSection}>
                    <Text style={styles.inputLabel}>
                      Amount to Buy ({selectedOffer.token})
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      value={tradeAmount}
                      onChangeText={setTradeAmount}
                      placeholderTextColor="#999"
                    />
                    {selectedOffer.min_order_amount && (
                      <Text style={styles.inputHint}>
                        Min: {selectedOffer.min_order_amount} {selectedOffer.token}
                      </Text>
                    )}
                    {selectedOffer.max_order_amount && (
                      <Text style={styles.inputHint}>
                        Max: {selectedOffer.max_order_amount} {selectedOffer.token}
                      </Text>
                    )}
                  </View>

                  {/* Calculation */}
                  {parseFloat(tradeAmount) > 0 && (
                    <View style={[styles.modalSection, styles.calculationSection]}>
                      <Text style={styles.calculationLabel}>You will pay</Text>
                      <Text style={styles.calculationValue}>
                        {(parseFloat(tradeAmount) * selectedOffer.price_per_unit).toFixed(2)}{' '}
                        {selectedOffer.fiat_currency}
                      </Text>
                    </View>
                  )}

                  {/* Trade Button */}
                  <Button
                    variant="primary"
                    onPress={() => {
                      if (!selectedAccount) {
                        Alert.alert('Error', 'Please connect your wallet first');
                        return;
                      }
                      if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
                        Alert.alert('Error', 'Please enter a valid amount');
                        return;
                      }
                      // TODO: Implement blockchain trade initiation
                      Alert.alert(
                        'Coming Soon',
                        'P2P trading blockchain integration will be available soon. UI is ready!'
                      );
                      setShowTradeModal(false);
                      setTradeAmount('');
                    }}
                    style={styles.tradeModalButton}
                  >
                    Initiate Trade
                  </Button>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Offer Modal */}
      <Modal
        visible={showCreateOffer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateOffer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Offer</Text>
              <TouchableOpacity onPress={() => setShowCreateOffer(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.comingSoonContainer}>
                <Text style={styles.comingSoonIcon}>🚧</Text>
                <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                <Text style={styles.comingSoonText}>
                  Create P2P offer functionality will be available in the next update.
                  The blockchain integration is ready and waiting for final testing!
                </Text>
                <Button
                  variant="outline"
                  onPress={() => setShowCreateOffer(false)}
                  style={styles.comingSoonButton}
                >
                  Close
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  createButton: {
    backgroundColor: KurdistanColors.kesk,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: KurdistanColors.kesk,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: KurdistanColors.kesk,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  offerCard: {
    padding: 16,
    marginBottom: 16,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: KurdistanColors.kesk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sellerDetails: {
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tradesCount: {
    fontSize: 12,
    color: '#666',
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: KurdistanColors.kesk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  offerDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    color: KurdistanColors.kesk,
  },
  tradeButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  priceSection: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: KurdistanColors.kesk,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  calculationSection: {
    backgroundColor: 'rgba(0, 169, 79, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 169, 79, 0.3)',
  },
  calculationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calculationValue: {
    fontSize: 24,
    fontWeight: '700',
    color: KurdistanColors.kesk,
  },
  tradeModalButton: {
    marginTop: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  comingSoonButton: {
    minWidth: 120,
  },
});

export default P2PScreen;
