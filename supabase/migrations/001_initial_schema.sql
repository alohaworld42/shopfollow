-- CartConnect Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
-- Enable pgcrypto for gen_random_uuid() (enabled by default in Supabase)

-- ============================================
-- USERS / PROFILES
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUPS (for sharing visibility)
-- ============================================
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members (many-to-many)
CREATE TABLE public.group_members (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- ============================================
-- FOLLOWERS (many-to-many)
-- ============================================
CREATE TABLE public.followers (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Prevent self-following
ALTER TABLE public.followers 
ADD CONSTRAINT no_self_follow CHECK (follower_id != following_id);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TYPE visibility_type AS ENUM ('public', 'private', 'group');

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    store_name TEXT NOT NULL,
    store_url TEXT,
    visibility visibility_type DEFAULT 'public',
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LIKES (many-to-many)
-- ============================================
CREATE TABLE public.likes (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, user_id)
);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAGING ORDERS (Inbox)
-- ============================================
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.staging_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- 'shopify', 'woocommerce', 'manual', etc.
    source_order_id TEXT, -- Original order ID from source
    product_name TEXT NOT NULL,
    product_image_url TEXT NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    store_name TEXT NOT NULL,
    store_url TEXT,
    status order_status DEFAULT 'pending',
    raw_data JSONB, -- Full webhook payload for debugging
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- SHOP CONNECTIONS (for webhook auth)
-- ============================================
CREATE TABLE public.shop_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'shopify', 'woocommerce', etc.
    shop_domain TEXT NOT NULL,
    webhook_secret TEXT NOT NULL, -- For verifying webhook signatures
    access_token TEXT, -- OAuth token if needed
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform, shop_domain)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_visibility ON public.products(visibility);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_staging_orders_user_status ON public.staging_orders(user_id, status);
CREATE INDEX idx_comments_product_id ON public.comments(product_id);
CREATE INDEX idx_followers_following ON public.followers(following_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VIEWS (for easier querying)
-- ============================================

-- Product with user info and counts
CREATE VIEW public.products_with_details AS
SELECT 
    p.*,
    pr.display_name AS user_name,
    pr.avatar_url AS user_avatar,
    (SELECT COUNT(*) FROM public.likes WHERE product_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM public.comments WHERE product_id = p.id) AS comment_count
FROM public.products p
JOIN public.profiles pr ON p.user_id = pr.id;
