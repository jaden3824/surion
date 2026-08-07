import "server-only";

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { Pool } from "pg";

const COOKIE_PREFIX = "surion";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string;
};

type AuthConfig = {
  databaseUrl: string;
  secret: string;
  baseUrl: string;
};

function readAuthConfig(): AuthConfig | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const baseUrl = process.env.BETTER_AUTH_URL?.trim();
  if (!databaseUrl || !secret || secret.length < 32 || !baseUrl) return null;

  try {
    const parsed = new URL(baseUrl);
    const allowsInsecureLocalhost = process.env.NODE_ENV !== "production"
      && parsed.protocol === "http:"
      && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
    if (parsed.protocol !== "https:" && !allowsInsecureLocalhost) return null;
  } catch {
    return null;
  }

  return { databaseUrl, secret, baseUrl };
}

function trustedOrigins(baseUrl: string) {
  const origins = new Set([new URL(baseUrl).origin]);
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) origins.add(`https://${vercelUrl}`);
  if (process.env.NODE_ENV !== "production") origins.add("http://localhost:3000");
  return [...origins];
}

function createAuthInstance(config: AuthConfig, pool: Pool) {
  return betterAuth({
    appName: "수리온",
    baseURL: config.baseUrl,
    basePath: "/api/auth",
    secret: config.secret,
    trustedOrigins: trustedOrigins(config.baseUrl),
    database: pool,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: false,
      autoSignIn: true,
    },
    user: {
      modelName: "surion_auth_user",
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
          input: false,
        },
        banned: {
          type: "boolean",
          required: true,
          defaultValue: false,
          input: false,
        },
        banReason: {
          type: "string",
          required: false,
          input: false,
        },
        banExpires: {
          type: "date",
          required: false,
          input: false,
        },
      },
      deleteUser: { enabled: true },
    },
    session: {
      modelName: "surion_auth_session",
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 60,
    },
    account: {
      modelName: "surion_auth_account",
      accountLinking: { enabled: false },
      encryptOAuthTokens: true,
    },
    verification: {
      modelName: "surion_auth_verification",
      storeIdentifier: "hashed",
      storeInDatabase: true,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "surion_auth_rate_limit",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60 * 60, max: 5 },
        "/delete-user": { window: 60 * 60, max: 5 },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const result = await pool.query<{
              banned: boolean;
              banExpires: Date | null;
            }>(`
              SELECT banned, "banExpires"
              FROM surion_auth_user
              WHERE id = $1
              LIMIT 1
            `, [session.userId]);
            const authority = result.rows[0];
            const hasActiveBan = authority?.banned === true
              && (!authority.banExpires || authority.banExpires.getTime() > Date.now());
            if (hasActiveBan) {
              throw APIError.from("FORBIDDEN", {
                code: "ACCOUNT_SUSPENDED",
                message: "이용이 제한된 계정입니다.",
              });
            }
          },
        },
      },
    },
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      database: { generateId: "uuid" },
    },
  });
}

type AuthInstance = ReturnType<typeof createAuthInstance>;

let cachedAuth: AuthInstance | null = null;
let cachedPool: Pool | null = null;
let cachedConfigKey: string | null = null;

export function isBetterAuthConfigured() {
  return Boolean(readAuthConfig());
}

export function getBetterAuth(): AuthInstance | null {
  const config = readAuthConfig();
  if (!config) return null;

  const configKey = `${config.databaseUrl}\u0000${config.baseUrl}\u0000${config.secret}`;
  if (!cachedAuth || !cachedPool || cachedConfigKey !== configKey) {
    void cachedPool?.end().catch(() => undefined);
    cachedPool = new Pool({
      connectionString: config.databaseUrl,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    cachedAuth = createAuthInstance(config, cachedPool);
    cachedConfigKey = configKey;
  }

  return cachedAuth;
}

/** Runs a core Better Auth endpoint while keeping its token out of app JSON. */
export async function dispatchBetterAuth(
  request: Request,
  path: string,
  body?: Record<string, unknown>,
  cookieHeader?: string,
) {
  const auth = getBetterAuth();
  if (!auth) return null;

  const url = new URL(request.url);
  url.pathname = `/api/auth/${path.replace(/^\/+/, "")}`;
  url.search = "";

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete("content-length");
  forwardedHeaders.set("content-type", "application/json");
  if (cookieHeader !== undefined) forwardedHeaders.set("cookie", cookieHeader);

  return auth.handler(new Request(url, {
    method: "POST",
    headers: forwardedHeaders,
    body: JSON.stringify(body ?? {}),
  }));
}

export function copyAuthCookies(source: Response, target: Response) {
  for (const value of source.headers.getSetCookie()) {
    target.headers.append("set-cookie", value);
  }
  return target;
}

export async function getCurrentAuthUser(): Promise<{
  configured: boolean;
  user: AuthenticatedUser | null;
  unavailable: boolean;
}> {
  const auth = getBetterAuth();
  if (!auth) return { configured: false, user: null, unavailable: false };

  const requestHeaders = await headers();
  if (!getSessionCookie(requestHeaders, { cookiePrefix: COOKIE_PREFIX })) {
    return { configured: true, user: null, unavailable: false };
  }

  try {
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return { configured: true, user: null, unavailable: false };

    return {
      configured: true,
      unavailable: false,
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name?.trim() || "수리온 회원",
      },
    };
  } catch {
    return { configured: true, user: null, unavailable: true };
  }
}
