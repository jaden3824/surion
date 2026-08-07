export const caseStatuses = [
  "OPEN",
  "NEEDS_INFORMATION",
  "DIAGNOSING",
  "REPAIR_REQUESTED",
  "IN_REPAIR",
  "RESOLVED",
  "CLOSED_UNRESOLVED",
] as const;

export type CaseStatus = (typeof caseStatuses)[number];
export type ExpertStatus = "NONE" | "PENDING" | "PERSONAL_VERIFIED" | "BUSINESS_VERIFIED" | "REJECTED" | "SUSPENDED";
export type RepairRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
export type CommentType = "GENERAL" | "EXPERT_OPINION" | "REQUEST_INFORMATION" | "USER_EXPERIENCE" | "RESOLUTION_UPDATE" | "SAFETY_WARNING";
export type RoleSnapshot = "QUESTIONER" | "EXPERT" | "BUSINESS_EXPERT" | "USER" | "ADMIN";
export type ModelIdentificationStatus = "confirmed" | "user_entered" | "unknown" | "admin_review_needed";

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface CaseSummary {
  id: string;
  category: string;
  brand: string;
  model: string;
  title: string;
  symptom: string;
  status: CaseStatus;
  authorId?: string;
  author: string;
  authorAvatarUrl?: string;
  createdAt: string;
  views: number;
  comments: number;
  saves: number;
  helpful: number;
  solvedBy?: string;
  resolution?: Resolution;
  modelIdentificationStatus: ModelIdentificationStatus;
  tags: string[];
}

export interface CaseComment {
  id: string;
  caseId: string;
  authorId: string;
  author: string;
  avatarUrl?: string;
  role: RoleSnapshot;
  expertId?: string;
  type: CommentType;
  body: string;
  createdAt: string;
  edited?: boolean;
  deleted?: boolean;
  replyToCommentId?: string;
  replyToLabel?: string;
  validExpertAnswer?: boolean;
  helpfulCount: number;
}

export interface Expert {
  id: string;
  name: string;
  avatarUrl?: string;
  status: ExpertStatus;
  intro: string;
  categories: string[];
  brands: string[];
  regions: string[];
  methods: string[];
  answers: number;
  validAnswers: number;
  helpfulAnswers: number;
  repairRequests: number;
  repairsCompleted: number;
  responseTime: string;
  repairEnabled: boolean;
}

export interface RepairRequest {
  id: string;
  caseId: string;
  expertId: string;
  requesterId: string;
  method: "택배" | "방문" | "출장";
  preferredDate: string;
  note: string;
  status: RepairRequestStatus;
  createdAt: string;
}

export interface Resolution {
  method: "직접 해결" | "수리온 전문가에게 수리" | "외부 수리업체" | "제조사 서비스센터" | "제품 교체" | "미해결 종료";
  cause: string;
  summary: string;
  cost?: number;
  duration: string;
  working: boolean;
  review?: string;
}
