"use client";

import { notFound } from "next/navigation";
import { AskPage } from "./ask-page";
import { CaseDetailPage } from "./case-detail-page";
import { CategoryPage, ModelPage, SearchPage } from "./search-pages";
import { ExpertProfilePage, ExpertsPage } from "./experts-pages";
import { DashboardPage, LoginPage, StaticPage } from "./dashboard-pages";

export function RoutePage({ path }: { path: string[] }) {
  const route = path.join("/");

  if (route === "ask") return <AskPage />;
  if (route === "search") return <SearchPage />;
  if (route === "resolved") return <SearchPage defaultStatus="RESOLVED" />;
  if (path[0] === "category" && path[1]) return <CategoryPage id={path[1]} />;
  if (path[0] === "models" && path[1]) return <ModelPage model={decodeURIComponent(path.slice(1).join("/"))} />;
  if (path[0] === "cases" && path[1]) return <CaseDetailPage id={path[1]} />;
  if (route === "experts") return <ExpertsPage />;
  if (path[0] === "experts" && path[1]) return <ExpertProfilePage id={path[1]} />;
  if (route === "login" || route === "signup") return <LoginPage mode={route === "login" ? "login" : "signup"} />;
  if (["about", "safety", "terms", "privacy"].includes(route)) return <StaticPage type={route} />;
  if (["my", "saved", "notifications", "repair-requests", "settings", "expert", "admin"].includes(path[0])) return <DashboardPage path={path} />;

  notFound();
}
