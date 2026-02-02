-- Seed Data for Development
-- Run with: supabase db seed

-- Note: In production, users are created via auth.users trigger
-- For local dev, we insert directly into profiles

-- Demo Users (insert after auth.users are created)
-- These IDs would normally come from Supabase Auth
-- For local testing, you can create users via the Auth UI first

-- Insert demo products (replace user_id with actual IDs after signup)
/*
INSERT INTO public.products (user_id, name, image_url, price, store_name, store_url, visibility) VALUES
    ('USER_ID_HERE', 'Nike Air Max 90', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80', 139.99, 'Nike', 'https://nike.com', 'public'),
    ('USER_ID_HERE', 'Apple AirPods Pro', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80', 279.00, 'Apple', 'https://apple.com', 'public'),
    ('USER_ID_HERE', 'Minimalist Watch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 189.00, 'Nordstrom', 'https://nordstrom.com', 'public'),
    ('USER_ID_HERE', 'Designer Sunglasses', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', 245.00, 'Ray-Ban', 'https://ray-ban.com', 'public'),
    ('USER_ID_HERE', 'Ceramic Coffee Set', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80', 89.99, 'Etsy', 'https://etsy.com', 'public'),
    ('USER_ID_HERE', 'Yoga Mat Premium', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', 78.00, 'Lululemon', 'https://lululemon.com', 'public');
*/

-- Sample staging orders (for inbox testing)
/*
INSERT INTO public.staging_orders (user_id, source, product_name, product_image_url, product_price, store_name, store_url, status) VALUES
    ('USER_ID_HERE', 'shopify', 'Wireless Charging Pad', 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=800&q=80', 39.99, 'Amazon', 'https://amazon.com', 'pending'),
    ('USER_ID_HERE', 'woocommerce', 'Sustainable Water Bottle', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80', 34.00, 'Etsy', 'https://etsy.com', 'pending');
*/

-- Helper function to seed demo data for a user
CREATE OR REPLACE FUNCTION seed_demo_data(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Add demo products
    INSERT INTO public.products (user_id, name, image_url, price, store_name, store_url, visibility) VALUES
        (p_user_id, 'Nike Air Max 90', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80', 139.99, 'Nike', 'https://nike.com', 'public'),
        (p_user_id, 'Apple AirPods Pro', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80', 279.00, 'Apple', 'https://apple.com', 'public'),
        (p_user_id, 'Minimalist Watch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 189.00, 'Nordstrom', 'https://nordstrom.com', 'public');
    
    -- Add demo staging orders
    INSERT INTO public.staging_orders (user_id, source, product_name, product_image_url, product_price, store_name, store_url, status) VALUES
        (p_user_id, 'shopify', 'Wireless Charging Pad', 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=800&q=80', 39.99, 'Amazon', 'https://amazon.com', 'pending'),
        (p_user_id, 'manual', 'Sustainable Water Bottle', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80', 34.00, 'Etsy', 'https://etsy.com', 'pending');
    
    -- Create a demo group
    INSERT INTO public.groups (owner_id, name) VALUES
        (p_user_id, 'Familie'),
        (p_user_id, 'Beste Freunde');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
