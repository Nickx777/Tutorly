import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Extend window type for TypeScript
declare global {
    interface Window {
        __supabaseClient?: ReturnType<typeof createBrowserClient>;
    }
}

// Use a global window variable to persist the client across HMR
// This prevents AbortError issues during Fast Refresh
function getSupabaseClient() {
    if (typeof window === 'undefined') {
        // Server-side: create a new client each time
        return createBrowserClient(supabaseUrl, supabaseAnonKey);
    }

    // Client-side: use singleton attached to window
    if (!window.__supabaseClient) {
        window.__supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return window.__supabaseClient;
}

export function createClient() {
    return getSupabaseClient();
}

// Check if Supabase is properly configured
export function isSupabaseConfigured() {
    return (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
    );
}

