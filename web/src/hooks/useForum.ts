import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  priority: number;
  created_at: string;
  expires_at?: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  discussion_count?: number;
}

export interface ForumDiscussion {
  id: string;
  category_id: string;
  category?: ForumCategory;
  proposal_id?: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_address?: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  upvotes?: number;
  downvotes?: number;
}

export interface ForumReply {
  id: string;
  discussion_id: string;
  parent_reply_id?: string;
  content: string;
  author_id: string;
  author_name: string;
  author_address?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  upvotes?: number;
  downvotes?: number;
}

export function useForum() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [discussions, setDiscussions] = useState<ForumDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForumData();

    // Subscribe to real-time updates
    const discussionsSubscription = supabase
      .channel('forum_discussions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'forum_discussions'
      }, () => {
        fetchDiscussions();
      })
      .subscribe();

    const announcementsSubscription = supabase
      .channel('admin_announcements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_announcements'
      }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      discussionsSubscription.unsubscribe();
      announcementsSubscription.unsubscribe();
    };
  }, []);

  const fetchForumData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnnouncements(),
      fetchCategories(),
      fetchDiscussions()
    ]);
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  };

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_discussions')
        .select(`
          *,
          category:forum_categories(*)
        `)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch reaction counts for each discussion
      const discussionsWithReactions = await Promise.all(
        (data || []).map(async (discussion) => {
          const { data: reactions } = await supabase
            .from('forum_reactions')
            .select('reaction_type')
            .eq('discussion_id', discussion.id);

          const upvotes = reactions?.filter(r => r.reaction_type === 'upvote').length || 0;
          const downvotes = reactions?.filter(r => r.reaction_type === 'downvote').length || 0;

          return {
            ...discussion,
            upvotes,
            downvotes
          };
        })
      );

      setDiscussions(discussionsWithReactions);
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch discussions');
    }
  };

  const createDiscussion = async (discussionData: {
    category_id: string;
    title: string;
    content: string;
    tags?: string[];
    proposal_id?: string;
  }) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('forum_discussions')
        .insert({
          ...discussionData,
          author_id: user.id,
          author_name: user.email || 'Anonymous'
        })
        .select()
        .single();

      if (error) throw error;
      await fetchDiscussions();
      return data;
    } catch (err) {
      console.error('Error creating discussion:', err);
      throw err;
    }
  };

  const reactToDiscussion = async (discussionId: string, reactionType: 'upvote' | 'downvote') => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Check if user already reacted
      const { data: existing } = await supabase
        .from('forum_reactions')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('forum_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction (remove opposite reaction first)
        const oppositeType = reactionType === 'upvote' ? 'downvote' : 'upvote';
        await supabase
          .from('forum_reactions')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id)
          .eq('reaction_type', oppositeType);

        await supabase
          .from('forum_reactions')
          .insert({
            discussion_id: discussionId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }

      await fetchDiscussions();
    } catch (err) {
      console.error('Error reacting to discussion:', err);
      throw err;
    }
  };

  return {
    announcements,
    categories,
    discussions,
    loading,
    error,
    createDiscussion,
    reactToDiscussion,
    refreshData: fetchForumData
  };
}
