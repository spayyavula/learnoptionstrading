/*
  # Educational and Community Features

  Tables for learning modules, user progress, achievements, community posts, and strategy ratings.

  ## New Tables

  1. **learning_modules** - Educational content structure
  2. **user_learning_progress** - Tracks user progress through modules
  3. **user_achievements** - Badges and milestones
  4. **community_posts** - User-generated content
  5. **community_comments** - Discussion threads
  6. **strategy_ratings** - User ratings for shared strategies
  7. **community_reactions** - Likes, upvotes for posts
*/

-- Create learning_modules table
CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_minutes integer DEFAULT 10,
  module_order integer DEFAULT 0,
  category text NOT NULL,
  prerequisites text[],
  learning_objectives text[],
  is_published boolean DEFAULT false,
  cover_image_url text,
  video_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_learning_progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'bookmarked')),
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  time_spent_minutes integer DEFAULT 0,
  quiz_score integer,
  quiz_attempts integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text,
  achievement_tier text CHECK (achievement_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  icon_url text,
  earned_at timestamptz DEFAULT now(),
  progress_current integer DEFAULT 0,
  progress_required integer DEFAULT 1,
  is_unlocked boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  post_type text DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'strategy', 'analysis', 'question', 'guide')),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  tags text[] DEFAULT ARRAY[]::text[],
  related_symbols text[],
  related_strategy_id uuid,
  is_published boolean DEFAULT true,
  is_pinned boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  upvote_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  attachments jsonb DEFAULT '[]'::jsonb,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  parent_comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvote_count integer DEFAULT 0,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create strategy_ratings table
CREATE TABLE IF NOT EXISTS strategy_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid REFERENCES saved_strategies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  would_recommend boolean DEFAULT true,
  difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  profitability_rating integer CHECK (profitability_rating >= 1 AND profitability_rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(strategy_id, user_id)
);

-- Create community_reactions table
CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'strategy')),
  target_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('upvote', 'downvote', 'like', 'helpful', 'insightful')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id, reaction_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_modules_category ON learning_modules(category);
CREATE INDEX IF NOT EXISTS idx_learning_modules_published ON learning_modules(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_module ON user_learning_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON user_achievements(achievement_key);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_ratings_strategy ON strategy_ratings(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_ratings_user ON strategy_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON community_reactions(target_type, target_id);

-- Enable Row Level Security
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read access to published modules"
  ON learning_modules FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Users can view own progress"
  ON user_learning_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_learning_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_learning_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public read access to community posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Users can insert own posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access to comments"
  ON community_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view strategy ratings"
  ON strategy_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own ratings"
  ON strategy_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own reactions"
  ON community_reactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_learning_modules_updated_at
  BEFORE UPDATE ON learning_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_progress_updated_at
  BEFORE UPDATE ON user_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_ratings_updated_at
  BEFORE UPDATE ON strategy_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
