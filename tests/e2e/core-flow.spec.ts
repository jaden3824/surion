import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("surion-e2e-storage-ready")) return;
    window.localStorage.clear();
    window.sessionStorage.setItem("surion-e2e-storage-ready", "true");
  });
});

test("인증 저장소가 연결되지 않은 환경은 가입을 성공으로 처리하지 않는다", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "서버의 fail-closed 계약은 한 번만 확인합니다.");

  const signup = await request.post("/api/auth/signup", {
    data: {
      email: "signup-test@surion.invalid",
      password: "safe-password-123",
      nickname: "가입검수",
      isOver14: true,
      termsAccepted: true,
      privacyAccepted: true,
      next: "/ask",
    },
  });
  expect(signup.status()).toBe(503);
  await expect(signup.json()).resolves.toMatchObject({
    ok: false,
    code: "AUTH_NOT_CONFIGURED",
  });

  const profile = await request.post("/api/auth/profile", {
    data: {
      nickname: "가입검수",
      isOver14: true,
      termsAccepted: true,
      privacyAccepted: true,
      next: "/ask",
    },
  });
  expect(profile.status()).toBe(503);
  await expect(profile.json()).resolves.toMatchObject({
    ok: false,
    code: "AUTH_NOT_CONFIGURED",
  });
});

test("서버도 이메일·비밀번호와 필수 동의를 우회할 수 없게 검증한다", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "서버 입력 계약은 한 번만 확인합니다.");

  const invalidSignup = await request.post("/api/auth/signup", {
    data: { email: "not-an-email", password: "short", next: "/ask" },
  });
  expect(invalidSignup.status()).toBe(400);
  await expect(invalidSignup.json()).resolves.toMatchObject({ ok: false, code: "INVALID_SIGNUP" });

  for (const omittedRequiredField of ["isOver14", "termsAccepted", "privacyAccepted"] as const) {
    const body: Record<string, string | boolean> = {
      nickname: "가입검수",
      isOver14: true,
      termsAccepted: true,
      privacyAccepted: true,
      next: "/ask",
    };
    body[omittedRequiredField] = false;

    const response = await request.post("/api/auth/profile", { data: body });
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: "INVALID_REQUEST" });
  }
});

test("로그인은 익숙한 이메일·비밀번호 흐름과 일반화된 오류를 제공한다", async ({ page }) => {
  let submittedLogin: Record<string, unknown> | undefined;
  await page.route("**/api/auth/login", async (route) => {
    submittedLogin = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, message: "존재하지 않는 계정입니다." }),
    });
  });

  await page.goto("/login?next=%2Fask", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "다시 만나 반가워요" })).toBeVisible();
  const authTabs = page.getByRole("navigation", { name: "로그인과 회원가입 선택" });
  await expect(authTabs.getByRole("link", { name: "로그인" })).toHaveAttribute("aria-current", "page");
  await expect(authTabs.getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/signup?next=%2Fask");
  await expect(page.getByText("카카오 로그인", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "비회원 둘러보기" })).toHaveAttribute("href", "/community");

  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.getByText("이메일을 입력해 주세요.", { exact: true })).toBeVisible();
  await expect(page.getByText("비밀번호를 입력해 주세요.", { exact: true })).toBeVisible();

  await page.getByRole("textbox", { name: "이메일" }).fill("member@example.com");
  const password = page.getByLabel("비밀번호", { exact: true });
  await password.fill("correct-password");
  await page.getByRole("button", { name: "비밀번호 표시" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "비밀번호 숨기기" }).click();
  await expect(password).toHaveAttribute("type", "password");

  await password.press("Enter");
  await expect(page.locator(".auth-message[role=alert]")).toHaveText("이메일 또는 비밀번호를 확인해 주세요.");
  expect(submittedLogin).toEqual({ email: "member@example.com", password: "correct-password", next: "/ask" });
  await expect(page).toHaveURL(/\/login\?next=%2Fask$/);
});

