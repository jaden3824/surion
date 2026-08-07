import { describe, expect, it } from "vitest";
import { buildProfileRedirect, sanitizeAuthRedirect } from "./redirect";

describe("sanitizeAuthRedirect", () => {
  it("keeps a same-site path with its query and hash", () => {
    expect(sanitizeAuthRedirect("/ask?board=pc#write")).toBe("/ask?board=pc#write");
  });

  it.each([
    undefined,
    null,
    "",
    "https://evil.example/steal",
    "//evil.example/steal",
    "///evil.example/steal",
    "/\\evil.example/steal",
    "/cases/case-1\nhttps://evil.example",
  ])("replaces an unsafe redirect (%s) with the account home", (value) => {
    expect(sanitizeAuthRedirect(value)).toBe("/my/questions");
  });

  it("supports an explicit safe fallback", () => {
    expect(sanitizeAuthRedirect("https://evil.example", "/login")).toBe("/login");
  });
});

describe("buildProfileRedirect", () => {
  it("encodes the internal destination for profile onboarding", () => {
    expect(buildProfileRedirect("/ask?board=pc")).toBe(
      "/signup?step=profile&next=%2Fask%3Fboard%3Dpc",
    );
  });

  it("marks an OAuth onboarding request without changing its destination", () => {
    expect(buildProfileRedirect("/my/questions", true)).toBe(
      "/signup?step=profile&next=%2Fmy%2Fquestions&oauth=1",
    );
  });
});
