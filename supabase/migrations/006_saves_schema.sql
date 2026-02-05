-- Migration: 006_saves_schema.sql

-- ============================================
-- SAVES (many-to-many)
-- ============================================
CREATE TABLE public.saves (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, user_id)
);

-- Index for faster lookups
CREATE INDEX idx_saves_user_id ON public.saves(user_id);
CREATE INDEX idx_saves_product_id ON public.saves(product_id);

-- Add saves count to products_with_details view
DROP VIEW IF EXISTS public.products_with_details;

CREATE VIEW public.products_with_details AS
SELECT 
    p.*,
    pr.display_name AS user_name,
    pr.avatar_url AS user_avatar,
    (SELECT COUNT(*) FROM public.likes WHERE product_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM public.comments WHERE product_id = p.id) AS comment_count,
    (SELECT COUNT(*) FROM public.saves WHERE product_id = p.id) AS save_count
FROM public.products p
JOIN public.profiles pr ON p.user_id = pr.id;
