import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "[DermTriage] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.",
  );
}

/**
 * Server-side Supabase client using the service-role key.
 * This bypasses Row Level Security — use only in trusted server contexts.
 * NEVER expose this client or key to the browser.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