test("회원가입은 비밀번호 확인을 즉시 검증하고 처리 중 중복 제출을 막는다", async ({ page, isMobile }) => {
  let submittedSignup: Record<string, unknown> | undefined;
  let releaseResponse!: () => void;
  let markRequestStarted!: () => void;
  const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve; });
  const requestStarted = new Promise<void>((resolve) => { markRequestStarted = resolve; });

  await page.route("**/api/auth/signup", async (route) => {
    submittedSignup = route.request().postDataJSON() as Record<string, unknown>;
    markRequestStarted();
    await responseGate;
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, message: "이미 사용 중인 이메일입니다." }),
    });
  });

  await page.goto("/signup?next=%2Fask", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "수리온에 가입하기" })).toBeVisible();
  const formBounds = await page.locator(".auth-form").boundingBox();
  expect(formBounds?.width).toBeGreaterThan(isMobile ? 340 : 400);
  const email = page.getByRole("textbox", { name: "이메일" });
  const password = page.getByLabel("비밀번호", { exact: true });
  const passwordConfirm = page.getByLabel("비밀번호 확인", { exact: true });
  const nickname = page.getByRole("textbox", { name: "닉네임" });
  await email.fill("new-member@example.com");
  await password.fill("password-one");
  await passwordConfirm.fill("password-two");
  await nickname.fill("새수리회원");
  await page.getByRole("checkbox", { name: /만 14세 이상/ }).check();
  await page.getByRole("checkbox", { name: /이용약관에 동의/ }).check();
  await page.getByRole("checkbox", { name: /개인정보 수집·이용에 동의/ }).check();
  await passwordConfirm.press("Enter");
  await expect(page.getByText("비밀번호가 서로 다릅니다.", { exact: true })).toBeVisible();
  expect(submittedSignup).toBeUndefined();

  await passwordConfirm.fill("password-one");
  await page.getByRole("button", { name: "비밀번호 확인 표시" }).click();
  await expect(passwordConfirm).toHaveAttribute("type", "text");
  await passwordConfirm.press("Enter");
  await requestStarted;
  await expect(page.getByRole("button", { name: "가입 중" })).toBeDisabled();
  expect(submittedSignup).toEqual({
    email: "new-member@example.com",
    password: "password-one",
    nickname: "새수리회원",
    isOver14: true,
    termsAccepted: true,
    privacyAccepted: true,
    next: "/ask",
  });

  releaseResponse();
  await expect(page.locator(".auth-message[role=alert]")).toHaveText("회원가입을 완료하지 못했어요. 입력 내용을 확인하거나 잠시 후 다시 시도해 주세요.");
  await expect(page).toHaveURL(/\/signup\?next=%2Fask$/);
});

