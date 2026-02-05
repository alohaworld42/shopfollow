-- Recreate products_with_details view with security_invoker = true
-- This ensures RLS policies on underlying tables are applied when querying the view.

DROP VIEW IF EXISTS public.products_with_details;

CREATE VIEW public.products_with_details WITH (security_invoker = true) AS
SELECT 
    p.*,
    pr.display_name AS user_name,
    pr.avatar_url AS user_avatar,
    (SELECT COUNT(*) FROM public.likes WHERE product_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM public.comments WHERE product_id = p.id) AS comment_count,
    -- Add arrays for optimistic UI checks if needed, but counts are good.
    -- Actually, for 'isLiked', we perform separate queries in frontend or join?
    -- The service handles separate lookups for likes/saves arrays.
    -- So this view structure is fine.
    
    -- We can also include store_url and affiliate_url explicitly if not covered by p.* (they are)
    p.store_name -- just ensuring columns match
FROM public.products p
JOIN public.profiles pr ON p.user_id = pr.id;
