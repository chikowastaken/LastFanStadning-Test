import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client
 *
 * Uses the SERVICE_ROLE_KEY which bypasses RLS
 * This should ONLY be used server-side!
 *
 * SECURITY: Never expose this client or the service role key to the frontend
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Create a Supabase client for a specific user
 * Useful for operations that should respect RLS
 */
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export default supabaseAdmin;
