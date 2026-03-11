import { createClient } from "@supabase/supabase-js";

// cliente para o FRONTEND (usa anon key, com sessão persistida)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
