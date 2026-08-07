export type SupabasePublicConfig = {
  url: string;
  key: string;
};

/** Public values only. The service-role key must never be used in the web app. */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  return url && key ? { url, key } : null;
}
