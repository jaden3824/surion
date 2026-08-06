"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CaseComment, CaseSummary, RepairRequest, Resolution } from "@surion/domain";
import { initialCases, initialComments, initialRepairRequests } from "@/lib/demo-data";

type DemoRole = "questioner" | "expert" | "user" | "admin";

interface DemoStoreValue {
  cases: CaseSummary[];
  comments: CaseComment[];
  repairRequests: RepairRequest[];
  savedCaseIds: string[];
  notificationsRead: string[];
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  addCase: (item: CaseSummary) => void;
  addComment: (item: CaseComment) => void;
  addRepairRequest: (item: RepairRequest) => void;
  updateRepairRequest: (id: string, status: RepairRequest["status"]) => void;
  resolveCase: (caseId: string, resolution: Resolution) => void;
  toggleSaved: (caseId: string) => void;
  markNotificationRead: (id: string) => void;
  resetDemo: () => void;
}

const DemoStore = createContext<DemoStoreValue | null>(null);
const storageKey = "surion-demo-state-v1";

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState(initialCases);
  const [comments, setComments] = useState(initialComments);
  const [repairRequests, setRepairRequests] = useState(initialRepairRequests);
  const [savedCaseIds, setSavedCaseIds] = useState<string[]>(["case-3", "case-9"]);
  const [notificationsRead, setNotificationsRead] = useState<string[]>([]);
  const [role, setRole] = useState<DemoRole>("questioner");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Pick<DemoStoreValue, "cases" | "comments" | "repairRequests" | "savedCaseIds" | "notificationsRead" | "role">>;
        if (stored.cases) setCases(stored.cases);
        if (stored.comments) setComments(stored.comments);
        if (stored.repairRequests) setRepairRequests(stored.repairRequests);
        if (stored.savedCaseIds) setSavedCaseIds(stored.savedCaseIds);
        if (stored.notificationsRead) setNotificationsRead(stored.notificationsRead);
        if (stored.role) setRole(stored.role);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ cases, comments, repairRequests, savedCaseIds, notificationsRead, role }));
  }, [cases, comments, repairRequests, savedCaseIds, notificationsRead, role, hydrated]);

  const value = useMemo<DemoStoreValue>(() => ({
    cases,
    comments,
    repairRequests,
    savedCaseIds,
    notificationsRead,
    role,
    setRole,
    addCase: (item) => setCases((current) => [item, ...current]),
    addComment: (item) => {
      setComments((current) => [...current, item]);
      setCases((current) => current.map((entry) => entry.id === item.caseId ? { ...entry, comments: entry.comments + 1 } : entry));
    },
    addRepairRequest: (item) => {
      setRepairRequests((current) => [item, ...current]);
      setCases((current) => current.map((entry) => entry.id === item.caseId ? { ...entry, status: "REPAIR_REQUESTED" } : entry));
    },
    updateRepairRequest: (id, status) => {
      setRepairRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
      const target = repairRequests.find((request) => request.id === id);
      if (target && status === "ACCEPTED") setCases((current) => current.map((entry) => entry.id === target.caseId ? { ...entry, status: "IN_REPAIR" } : entry));
    },
    resolveCase: (caseId, resolution) => {
      setCases((current) => current.map((entry) => entry.id === caseId ? { ...entry, status: resolution.method === "미해결 종료" ? "CLOSED_UNRESOLVED" : "RESOLVED", solvedBy: resolution.method } : entry));
      setComments((current) => [...current, { id: `resolution-${Date.now()}`, caseId, authorId: "user-demo", author: "민준아빠", role: "QUESTIONER", type: "RESOLUTION_UPDATE", body: `해결 결과: ${resolution.cause} · ${resolution.summary}`, createdAt: "방금", helpfulCount: 0 }]);
    },
    toggleSaved: (caseId) => setSavedCaseIds((current) => current.includes(caseId) ? current.filter((id) => id !== caseId) : [...current, caseId]),
    markNotificationRead: (id) => setNotificationsRead((current) => current.includes(id) ? current : [...current, id]),
    resetDemo: () => {
      setCases(initialCases);
      setComments(initialComments);
      setRepairRequests(initialRepairRequests);
      setSavedCaseIds(["case-3", "case-9"]);
      setNotificationsRead([]);
      setRole("questioner");
      window.localStorage.removeItem(storageKey);
    },
  }), [cases, comments, repairRequests, savedCaseIds, notificationsRead, role]);

  return <DemoStore.Provider value={value}>{children}</DemoStore.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStore);
  if (!value) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return value;
}
