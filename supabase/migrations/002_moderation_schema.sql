-- ShopFollow Content Moderation Schema
-- Migration: 002_moderation_schema.sql

-- ============================================
-- MODERATION FLAGS (User Reports)
-- ============================================
CREATE TYPE report_reason AS ENUM (
    'spam',
    'inappropriate',
    'harassment',
    'nsfw',
    'scam',
    'impersonation',
    'other'
);

CREATE TYPE report_status AS ENUM (
    'pending',
    'reviewed',
    'actioned',
    'dismissed'
);

CREATE TABLE public.moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- What is being reported (either a product, comment, or user)
    reported_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    reported_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    description TEXT,
    status report_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one target is specified
    CONSTRAINT report_has_target CHECK (
        reported_product_id IS NOT NULL OR 
        reported_comment_id IS NOT NULL OR 
        reported_user_id IS NOT NULL
    )
);

-- ============================================
-- BLOCKED USERS
-- ============================================
CREATE TABLE public.blocked_users (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    
    -- Prevent self-blocking
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- ============================================
-- COMMENT MODERATION (AI Scores)
-- ============================================
CREATE TABLE public.comment_moderation (
    comment_id UUID PRIMARY KEY REFERENCES public.comments(id) ON DELETE CASCADE,
    toxicity_score DECIMAL(5,4) DEFAULT 0, -- 0.0000 to 1.0000
    spam_score DECIMAL(5,4) DEFAULT 0,
    profanity_detected BOOLEAN DEFAULT FALSE,
    auto_hidden BOOLEAN DEFAULT FALSE,
    manual_review_required BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RATE LIMITS TRACKING
-- ============================================
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'comment', 'product', 'follow', 'report'
    window_start TIMESTAMPTZ NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(user_id, action_type, window_start)
);

-- ============================================
-- ADMIN ACTIONS LOG (Audit Trail)
-- ============================================
CREATE TYPE admin_action_type AS ENUM (
    'warning_issued',
    'content_removed',
    'user_suspended',
    'user_banned',
    'content_restored',
    'user_reinstated'
);

CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    target_user_id UUID REFERENCES public.profiles(id),
    target_product_id UUID REFERENCES public.products(id),
    target_comment_id UUID REFERENCES public.comments(id),
    action_type admin_action_type NOT NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Products: Add moderation columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- Comments: Add moderation columns
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Profiles: Add safety/privacy columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_moderation_flags_status ON public.moderation_flags(status);
CREATE INDEX idx_moderation_flags_reporter ON public.moderation_flags(reporter_id);
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);
CREATE INDEX idx_rate_limits_user_action ON public.rate_limits(user_id, action_type);
CREATE INDEX idx_comment_moderation_hidden ON public.comment_moderation(auto_hidden);
CREATE INDEX idx_products_moderation ON public.products(moderation_status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Moderation Flags: Users can create reports, only see their own
CREATE POLICY "Users can create reports"
    ON public.moderation_flags FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
    ON public.moderation_flags FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
    ON public.moderation_flags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ));

-- Blocked Users: Users can manage their own blocks
CREATE POLICY "Users can manage their blocks"
    ON public.blocked_users FOR ALL
    USING (auth.uid() = blocker_id);

-- Rate Limits: Users can only see their own
CREATE POLICY "Users can view their rate limits"
    ON public.rate_limits FOR SELECT
    USING (auth.uid() = user_id);

-- Admin Actions: Only admins can view/create
CREATE POLICY "Only admins can manage admin actions"
    ON public.admin_actions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(
    p_viewer_id UUID,
    p_target_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE (blocker_id = p_viewer_id AND blocked_id = p_target_id)
           OR (blocker_id = p_target_id AND blocked_id = p_viewer_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check rate limit (returns true if within limit)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID,
    p_action_type TEXT,
    p_max_count INTEGER,
    p_window_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_current_count INTEGER;
BEGIN
    -- Calculate window start (truncate to minute for easier grouping)
    v_window_start := DATE_TRUNC('minute', NOW() - (p_window_minutes || ' minutes')::INTERVAL);
    
    -- Count actions in window
    SELECT COALESCE(SUM(count), 0) INTO v_current_count
    FROM public.rate_limits
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND window_start >= v_window_start;
    
    RETURN v_current_count < p_max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment rate limit counter
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
    p_user_id UUID,
    p_action_type TEXT
) RETURNS VOID AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := DATE_TRUNC('minute', NOW());
    
    INSERT INTO public.rate_limits (user_id, action_type, window_start, count)
    VALUES (p_user_id, p_action_type, v_window_start, 1)
    ON CONFLICT (user_id, action_type, window_start)
    DO UPDATE SET count = rate_limits.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFANITY WORD LIST (Basic)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profanity_words (
    word TEXT PRIMARY KEY,
    severity INTEGER DEFAULT 1, -- 1=mild, 2=moderate, 3=severe
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some basic words (extend as needed)
INSERT INTO public.profanity_words (word, severity) VALUES
    ('spam', 1),
    ('scam', 2),
    ('fake', 1)
ON CONFLICT (word) DO NOTHING;

-- Function to check text for profanity
CREATE OR REPLACE FUNCTION public.contains_profanity(
    p_text TEXT,
    p_min_severity INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profanity_words
        WHERE severity >= p_min_severity
          AND LOWER(p_text) LIKE '%' || word || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
