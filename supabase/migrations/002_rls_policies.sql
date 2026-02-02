-- Row Level Security Policies
-- Migration: 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_connections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- GROUPS POLICIES
-- ============================================

-- Users can view their own groups
CREATE POLICY "Users can view own groups"
    ON public.groups FOR SELECT
    USING (owner_id = auth.uid());

-- Users can create groups
CREATE POLICY "Users can create groups"
    ON public.groups FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Users can update/delete own groups
CREATE POLICY "Users can manage own groups"
    ON public.groups FOR ALL
    USING (owner_id = auth.uid());

-- ============================================
-- GROUP MEMBERS POLICIES
-- ============================================

-- Members can view groups they're in
CREATE POLICY "View group membership"
    ON public.group_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        group_id IN (SELECT id FROM public.groups WHERE owner_id = auth.uid())
    );

-- Group owners can manage members
CREATE POLICY "Group owners manage members"
    ON public.group_members FOR ALL
    USING (
        group_id IN (SELECT id FROM public.groups WHERE owner_id = auth.uid())
    );

-- ============================================
-- FOLLOWERS POLICIES
-- ============================================

-- Anyone can view follower relationships
CREATE POLICY "Followers are public"
    ON public.followers FOR SELECT
    USING (true);

-- Users can follow/unfollow
CREATE POLICY "Users can follow"
    ON public.followers FOR INSERT
    WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
    ON public.followers FOR DELETE
    USING (follower_id = auth.uid());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Public products visible to all
CREATE POLICY "Public products are viewable"
    ON public.products FOR SELECT
    USING (
        visibility = 'public' OR
        user_id = auth.uid() OR
        (visibility = 'group' AND group_id IN (
            SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
        ))
    );

-- Users can CRUD their own products
CREATE POLICY "Users manage own products"
    ON public.products FOR ALL
    USING (user_id = auth.uid());

-- ============================================
-- LIKES POLICIES
-- ============================================

-- Anyone can view likes
CREATE POLICY "Likes are public"
    ON public.likes FOR SELECT
    USING (true);

-- Users can like/unlike
CREATE POLICY "Users can like"
    ON public.likes FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike"
    ON public.likes FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- COMMENTS POLICIES
-- ============================================

-- Comments visible on visible products
CREATE POLICY "Comments are public"
    ON public.comments FOR SELECT
    USING (true);

-- Users can add comments
CREATE POLICY "Users can comment"
    ON public.comments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- STAGING ORDERS POLICIES
-- ============================================

-- Users can only see their own staging orders
CREATE POLICY "Users view own staging orders"
    ON public.staging_orders FOR SELECT
    USING (user_id = auth.uid());

-- Users can update/delete their own staging orders
CREATE POLICY "Users manage own staging orders"
    ON public.staging_orders FOR ALL
    USING (user_id = auth.uid());

-- Service role can insert (for webhooks)
CREATE POLICY "Service can insert staging orders"
    ON public.staging_orders FOR INSERT
    WITH CHECK (true); -- Webhooks use service role

-- ============================================
-- SHOP CONNECTIONS POLICIES
-- ============================================

-- Users can view their own connections
CREATE POLICY "Users view own shop connections"
    ON public.shop_connections FOR SELECT
    USING (user_id = auth.uid());

-- Users can manage their own connections
CREATE POLICY "Users manage own shop connections"
    ON public.shop_connections FOR ALL
    USING (user_id = auth.uid());
