import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Match unmatched staging orders to a user based on email.
 * Called after successful login/signup.
 * Gracefully handles case where columns don't exist yet.
 */
export async function matchOrdersToUser(userId: string, email: string): Promise<number> {
    if (!isSupabaseConfigured || !email) return 0;

    try {
        const normalizedEmail = email.toLowerCase().trim();

        // Find unmatched orders with this email
        const { data: unmatchedOrders, error: fetchError } = await supabase
            .from('staging_orders')
            .select('id')
            .eq('customer_email', normalizedEmail)
            .eq('matched', false)
            .is('user_id', null);

        if (fetchError) {
            // Column might not exist yet - silently skip
            console.log('Order matching skipped (migration may be pending):', fetchError.message);
            return 0;
        }

        if (!unmatchedOrders?.length) {
            return 0;
        }

        const orderIds = unmatchedOrders.map(o => o.id);

        // Update orders to match user
        const { error: updateError } = await supabase
            .from('staging_orders')
            .update({
                user_id: userId,
                matched: true
            })
            .in('id', orderIds);

        if (updateError) {
            console.error('Error matching orders:', updateError);
            return 0;
        }

        console.log(`Matched ${orderIds.length} orders to user ${userId}`);
        return orderIds.length;
    } catch (err) {
        console.log('Order matching error (migration pending?):', err);
        return 0;
    }
}

/**
 * Get count of pending orders waiting to be matched for an email.
 * Used to show "X purchases waiting" before signup.
 */
export async function getPendingOrderCountForEmail(email: string): Promise<number> {
    if (!isSupabaseConfigured || !email) return 0;

    const { count, error } = await supabase
        .from('staging_orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_email', email.toLowerCase().trim())
        .eq('matched', false);

    if (error) return 0;
    return count || 0;
}
