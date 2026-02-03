-- ============================================
-- MIGRATION: Add missing features
-- ============================================

-- Add moderation columns to comments
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'rejected')),
ADD COLUMN IF NOT EXISTS toxicity_score DECIMAL(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false;

-- Add more columns to products for full feature support
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT '€',
ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'rejected'));

-- Add bio and verification to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"likes": true, "comments": true, "followers": true, "orders": true}'::jsonb;

-- Add more columns to staging_orders for richer data
ALTER TABLE public.staging_orders 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS product_description TEXT,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT '€',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT;

-- ============================================
-- SAVES TABLE (for saved/bookmarked products)
-- ============================================
CREATE TABLE IF NOT EXISTS public.saves (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, user_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'order', 'mention', 'system')),
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- FOLLOW REQUESTS (for private accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.follow_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(requester_id, target_id)
);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Saves policies
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view their own saves"
ON public.saves FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own saves"
ON public.saves FOR ALL USING (user_id = auth.uid());

-- Notifications policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own notifications"
ON public.notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Follow requests policies
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see follow requests sent to them"
ON public.follow_requests FOR SELECT
USING (target_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Users can create follow requests"
ON public.follow_requests FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Target users can respond to requests"
ON public.follow_requests FOR UPDATE
USING (target_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_preferences JSONB;
BEGIN
    -- Check user's notification preferences
    SELECT notification_preferences INTO v_preferences
    FROM public.profiles
    WHERE id = p_user_id;

    -- Check if this notification type is enabled
    IF v_preferences IS NULL OR (v_preferences->>p_type)::boolean != false THEN
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (p_user_id, p_type, p_title, p_body, p_data)
        RETURNING id INTO v_notification_id;
        
        RETURN v_notification_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Trigger to create notification on new follower
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_follower_name TEXT;
BEGIN
    SELECT display_name INTO v_follower_name
    FROM public.profiles WHERE id = NEW.follower_id;
    
    PERFORM public.create_notification(
        NEW.following_id,
        'follow',
        'New Follower',
        v_follower_name || ' started following you',
        jsonb_build_object('follower_id', NEW.follower_id)
    );
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_follow ON public.followers;
CREATE TRIGGER trigger_notify_on_follow
AFTER INSERT ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_follow();

-- Trigger to create notification on new like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_liker_name TEXT;
    v_product_owner UUID;
    v_product_name TEXT;
BEGIN
    SELECT user_id, name INTO v_product_owner, v_product_name
    FROM public.products WHERE id = NEW.product_id;
    
    -- Don't notify if liking own product
    IF v_product_owner = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    SELECT display_name INTO v_liker_name
    FROM public.profiles WHERE id = NEW.user_id;
    
    PERFORM public.create_notification(
        v_product_owner,
        'like',
        'New Like',
        v_liker_name || ' liked your post "' || LEFT(v_product_name, 30) || '"',
        jsonb_build_object('product_id', NEW.product_id, 'liker_id', NEW.user_id)
    );
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON public.likes;
CREATE TRIGGER trigger_notify_on_like
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_like();

-- Trigger to create notification on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_commenter_name TEXT;
    v_product_owner UUID;
    v_product_name TEXT;
BEGIN
    SELECT user_id, name INTO v_product_owner, v_product_name
    FROM public.products WHERE id = NEW.product_id;
    
    -- Don't notify if commenting on own product
    IF v_product_owner = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    SELECT display_name INTO v_commenter_name
    FROM public.profiles WHERE id = NEW.user_id;
    
    PERFORM public.create_notification(
        v_product_owner,
        'comment',
        'New Comment',
        v_commenter_name || ' commented on "' || LEFT(v_product_name, 30) || '"',
        jsonb_build_object('product_id', NEW.product_id, 'comment_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON public.comments;
CREATE TRIGGER trigger_notify_on_comment
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();
