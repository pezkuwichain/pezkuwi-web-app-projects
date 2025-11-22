import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { usePolkadot } from '../contexts/PolkadotContext';
import { AppColors, KurdistanColors } from '../theme/colors';
import {
  Card,
  Button,
  BottomSheet,
  Badge,
  CardSkeleton,
} from '../components';
import { fetchUserTikis, getTikiDisplayName, getTikiEmoji } from '@pezkuwi/lib/tiki';

const { width } = Dimensions.get('window');
const NFT_SIZE = (width - 48) / 2; // 2 columns with padding

interface NFT {
  id: string;
  type: 'citizenship' | 'tiki' | 'achievement';
  name: string;
  description: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  mintDate: string;
  attributes: { trait: string; value: string }[];
}

/**
 * NFT Gallery Screen
 * Display Citizenship NFTs, Tiki Badges, Achievement NFTs
 * Inspired by OpenSea, Rarible, and modern NFT galleries
 */
export default function NFTGalleryScreen() {
  const { api, selectedAccount, isApiReady } = usePolkadot();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'citizenship' | 'tiki' | 'achievement'>('all');

  const fetchNFTs = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!api || !selectedAccount) return;

      const nftList: NFT[] = [];

      // 1. Check Citizenship NFT
      const citizenNft = await api.query.tiki?.citizenNft?.(selectedAccount.address);

      if (citizenNft && !citizenNft.isEmpty) {
        const nftData = citizenNft.toJSON() as Record<string, unknown>;

        nftList.push({
          id: 'citizenship-001',
          type: 'citizenship',
          name: 'Digital Kurdistan Citizenship',
          description: 'Official citizenship NFT of Digital Kurdistan. This NFT represents your verified status as a citizen of the Pezkuwi nation.',
          image: '🪪', // Will use emoji/icon for now
          rarity: 'legendary',
          mintDate: new Date(nftData?.mintedAt || Date.now()).toISOString(),
          attributes: [
            { trait: 'Type', value: 'Citizenship' },
            { trait: 'Nation', value: 'Kurdistan' },
            { trait: 'Status', value: 'Verified' },
            { trait: 'Rights', value: 'Full Voting Rights' },
          ],
        });
      }

      // 2. Fetch Tiki Role Badges
      const tikis = await fetchUserTikis(api, selectedAccount.address);

      tikis.forEach((tiki, index) => {
        nftList.push({
          id: `tiki-${index}`,
          type: 'tiki',
          name: getTikiDisplayName(tiki),
          description: `You hold the role of ${getTikiDisplayName(tiki)} in Digital Kurdistan. This badge represents your responsibilities and privileges.`,
          image: getTikiEmoji(tiki),
          rarity: getRarityByTiki(tiki),
          mintDate: new Date().toISOString(),
          attributes: [
            { trait: 'Type', value: 'Tiki Role' },
            { trait: 'Role', value: getTikiDisplayName(tiki) },
            { trait: 'Native Name', value: tiki },
          ],
        });
      });

      // 3. Achievement NFTs (placeholder for future)
      // Query actual achievement NFTs when implemented

      setNfts(nftList);
    } catch (error) {
      if (__DEV__) console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, selectedAccount]);

  useEffect(() => {
    if (isApiReady && selectedAccount) {
      fetchNFTs();
    }
  }, [isApiReady, selectedAccount, fetchNFTs]);

  const getRarityByTiki = (tiki: string): NFT['rarity'] => {
    const highRank = ['Serok', 'SerokiMeclise', 'SerokWeziran', 'Axa'];
    const mediumRank = ['Wezir', 'Parlementer', 'EndameDiwane'];

    if (highRank.includes(tiki)) return 'legendary';
    if (mediumRank.includes(tiki)) return 'epic';
    return 'rare';
  };

  const filteredNFTs = filter === 'all'
    ? nfts
    : nfts.filter(nft => nft.type === filter);

  const getRarityColor = (rarity: NFT['rarity']) => {
    switch (rarity) {
      case 'legendary': return KurdistanColors.zer;
      case 'epic': return '#A855F7';
      case 'rare': return '#3B82F6';
      default: return AppColors.textSecondary;
    }
  };

  if (loading && nfts.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NFT Gallery</Text>
        <Text style={styles.headerSubtitle}>
          {nfts.length} {nfts.length === 1 ? 'NFT' : 'NFTs'} collected
        </Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <FilterButton
          label="All"
          count={nfts.length}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterButton
          label="Citizenship"
          count={nfts.filter(n => n.type === 'citizenship').length}
          active={filter === 'citizenship'}
          onPress={() => setFilter('citizenship')}
        />
        <FilterButton
          label="Tiki Roles"
          count={nfts.filter(n => n.type === 'tiki').length}
          active={filter === 'tiki'}
          onPress={() => setFilter('tiki')}
        />
        <FilterButton
          label="Achievements"
          count={nfts.filter(n => n.type === 'achievement').length}
          active={filter === 'achievement'}
          onPress={() => setFilter('achievement')}
        />
      </ScrollView>

      {/* NFT Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNFTs();
            }}
          />
        }
      >
        {filteredNFTs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No NFTs yet</Text>
            <Text style={styles.emptySubtext}>
              Complete citizenship application to earn your first NFT
            </Text>
          </Card>
        ) : (
          <View style={styles.grid}>
            {filteredNFTs.map((nft) => (
              <Pressable
                key={nft.id}
                onPress={() => {
                  setSelectedNFT(nft);
                  setDetailsVisible(true);
                }}
                style={({ pressed }) => [
                  styles.nftCard,
                  pressed && styles.nftCardPressed,
                ]}
              >
                {/* NFT Image/Icon */}
                <View style={[
                  styles.nftImage,
                  { borderColor: getRarityColor(nft.rarity) }
                ]}>
                  <Text style={styles.nftEmoji}>{nft.image}</Text>
                  <View style={[
                    styles.rarityBadge,
                    { backgroundColor: getRarityColor(nft.rarity) }
                  ]}>
                    <Text style={styles.rarityText}>
                      {nft.rarity.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* NFT Info */}
                <View style={styles.nftInfo}>
                  <Text style={styles.nftName} numberOfLines={2}>
                    {nft.name}
                  </Text>
                  <Badge
                    label={nft.type}
                    variant={nft.type === 'citizenship' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* NFT Details Bottom Sheet */}
      <BottomSheet
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        title="NFT Details"
        height={600}
      >
        {selectedNFT && (
          <ScrollView>
            {/* Large NFT Display */}
            <View style={[
              styles.detailImage,
              { borderColor: getRarityColor(selectedNFT.rarity) }
            ]}>
              <Text style={styles.detailEmoji}>{selectedNFT.image}</Text>
            </View>

            {/* NFT Title & Rarity */}
            <View style={styles.detailHeader}>
              <Text style={styles.detailName}>{selectedNFT.name}</Text>
              <Badge
                label={selectedNFT.rarity}
                variant={selectedNFT.rarity === 'legendary' ? 'warning' : 'info'}
              />
            </View>

            {/* Description */}
            <Text style={styles.detailDescription}>
              {selectedNFT.description}
            </Text>

            {/* Attributes */}
            <Text style={styles.attributesTitle}>Attributes</Text>
            <View style={styles.attributes}>
              {selectedNFT.attributes.map((attr, index) => (
                <View key={index} style={styles.attribute}>
                  <Text style={styles.attributeTrait}>{attr.trait}</Text>
                  <Text style={styles.attributeValue}>{attr.value}</Text>
                </View>
              ))}
            </View>

            {/* Mint Date */}
            <View style={styles.mintInfo}>
              <Text style={styles.mintLabel}>Minted</Text>
              <Text style={styles.mintDate}>
                {new Date(selectedNFT.mintDate).toLocaleDateString()}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.detailActions}>
              <Button
                title="View on Explorer"
                variant="outline"
                fullWidth
                onPress={() => {
                  // Open blockchain explorer
                }}
              />
            </View>
          </ScrollView>
        )}
      </BottomSheet>
    </View>
  );
}

