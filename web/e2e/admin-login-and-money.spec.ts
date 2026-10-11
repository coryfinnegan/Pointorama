import { test, expect, type Page } from "@playwright/test";

// Uses the test PIN (1234) from vitest.config.mts / CI env.
async function enterPin(page: Page) {
  await page.getByPlaceholder("Enter PIN").fill("1234");
  await page.getByRole("button", { name: "UNLOCK" }).click();
}

test.describe("Admin login redirect", () => {
  test("logging in from the home page lock icon lands on the admin page", async ({ page }) => {
    await page.goto("/");
    // Give <Link href="/admin"> time to prefetch (prod builds cache the pre-login redirect).
    await page.waitForLoadState("networkidle");
    await page.getByTitle("Admin").click();
    await expect(page).toHaveURL(/\/admin\/login\?from=%2Fadmin/);

    await enterPin(page);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("QUICK ADD MONEY")).toBeVisible();
  });

  test("logging in from a direct visit to the login page lands on the admin page", async ({ page }) => {
    await page.goto("/admin/login");
    await enterPin(page);
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("Admin subtract money", () => {
  test("adds then subtracts money and updates the balance", async ({ page }) => {
    await page.goto("/admin/login");
    await enterPin(page);
    await expect(page).toHaveURL(/\/admin$/);

    const balance = page.getByTestId("money-balance");
    await expect(balance).toBeVisible();
    const startCents = Math.round(parseFloat((await balance.innerText()).replace(/[^0-9.]/g, "")) * 100);

    await page.getByRole("button", { name: "+$5", exact: true }).click();
    await expect(balance).toHaveText(`BALANCE $${((startCents + 500) / 100).toFixed(2)}`);

    await page.getByLabel("Amount to subtract").fill("1.25");
    await page.getByLabel("Subtract reason").fill("E2E candy");
    await page.getByRole("button", { name: "SUBTRACT MONEY" }).click();
    await expect(page.getByText("-$1.25 subtracted")).toBeVisible();
    await expect(balance).toHaveText(`BALANCE $${((startCents + 375) / 100).toFixed(2)}`);

    const res = await page.request.get("/api/money");
    const { logs } = await res.json();
    expect(logs[0]).toMatchObject({ amountCents: -125, note: "E2E candy" });
  });

  test("refuses to subtract more than the balance", async ({ page }) => {
    await page.goto("/admin/login");
    await enterPin(page);
    const balance = page.getByTestId("money-balance");
    await expect(balance).toBeVisible();
    const before = await balance.innerText();

    await page.getByLabel("Amount to subtract").fill("100000");
    await page.getByRole("button", { name: "SUBTRACT MONEY" }).click();
    await expect(page.getByText(/available/)).toBeVisible();
    await expect(balance).toHaveText(before);
  });
});
