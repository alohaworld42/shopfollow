import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create Supabase client only if configured, otherwise create a dummy
// Using a placeholder URL for the client when not configured to prevent crashes
export const supabase: SupabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        },
        global: {
            fetch: (url, options = {}) => {
                // Don't use AbortController with a timeout that can cause issues
                return fetch(url, {
                    ...options,
                    // Ensure we don't hit abort issues with slow connections  
                });
            }
        }
    }
);

// Database types (generated from schema)
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    display_name: string;
                    avatar_url: string | null;
                    score: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };
            products: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    image_url: string;
                    price: number;
                    store_name: string;
                    store_url: string | null;
                    visibility: 'public' | 'private' | 'group';
                    group_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['products']['Insert']>;
            };
            staging_orders: {
                Row: {
                    id: string;
                    user_id: string;
                    source: string;
                    source_order_id: string | null;
                    product_name: string;
                    product_image_url: string;
                    product_price: number;
                    store_name: string;
                    store_url: string | null;
                    status: 'pending' | 'accepted' | 'rejected';
                    raw_data: Record<string, unknown> | null;
                    created_at: string;
                    processed_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['staging_orders']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['staging_orders']['Insert']>;
            };
            groups: {
                Row: {
                    id: string;
                    owner_id: string;
                    name: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['groups']['Insert']>;
            };
            shop_connections: {
                Row: {
                    id: string;
                    user_id: string;
                    platform: string;
                    shop_domain: string;
                    webhook_secret: string;
                    access_token: string | null;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['shop_connections']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['shop_connections']['Insert']>;
            };
        };
    };
}

export default supabase;
