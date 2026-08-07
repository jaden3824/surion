const DEFAULT_AUTH_REDIRECT = "/my/questions";

/**
 * Authentication redirects are intentionally restricted to same-site paths.
 * In particular, protocol-relative URLs (`//example.com`) and backslashes are
 * rejected because browsers may interpret them as an external destination.
 */
export function sanitizeAuthRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const parsed = new URL(value, "https://surion.local");
    if (parsed.origin !== "https://surion.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function buildProfileRedirect(next: string, oauth = false) {
  const params = new URLSearchParams({ step: "profile", next });
  if (oauth) params.set("oauth", "1");
  return `/signup?${params.toString()}`;
}
