import { test, expect } from "@playwright/test";

async function adminLogin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("PIN").fill("1234");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page).toHaveURL("/admin");
}

test.describe("Admin add points", () => {
  test("adds points and shows success toast", async ({ page }) => {
    await adminLogin(page);
    await page.getByRole("spinbutton", { name: /Points/ }).fill("25");
    await page.getByRole("textbox", { name: "Note" }).fill("E2E test reward");
    await page.getByRole("button", { name: "Add Points" }).click();
    await expect(page.getByText("+25 points added!")).toBeVisible();
  });

  test("deducting points shows negative toast", async ({ page }) => {
    await adminLogin(page);
    await page.getByRole("spinbutton", { name: /Points/ }).fill("-5");
    await page.getByRole("button", { name: "Add Points" }).click();
    await expect(page.getByText("-5 points added!")).toBeVisible();
  });
});

test.describe("Admin add prize", () => {
  test("adds a prize and it appears in the prizes list", async ({ page }) => {
    const prizeName = `E2E Prize ${Date.now()}`;
    await adminLogin(page);
    await page.getByRole("textbox", { name: "Prize Name" }).fill(prizeName);
    await page.getByRole("spinbutton", { name: "Point Cost" }).fill("10");
    await page.getByRole("button", { name: "Add Prize" }).click();
    await expect(page.getByText(`Prize "${prizeName}" added!`)).toBeVisible();
    await expect(page.getByText(prizeName, { exact: true })).toBeVisible();
  });
});

test.describe("Full redemption cycle", () => {
  test("add prize → shop → redeem → admin fulfills → appears in history", async ({ page }) => {
    const prizeName = `Cycle Prize ${Date.now()}`;

    // 1. Log in and set up: add points + prize
    await adminLogin(page);

    await page.getByRole("spinbutton", { name: /Points/ }).fill("200");
    await page.getByRole("textbox", { name: "Note" }).fill("E2E cycle setup");
    await page.getByRole("button", { name: "Add Points" }).click();
    await expect(page.getByText("+200 points added!")).toBeVisible();

    await page.getByRole("textbox", { name: "Prize Name" }).fill(prizeName);
    await page.getByRole("spinbutton", { name: "Point Cost" }).fill("10");
    await page.getByRole("button", { name: "Add Prize" }).click();
    await expect(page.getByText(`Prize "${prizeName}" added!`)).toBeVisible();

    // 2. Go to shop and redeem the specific prize
    await page.goto("/shop");
    await expect(page.getByText(prizeName)).toBeVisible();

    const prizeCard = page.locator("div").filter({
      has: page.getByText(prizeName, { exact: true }),
    }).filter({ has: page.getByRole("button", { name: "Redeem!" }) }).last();
    await prizeCard.getByRole("button", { name: "Redeem!" }).click();

    // Confirm dialog
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Yes, Redeem!" }).click();
    await expect(page.getByText(/redeemed/i)).toBeVisible({ timeout: 6000 });

    // 3. Go to admin and fulfill the redemption
    await adminLogin(page);
    await expect(page.getByText("Pending Redemptions")).toBeVisible();
    const pendingRow = page.locator("div").filter({
      has: page.getByText(prizeName, { exact: true }),
    }).filter({ has: page.getByRole("button", { name: /Mark Fulfilled/ }) }).last();
    await pendingRow.getByRole("button", { name: /Mark Fulfilled/ }).click();
    await expect(page.getByText("Marked as fulfilled!")).toBeVisible();

    // 4. Fulfilled prize disappears from pending and appears in history
    await expect(page.getByText("Pending Redemptions")).not.toBeVisible();
    const historyCard = page.locator("div").filter({
      has: page.getByText("Redemption History"),
    }).filter({ has: page.getByText("✓ Fulfilled") }).last();
    await expect(historyCard).toBeVisible();
    await expect(historyCard.getByText(prizeName, { exact: true })).toBeVisible();
  });
});
