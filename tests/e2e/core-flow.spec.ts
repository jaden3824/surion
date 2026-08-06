import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
});

test("검색에서 실제 커뮤니티 글로 바로 이동할 수 있다", async ({ page }) => {
  const search = page.getByRole("textbox", { name: "고장 사례 검색" });
  await expect(async () => {
    await search.fill("로보락 충전");
    await expect(search).toHaveValue("로보락 충전", { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await page.waitForTimeout(150);
  await search.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.getByRole("heading", { name: "고장 사례를 찾아보세요" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "충전독에 올리면 표시등이 꺼집니다" })).toBeVisible();

  await page.getByRole("heading", { name: "충전독에 올리면 표시등이 꺼집니다" }).click();
  await expect(page).toHaveURL(/\/cases\/case-1/);
  await expect(page.getByText("공개 대화", { exact: true })).toBeVisible();
});

test("일반 사용자가 새 질문을 세 단계로 등록할 수 있다", async ({ page }) => {
  await page.goto("/ask");

  await page.getByText("청소가전", { exact: true }).first().click();
  await page.locator('input[list="brand-list"]').fill("로보락");
  await page.getByPlaceholder("예: S8 MaxV Ultra").fill("Q Revo Pro");
  await page.getByRole("button", { name: "다음" }).click();

  await page.getByPlaceholder("예: 충전독에 올리면 표시등이 바로 꺼집니다").fill("청소 중 본체가 반복해서 멈추고 다시 시작됩니다");
  await page.getByPlaceholder("언제, 어떤 상황에서, 얼마나 자주 문제가 생기는지 적어주세요.").fill("최근 일주일 동안 청소를 시작하고 약 10분이 지나면 본체가 멈추며 전원을 다시 켜야 움직입니다.");
  await page.getByText("작동 중 멈춰요", { exact: true }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await expect(page.getByRole("heading", { name: "사진이나 영상을 추가해 주세요" })).toBeVisible();
  await page.getByRole("button", { name: "질문 등록하기" }).click();
  await expect(page.getByRole("heading", { name: "질문이 등록됐어요" })).toBeVisible();
  await expect(page).toHaveURL(/\/cases\/case-/);
  await expect(page.getByRole("heading", { name: "청소 중 본체가 반복해서 멈추고 다시 시작됩니다" })).toBeVisible();
});

test("사용자 경험과 전문가 답변이 같은 공개 대화에 쌓인다", async ({ page }) => {
  await page.goto("/cases/case-1");
  await page.getByLabel("보기 역할").selectOption("user");
  await page.getByRole("textbox").last().fill("저도 같은 모델에서 비슷한 증상이 있었고 충전 접점을 닦은 뒤 다시 정상 작동했습니다.");
  await page.getByRole("button", { name: "의견 등록" }).click();

  await expect(page.getByText("저도 같은 모델에서 비슷한 증상이 있었고 충전 접점을 닦은 뒤 다시 정상 작동했습니다.")).toBeVisible();
  await expect(page.getByText("일반 사용자").last()).toBeVisible();
});
