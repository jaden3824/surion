import type { CaseComment, CaseStatus, Expert, RepairRequest } from "./types";

const terminalStatuses: CaseStatus[] = ["RESOLVED", "CLOSED_UNRESOLVED"];
const activeRequestStatuses = ["PENDING", "ACCEPTED"] as const;

export interface RepairEligibilityInput {
  currentUserId: string;
  questionAuthorId: string;
  expert: Expert;
  comments: CaseComment[];
  caseId: string;
  caseStatus: CaseStatus;
  repairRequests: RepairRequest[];
}

export function canRequestRepair(input: RepairEligibilityInput): boolean {
  const isQuestioner = input.currentUserId === input.questionAuthorId;
  const hasValidAnswer = input.comments.some(
    (comment) => comment.caseId === input.caseId && comment.expertId === input.expert.id && comment.validExpertAnswer && !comment.deleted,
  );
  const hasActiveRequest = input.repairRequests.some(
    (request) => request.caseId === input.caseId && activeRequestStatuses.includes(request.status as (typeof activeRequestStatuses)[number]),
  );

  return isQuestioner && input.expert.repairEnabled && hasValidAnswer && !terminalStatuses.includes(input.caseStatus) && !hasActiveRequest;
}

export function canResolveCase(currentUserId: string, questionAuthorId: string): boolean {
  return currentUserId === questionAuthorId;
}

export function canViewExpertFeed(expertStatus: Expert["status"]): boolean {
  return expertStatus === "PERSONAL_VERIFIED" || expertStatus === "BUSINESS_VERIFIED";
}

export function canChangeExpertStatus(isAdmin: boolean): boolean {
  return isAdmin;
}

export function canReadPrivateRequest(userId: string, request: RepairRequest, expertUserId: string): boolean {
  return request.requesterId === userId || expertUserId === userId;
}

export function canPromoteTemporaryModel(isAdmin: boolean, reviewed: boolean): boolean {
  return isAdmin && reviewed;
}

export function scoreExpertMatch(input: {
  categoryMatch: boolean;
  brandMatch: boolean;
  modelMatch: boolean;
  symptomMatch: boolean;
  active: boolean;
  workload: number;
  recentlyAnswered: boolean;
}): number {
  return (
    Number(input.categoryMatch) * 30 +
    Number(input.brandMatch) * 25 +
    Number(input.modelMatch) * 20 +
    Number(input.symptomMatch) * 15 +
    Number(input.active) * 8 -
    Math.min(input.workload * 2, 10) -
    Number(input.recentlyAnswered) * 3
  );
}
