import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Badge } from '../components';
import { KurdistanColors, AppColors } from '../theme/colors';
import { supabase } from '../lib/supabase';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  replies_count: number;
  views_count: number;
  created_at: string;
  last_activity: string;
  is_pinned: boolean;
  is_locked: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threads_count: number;
  icon: string;
}

const CATEGORIES: ForumCategory[] = [
  {
    id: '1',
    name: 'General Discussion',
    description: 'General topics about PezkuwiChain',
    threads_count: 42,
    icon: '💬',
  },
  {
    id: '2',
    name: 'Governance',
    description: 'Discuss proposals and governance',
    threads_count: 28,
    icon: '🏛️',
  },
  {
    id: '3',
    name: 'Technical',
    description: 'Development and technical discussions',
    threads_count: 35,
    icon: '⚙️',
  },
  {
    id: '4',
    name: 'Trading',
    description: 'Market discussions and trading',
    threads_count: 18,
    icon: '📈',
  },
];

// Mock data - will be replaced with Supabase
const MOCK_THREADS: ForumThread[] = [
  {
    id: '1',
    title: 'Welcome to PezkuwiChain Forum!',
    content: 'Introduce yourself and join the community...',
    author: '5GrwV...xQjz',
    category: 'General Discussion',
    replies_count: 24,
    views_count: 156,
    created_at: '2024-01-15T10:00:00Z',
    last_activity: '2024-01-20T14:30:00Z',
    is_pinned: true,
    is_locked: false,
  },
  {
    id: '2',
    title: 'New Governance Proposal: Treasury Allocation',
    content: 'Discussion about treasury fund allocation...',
    author: '5HpG8...kLm2',
    category: 'Governance',
    replies_count: 45,
    views_count: 289,
    created_at: '2024-01-18T09:15:00Z',
    last_activity: '2024-01-20T16:45:00Z',
    is_pinned: false,
    is_locked: false,
  },
  {
    id: '3',
    title: 'How to stake PEZ tokens?',
    content: 'Guide for staking PEZ tokens...',
    author: '5FHne...pQr8',
    category: 'General Discussion',
    replies_count: 12,
    views_count: 98,
    created_at: '2024-01-19T11:20:00Z',
    last_activity: '2024-01-20T13:10:00Z',
    is_pinned: false,
    is_locked: false,
  },
];

type ViewType = 'categories' | 'threads';

const ForumScreen: React.FC = () => {
  const { t: _t } = useTranslation();

  const [viewType, setViewType] = useState<ViewType>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>(MOCK_THREADS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = async (categoryId?: string) => {
    setLoading(true);
    try {
      // Fetch from Supabase
      let query = supabase
        .from('forum_threads')
        .select(`
          *,
          forum_categories(name)
        `)
        .order('is_pinned', { ascending: false })
        .order('last_activity', { ascending: false });

      // Filter by category if provided
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        if (__DEV__) console.error('Supabase fetch error:', error);
        // Fallback to mock data on error
        setThreads(MOCK_THREADS);
        return;
      }

      if (data && data.length > 0) {
        // Transform Supabase data to match ForumThread interface
        const transformedThreads: ForumThread[] = data.map((thread: Record<string, unknown>) => ({
          id: String(thread.id),
          title: String(thread.title),
          content: String(thread.content),
          author: String(thread.author_id),
          category: (thread.forum_categories as { name?: string })?.name || 'Unknown',
          replies_count: Number(thread.replies_count) || 0,
          views_count: Number(thread.views_count) || 0,
          created_at: String(thread.created_at),
          last_activity: String(thread.last_activity || thread.created_at),
          is_pinned: Boolean(thread.is_pinned),
          is_locked: Boolean(thread.is_locked),
        }));
        setThreads(transformedThreads);
      } else {
        // No data, use mock data
        setThreads(MOCK_THREADS);
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch threads:', error);
      // Fallback to mock data on error
      setThreads(MOCK_THREADS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchThreads(selectedCategory || undefined);
  };

  const handleCategoryPress = (categoryId: string, _categoryName: string) => {
    setSelectedCategory(categoryId);
    setViewType('threads');
    fetchThreads(categoryId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderCategoryCard = ({ item }: { item: ForumCategory }) => (
    <TouchableOpacity onPress={() => handleCategoryPress(item.id, item.name)}>
      <Card style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIcon}>
            <Text style={styles.categoryIconText}>{item.icon}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>
        <View style={styles.categoryFooter}>
          <Text style={styles.categoryStats}>
            {item.threads_count} threads
          </Text>
          <Text style={styles.categoryArrow}>→</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderThreadCard = ({ item }: { item: ForumThread }) => (
    <TouchableOpacity>
      <Card style={styles.threadCard}>
        {/* Thread Header */}
        <View style={styles.threadHeader}>
          {item.is_pinned && (
            <View style={styles.pinnedBadge}>
              <Text style={styles.pinnedIcon}>📌</Text>
            </View>
          )}
          <Text style={styles.threadTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.is_locked && (
            <Text style={styles.lockedIcon}>🔒</Text>
          )}
        </View>

        {/* Thread Meta */}
        <View style={styles.threadMeta}>
          <Text style={styles.threadAuthor}>by {item.author}</Text>
          <Badge text={item.category} variant="outline" />
        </View>

        {/* Thread Stats */}
        <View style={styles.threadStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💬</Text>
            <Text style={styles.statText}>{item.replies_count}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👁️</Text>
            <Text style={styles.statText}>{item.views_count}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🕐</Text>
            <Text style={styles.statText}>
              {formatTimeAgo(item.last_activity)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>No Threads Yet</Text>
      <Text style={styles.emptyText}>
        Be the first to start a discussion in this category
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {viewType === 'categories' ? 'Forum' : 'Threads'}
          </Text>
          <Text style={styles.subtitle}>
            {viewType === 'categories'
              ? 'Join the community discussion'
              : selectedCategory || 'All threads'}
          </Text>
        </View>
        {viewType === 'threads' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setViewType('categories')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KurdistanColors.kesk} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : viewType === 'categories' ? (
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={KurdistanColors.kesk}
            />
          }
        />
      ) : (
        <FlatList
          data={threads}
          renderItem={renderThreadCard}
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

      {/* Create Thread FAB */}
      {viewType === 'threads' && (
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabIcon}>✏️</Text>
        </TouchableOpacity>
      )}
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
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: KurdistanColors.kesk,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  categoryCard: {
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F9F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  categoryStats: {
    fontSize: 14,
    color: '#666',
  },
  categoryArrow: {
    fontSize: 20,
    color: KurdistanColors.kesk,
  },
  threadCard: {
    padding: 16,
    marginBottom: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pinnedBadge: {
    marginRight: 8,
  },
  pinnedIcon: {
    fontSize: 16,
  },
  threadTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    lineHeight: 22,
  },
  lockedIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  threadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  threadAuthor: {
    fontSize: 12,
    color: '#666',
  },
  threadStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    color: '#666',
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
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: KurdistanColors.kesk,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
});

export default ForumScreen;
