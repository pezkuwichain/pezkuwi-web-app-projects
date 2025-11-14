-- Forum Tables for Pezkuwi Governance

-- Admin Announcements Table
CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'critical'
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority shows first
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Categories
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Discussions
CREATE TABLE IF NOT EXISTS public.forum_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE SET NULL,
  proposal_id TEXT, -- Link to blockchain proposal if applicable
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_address TEXT, -- Blockchain address
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Replies
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES public.forum_discussions(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_address TEXT,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion Reactions (upvotes/downvotes)
CREATE TABLE IF NOT EXISTS public.forum_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES public.forum_discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 'upvote', 'downvote', 'helpful', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(discussion_id, user_id, reaction_type),
  UNIQUE(reply_id, user_id, reaction_type)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.admin_announcements(is_active, priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON public.forum_discussions(category_id);
CREATE INDEX IF NOT EXISTS idx_discussions_proposal ON public.forum_discussions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_discussions_pinned ON public.forum_discussions(is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_discussion ON public.forum_replies(discussion_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reactions_discussion ON public.forum_reactions(discussion_id);
CREATE INDEX IF NOT EXISTS idx_reactions_reply ON public.forum_reactions(reply_id);

-- RLS Policies

-- Admin Announcements
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON public.admin_announcements FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can manage announcements"
  ON public.admin_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- Forum Categories
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.forum_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.forum_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- Forum Discussions
ALTER TABLE public.forum_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discussions"
  ON public.forum_discussions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON public.forum_discussions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors and admins can update discussions"
  ON public.forum_discussions FOR UPDATE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors and admins can delete discussions"
  ON public.forum_discussions FOR DELETE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- Forum Replies
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view replies"
  ON public.forum_replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON public.forum_replies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors and admins can update replies"
  ON public.forum_replies FOR UPDATE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors and admins can delete replies"
  ON public.forum_replies FOR DELETE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- Forum Reactions
ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON public.forum_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage own reactions"
  ON public.forum_reactions FOR ALL
  USING (user_id = auth.uid());

-- Insert Default Categories
INSERT INTO public.forum_categories (name, description, icon, color, display_order) VALUES
  ('Treasury', 'Discussions about treasury proposals and funding', '💰', '#10B981', 1),
  ('Technical', 'Technical discussions and protocol upgrades', '⚙️', '#3B82F6', 2),
  ('Governance', 'Governance proposals and voting discussions', '🗳️', '#8B5CF6', 3),
  ('Community', 'Community initiatives and general discussions', '👥', '#F59E0B', 4),
  ('Support', 'Help and support for using Pezkuwi', '❓', '#6B7280', 5)
ON CONFLICT (name) DO NOTHING;

-- Function to update last_activity
CREATE OR REPLACE FUNCTION update_discussion_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_discussions
  SET
    last_activity_at = NOW(),
    replies_count = replies_count + 1
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reply_created
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_activity();
