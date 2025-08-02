/**
 * Supabase client for server-side usage with authentication
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStorePromise?: Promise<ReturnType<typeof cookies>>) => {
  const cookieStore_ = cookieStorePromise ?? cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      async get(name: string) {
        const store = await cookieStore_;
        return store.get(name)?.value;
      },
      async set(name: string, value: string, options: CookieOptions) {
        const store = await cookieStore_;
        store.set({ name, value, ...options });
      },
      async remove(name: string, options: CookieOptions) {
        const store = await cookieStore_;
        store.set({ name, value: "", ...options });
      },
    },
  });
};