const FilterButton: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}> = ({ label, count, active, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.filterButton,
      active && styles.filterButtonActive,
    ]}
  >
    <Text style={[
      styles.filterButtonText,
      active && styles.filterButtonTextActive,
    ]}>
      {label}
    </Text>
    <Badge
      label={count.toString()}
      variant={active ? 'primary' : 'secondary'}
      size="small"
    />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: AppColors.surface,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  filterScroll: {
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.background,
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: `${KurdistanColors.kesk}15`,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  filterButtonTextActive: {
    color: KurdistanColors.kesk,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nftCard: {
    width: NFT_SIZE,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nftCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  nftImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    position: 'relative',
  },
  nftEmoji: {
    fontSize: 64,
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nftInfo: {
    padding: 12,
    gap: 8,
  },
  nftName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    lineHeight: 18,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: AppColors.background,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 24,
  },
  detailEmoji: {
    fontSize: 120,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailName: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
    lineHeight: 30,
  },
  detailDescription: {
    fontSize: 16,
    color: AppColors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  attributesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
  },
  attributes: {
    gap: 12,
    marginBottom: 24,
  },
  attribute: {
    backgroundColor: AppColors.background,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributeTrait: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  attributeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  mintInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 24,
  },
  mintLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  mintDate: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  detailActions: {
    gap: 12,
    marginBottom: 20,
  },
});
