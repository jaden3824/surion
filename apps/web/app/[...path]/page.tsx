import { redirect } from "next/navigation";
import { RoutePage } from "@/features/route-page";
import { buildProfileRedirect, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { getAuthState } from "@/lib/auth/viewer";

type CatchAllPageProps = {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const protectedSections = new Set([
  "ask",
  "my",
  "saved",
  "notifications",
  "repair-requests",
  "settings",
  "expert",
  "admin",
]);

function buildReturnPath(path: string[], searchParams: Record<string, string | string[] | undefined>) {
  const returnPath = `/${path.map(encodeURIComponent).join("/")}`;
  const query = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  });

  return query.size ? `${returnPath}?${query.toString()}` : returnPath;
}

export default async function CatchAllPage({ params, searchParams }: CatchAllPageProps) {
  const { path } = await params;
  const auth = await getAuthState();

  if (path[0] === "login" || path[0] === "signup") {
    const query = await searchParams;
    const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
    const next = sanitizeAuthRedirect(rawNext);
    const profileStep = path[0] === "signup" && (query.step === "profile" || query.oauth === "1");

    if (auth.configured && auth.viewer && auth.onboardingComplete) redirect(next);
    if (auth.configured && auth.viewer && !auth.onboardingComplete && !profileStep) {
      redirect(buildProfileRedirect(next));
    }
    if (auth.configured && !auth.viewer && profileStep) {
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
  }

  if (protectedSections.has(path[0])) {
    const query = await searchParams;
    if (auth.configured) {
      const next = buildReturnPath(path, query);
      if (!auth.viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
      if (!auth.onboardingComplete) {
        redirect(`/signup?step=profile&next=${encodeURIComponent(next)}`);
      }
    }

    if (
      path[0] === "admin"
      && process.env.NEXT_PUBLIC_DEMO_MODE !== "true"
      && (!auth.configured || auth.viewer?.isAdmin !== true)
    ) {
      redirect("/");
    }
  }

  return <RoutePage path={path} viewer={auth.viewer} />;
}
