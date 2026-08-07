import { z } from "zod";

export const createCaseSchema = z.object({
  category: z.string().min(1, "카테고리를 선택해 주세요."),
  brand: z.string().min(1, "브랜드를 입력해 주세요."),
  model: z.string().min(1, "모델명을 입력하거나 ‘모델명을 모르겠어요’를 선택해 주세요."),
  title: z.string().min(8, "제목을 8자 이상 입력해 주세요.").max(100),
  symptom: z.string().min(20, "증상을 20자 이상 자세히 알려 주세요.").max(4000),
  symptomType: z.string().optional(),
  usagePeriod: z.string().optional(),
  occurredAt: z.string().optional(),
  attempts: z.string().optional(),
  additionalInfo: z.string().optional(),
  modelIdentificationStatus: z.enum(["confirmed", "user_entered", "unknown", "admin_review_needed"]),
});

export const createCommentSchema = z.object({
  caseId: z.string(),
  body: z.string().min(2).max(3000),
  replyToCommentId: z.string().optional(),
});

export const createRepairRequestSchema = z.object({
  caseId: z.string(),
  expertId: z.string(),
  method: z.enum(["택배", "방문", "출장"]),
  preferredDate: z.string().min(1),
  note: z.string().max(1000),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateRepairRequestInput = z.infer<typeof createRepairRequestSchema>;
