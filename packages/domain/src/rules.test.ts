import { describe, expect, it } from "vitest";
import { canChangeExpertStatus, canPromoteTemporaryModel, canReadPrivateRequest, canRequestRepair, canResolveCase, canViewExpertFeed } from "./rules";
import type { CaseComment, Expert, RepairRequest, Resolution } from "./types";

const expert: Expert = {
  id: "expert-1",
  name: "김수리",
  status: "BUSINESS_VERIFIED",
  intro: "",
  categories: [],
  brands: [],
  regions: [],
  methods: [],
  answers: 1,
  validAnswers: 1,
  helpfulAnswers: 1,
  repairRequests: 0,
  repairsCompleted: 0,
  responseTime: "1시간",
  repairEnabled: true,
};

const expertComment: CaseComment = {
  id: "comment-1",
  caseId: "case-1",
  authorId: "expert-user-1",
  author: "김수리",
  role: "BUSINESS_EXPERT",
  expertId: expert.id,
  type: "GENERAL",
  body: "충전 접점의 오염이나 어댑터 전압 저하 가능성을 확인해 보세요.",
  createdAt: "2026-08-01",
  validExpertAnswer: true,
  helpfulCount: 2,
};

describe("수리 요청 업무 규칙", () => {
  it("댓글을 남기지 않은 전문가는 수리 요청 대상이 아니다", () => {
    expect(canRequestRepair({ currentUserId: "user-1", questionAuthorId: "user-1", expert, comments: [], caseId: "case-1", caseStatus: "OPEN", repairRequests: [] })).toBe(false);
  });

  it("유효한 댓글을 남긴 수리 가능 전문가에게 요청할 수 있다", () => {
    expect(canRequestRepair({ currentUserId: "user-1", questionAuthorId: "user-1", expert, comments: [expertComment], caseId: "case-1", caseStatus: "DIAGNOSING", repairRequests: [] })).toBe(true);
  });

  it("동시에 두 개의 활성 요청을 만들 수 없다", () => {
    expect(canRequestRepair({ currentUserId: "user-1", questionAuthorId: "user-1", expert, comments: [expertComment], caseId: "case-1", caseStatus: "OPEN", repairRequests: [{ id: "r1", caseId: "case-1", expertId: "expert-2", requesterId: "user-1", method: "택배", preferredDate: "", note: "", status: "PENDING", createdAt: "" }] })).toBe(false);
  });
});

describe("권한 규칙", () => {
  it("일반 사용자는 전문가 피드를 볼 수 없다", () => expect(canViewExpertFeed("NONE")).toBe(false));
  it("검증된 개인·사업자 전문가만 전문가 피드를 볼 수 있다", () => {
    expect(canViewExpertFeed("PERSONAL_VERIFIED")).toBe(true);
    expect(canViewExpertFeed("BUSINESS_VERIFIED")).toBe(true);
    expect(canViewExpertFeed("PENDING")).toBe(false);
  });
  it("관리자만 전문가 상태를 바꿀 수 있다", () => expect(canChangeExpertStatus(false)).toBe(false));
  it("임시 모델은 관리자 검토 없이 승격되지 않는다", () => expect(canPromoteTemporaryModel(true, false)).toBe(false));
  it("해결 결과는 질문자만 등록할 수 있다", () => {
    expect(canResolveCase("user-1", "user-1")).toBe(true);
    expect(canResolveCase("expert-user-1", "user-1")).toBe(false);
  });

  it("해결 기록은 특정 댓글을 선택하지 않고 만들 수 있다", () => {
    const resolution: Resolution = {
      method: "직접 해결",
      cause: "접점 오염",
      summary: "전원을 분리하고 접점을 닦아 해결했습니다.",
      duration: "하루 이내",
      working: true,
    };

    expect(resolution).not.toHaveProperty("helperCommentId");
    expect(resolution.summary).toContain("해결");
  });

  it("비공개 수리 요청은 요청자와 대상 전문가만 읽을 수 있다", () => {
    const request: RepairRequest = { id: "r1", caseId: "case-1", expertId: expert.id, requesterId: "user-1", method: "택배", preferredDate: "", note: "", status: "PENDING", createdAt: "" };
    expect(canReadPrivateRequest("user-1", request, "expert-user-1")).toBe(true);
    expect(canReadPrivateRequest("expert-user-1", request, "expert-user-1")).toBe(true);
    expect(canReadPrivateRequest("user-2", request, "expert-user-1")).toBe(false);
  });
});
