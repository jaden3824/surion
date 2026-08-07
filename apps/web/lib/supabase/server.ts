import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const config = getSupabasePublicConfig();
  if (!config) return null;

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always update cookies; middleware handles refresh in production.
        }
      },
    },
  });
}
