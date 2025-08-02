import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const createClientSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(supabaseUrl, supabaseKey);
};

export default createClientSupabase;
