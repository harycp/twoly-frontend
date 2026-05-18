import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase URL or Key is missing. Realtime features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function checkDatabaseConnection(): Promise<{ isConnected: boolean; errorMessage: string }> {
    try {
        const { error } = await supabase.from('couple_touches').select('id').limit(1);
        
        if (error) {
            console.error("[Supabase Service] DB Check Error:", error.message);
            return { isConnected: false, errorMessage: `DB Error: ${error.message}` };
        }
        
        console.log("[Supabase Service] Database connection is healthy! 🟢");
        return { isConnected: true, errorMessage: '' };
    } catch (error: unknown) {
        console.error("[Supabase Service] Network/Fatal Error:", error);
        return {
            isConnected: false,
            errorMessage: error instanceof Error ? error.message : 'Network error or DB unreachable.'
        };
    }
}