test("PC 게시판 즐겨찾기를 해제하고 다시 추가하면 새로고침 후에도 유지된다", async ({ page, isMobile }) => {
  test.skip(isMobile, "데스크톱 게시판 목록의 별표 동작을 확인합니다.");
  await page.goto("/community?board=pc", { waitUntil: "domcontentloaded" });
  const boardList = page.getByRole("complementary", { name: "게시판 선택" });

  await expect(async () => {
    await boardList.getByRole("button", { name: "PC/주변기기 게시판 즐겨찾기 해제" }).last().click();
    await expect(boardList.getByRole("button", { name: "PC/주변기기 게시판 즐겨찾기 추가" })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(page).toHaveURL(/board=pc/);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(boardList.getByRole("button", { name: "PC/주변기기 게시판 즐겨찾기 추가" })).toBeVisible();

  await boardList.getByRole("button", { name: "PC/주변기기 게시판 즐겨찾기 추가" }).click();
  await expect(boardList.getByRole("button", { name: "PC/주변기기 게시판 즐겨찾기 해제" }).first()).toBeVisible();
  await expect(page).toHaveURL(/board=pc/);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(boardList.getByRole("button", { name: "PC/주변기기 게시판 즐겨찾기 해제" }).first()).toBeVisible();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("즐겨찾는 게시판 바로가기").getByRole("link", { name: "PC/주변기기" })).toHaveAttribute("href", "/community?board=pc");
});

test("모바일에서 선택한 게시판을 즐겨찾으면 원본 순서대로 목록 앞에 표시된다", async ({ page, isMobile }) => {
  test.skip(!isMobile, "모바일 게시판 선택 상자의 즐겨찾기 순서를 확인합니다.");
  await page.goto("/community?board=mobile", { waitUntil: "domcontentloaded" });
  const favoriteButton = page.getByRole("button", { name: "모바일/웨어러블 게시판 즐겨찾기 추가" });

  await expect(async () => {
    await favoriteButton.click();
    await expect(page.getByRole("button", { name: "모바일/웨어러블 게시판 즐겨찾기 해제" })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(page).toHaveURL(/board=mobile/);

  const boardSelect = page.getByRole("combobox", { name: "게시판 선택" });
  await expect.poll(() => boardSelect.locator("option").allTextContents()).toEqual([
    "전체글보기",
    "★ 청소가전 게시판",
    "★ PC/주변기기 게시판",
    "★ 모바일/웨어러블 게시판",
    "주방가전 게시판",
    "생활가전 게시판",
    "영상/음향 게시판",
    "카메라 게시판",
    "게임기 게시판",
    "공구/전동장비 게시판",
    "기타 전자제품 게시판",
  ]);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "모바일/웨어러블 게시판 즐겨찾기 해제" })).toBeVisible();
  await expect(boardSelect.locator("option").nth(3)).toHaveText("★ 모바일/웨어러블 게시판");
});

test("제품별 게시판을 선택하면 해당 글만 바로 볼 수 있다", async ({ page, isMobile }) => {
  await page.goto("/community", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "전체글보기", exact: true })).toBeVisible();

  if (isMobile) {
    const boardSelect = page.getByRole("combobox", { name: "게시판 선택" });
    await expect(async () => {
      await boardSelect.selectOption("cleaning");
      await expect(page).toHaveURL(/board=cleaning/, { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  } else {
    await page.getByRole("complementary", { name: "게시판 선택" }).getByRole("link", { name: /청소가전/ }).click();
  }

  await expect(page).toHaveURL(/\/community\?board=cleaning/);
  await expect(page.getByRole("heading", { name: "청소가전 게시판" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "충전독에 올리면 표시등이 꺼집니다" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "원래 없던 고주파 소리가 납니다" })).toHaveCount(0);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "청소가전 게시판" })).toBeVisible();
});

test("검색에서 게시판을 바꿔도 URL 조건을 유지한다", async ({ page, isMobile }) => {
  await page.goto("/search?q=충전&status=UNRESOLVED&sort=comments&board=cleaning", { waitUntil: "domcontentloaded" });

  if (isMobile) {
    await expect(async () => {
      await page.getByRole("button", { name: "검색 조건" }).click();
      await expect(page.getByRole("dialog", { name: "검색 조건" })).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await page.getByRole("dialog", { name: "검색 조건" }).getByRole("combobox", { name: "게시판 선택" }).selectOption("pc");
  } else {
    await page.getByRole("complementary", { name: "게시판 선택" }).getByRole("link", { name: /PC\/주변기기/ }).click();
  }

  await expect.poll(() => new URL(page.url()).searchParams.get("board")).toBe("pc");
  expect(new URL(page.url()).searchParams.get("q")).toBe("충전");
  expect(new URL(page.url()).searchParams.get("status")).toBe("UNRESOLVED");
  expect(new URL(page.url()).searchParams.get("sort")).toBe("comments");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => new URL(page.url()).searchParams.get("board")).toBe("pc");
  if (isMobile) {
    await expect(async () => {
      await page.getByRole("button", { name: "검색 조건" }).click();
      await expect(page.getByRole("dialog", { name: "검색 조건" })).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByRole("dialog", { name: "검색 조건" }).getByRole("combobox", { name: "게시판 선택" })).toHaveValue("pc");
  } else {
    await expect(page.getByRole("complementary", { name: "게시판 선택" }).getByRole("link", { name: /PC\/주변기기/ })).toHaveAttribute("aria-current", "page");
  }
});

test("검색에서 실제 커뮤니티 글로 바로 이동할 수 있다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const searchForm = page.getByRole("search").filter({ has: page.getByRole("textbox", { name: "고장 사례 검색" }) });
  const search = searchForm.getByRole("textbox", { name: "고장 사례 검색" });
  await expect(async () => {
    await search.fill("로보락 충전");
    await expect(search).toHaveValue("로보락 충전", { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await page.waitForTimeout(150);
  await searchForm.getByRole("button", { name: "검색", exact: true }).click();

  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.getByRole("heading", { name: "수리 경험 찾기" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "충전독에 올리면 표시등이 꺼집니다" })).toBeVisible();

  await page.getByRole("link", { name: "충전독에 올리면 표시등이 꺼집니다", exact: true }).click();
  await expect(page).toHaveURL(/\/cases\/case-1/, { timeout: 10_000 });
  await expect(page.getByText("공개 대화", { exact: true })).toBeVisible();
});

test("일반 사용자가 새 게시글을 세 단계로 등록할 수 있다", async ({ page }) => {
  await page.goto("/ask", { waitUntil: "domcontentloaded" });

  const cleaningBoard = page.getByRole("complementary", { name: "글을 올릴 게시판" }).getByRole("button", { name: "청소가전", exact: true });
  await expect(async () => {
    await cleaningBoard.click();
    await expect(cleaningBoard).toHaveAttribute("aria-pressed", "true", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await page.locator('input[list="brand-list"]').fill("로보락");
  await page.getByPlaceholder("예: S8 MaxV Ultra").fill("Q Revo Pro");
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByPlaceholder("예: 충전독에 올리면 표시등이 바로 꺼집니다")).toBeVisible();

  await page.getByPlaceholder("예: 충전독에 올리면 표시등이 바로 꺼집니다").fill("청소 중 본체가 반복해서 멈추고 다시 시작됩니다");
  await page.getByPlaceholder("언제, 어떤 상황에서, 얼마나 자주 문제가 생기는지 적어주세요.").fill("최근 일주일 동안 청소를 시작하고 약 10분이 지나면 본체가 멈추며 전원을 다시 켜야 움직입니다.");
  await page.getByText("작동 중 멈춰요", { exact: true }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await expect(page.getByRole("heading", { name: "사진이나 영상을 추가해 주세요" })).toBeVisible();
  await page.getByRole("button", { name: "게시글 등록하기" }).click();
  await expect(page.getByRole("heading", { name: "게시글이 등록됐어요" })).toBeVisible();
  await expect(page).toHaveURL(/\/cases\/case-/);
  await expect(page.getByRole("heading", { name: "청소 중 본체가 반복해서 멈추고 다시 시작됩니다" })).toBeVisible();
});

test("누구나 같은 댓글 작성란에서 자유롭게 대화할 수 있다", async ({ page }) => {
  await page.goto("/cases/case-1", { waitUntil: "domcontentloaded" });
  await page.getByText("데모 역할 바꾸기", { exact: true }).click();
  const roleSelect = page.getByLabel("현재 역할");
  const commentForm = page.locator("form.comment-form");
  await expect(async () => {
    await roleSelect.selectOption("user");
    await expect(commentForm.getByText("경험나눔", { exact: true })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByText("일반 의견", { exact: true })).toHaveCount(0);
  await expect(page.getByText("전문가 의견", { exact: true })).toHaveCount(0);
  const commentBody = "저도 같은 모델에서 비슷한 증상이 있었고 충전 접점을 닦은 뒤 다시 정상 작동했습니다.";
  const commentInput = page.getByRole("textbox", { name: "댓글 내용" });
  const submitComment = page.getByRole("button", { name: "댓글 등록" });
  await expect(async () => {
    await commentInput.fill(commentBody);
    await expect(commentInput).toHaveValue(commentBody, { timeout: 1_000 });
    await expect(submitComment).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await submitComment.click();

  await expect(page.getByText("저도 같은 모델에서 비슷한 증상이 있었고 충전 접점을 닦은 뒤 다시 정상 작동했습니다.")).toBeVisible();
  await expect(page.getByText("일반 의견", { exact: true })).toHaveCount(0);
  await expect(page.getByText("전문가 의견", { exact: true })).toHaveCount(0);
  await expect(page.getByText("채택", { exact: true })).toHaveCount(0);
});

test("해결 기록은 댓글 채택과 독립적으로 남긴다", async ({ page }) => {
  await page.goto("/cases/case-1", { waitUntil: "domcontentloaded" });
  const dialog = page.getByRole("dialog", { name: "어떻게 해결됐나요?" });
  await expect(async () => {
    await page.getByRole("button", { name: "해결 결과 등록하기" }).click();
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(dialog.getByText("특정 댓글을 고르지 않고, 실제로 해결한 방법을 그대로 남겨주세요.")).toBeVisible();
  await expect(dialog.getByText("채택", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText(/도움을 준 (댓글|답변)/)).toHaveCount(0);
});

test("공개 전문가 화면에 실시간 활동 상태를 노출하지 않는다", async ({ page }) => {
  await page.goto("/experts/expert-kim", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "김수리" })).toBeVisible();
  await expect(page.getByText("활동 중", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/마지막 (접속|활동)/)).toHaveCount(0);
});
