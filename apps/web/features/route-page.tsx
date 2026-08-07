"use client";

import { notFound } from "next/navigation";
import { AskPage } from "./ask-page";
import { CaseDetailPage } from "./case-detail-page";
import { ModelPage, SearchPage } from "./search-pages";
import { ExpertProfilePage, ExpertsPage } from "./experts-pages";
import { DashboardPage, LoginPage, StaticPage } from "./dashboard-pages";
import { CommunityPage } from "./community-page";
import type { AuthViewer } from "@/lib/auth/types";

export function RoutePage({ path, viewer }: { path: string[]; viewer: AuthViewer | null }) {
  const route = path.join("/");

  if (route === "ask") return <AskPage viewer={viewer} />;
  if (route === "community") return <CommunityPage />;
  if (route === "search") return <SearchPage />;
  if (route === "resolved") return <SearchPage defaultStatus="RESOLVED" />;
  if (path[0] === "category" && path[1]) return <CommunityPage initialBoard={path[1]} />;
  if (path[0] === "models" && path[1]) return <ModelPage model={decodeURIComponent(path.slice(1).join("/"))} />;
  if (path[0] === "cases" && path[1]) return <CaseDetailPage id={path[1]} />;
  if (route === "experts") return <ExpertsPage />;
  if (path[0] === "experts" && path[1]) return <ExpertProfilePage id={path[1]} />;
  if (route === "login" || route === "signup") return <LoginPage mode={route === "login" ? "login" : "signup"} />;
  if (["about", "safety", "terms", "privacy"].includes(route)) return <StaticPage type={route} />;
  if (["my", "saved", "notifications", "repair-requests", "settings", "expert", "admin"].includes(path[0])) return <DashboardPage path={path} viewer={viewer} />;

  notFound();
}
