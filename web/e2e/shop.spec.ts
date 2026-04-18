import { test, expect } from "@playwright/test";

test.describe("Prize Shop", () => {
  test("loads with Prize Shop heading", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: /Prize Shop/ })).toBeVisible();
  });

  test("shows the available points badge", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByText(/\d+ points available/)).toBeVisible();
  });

  test("shows empty state or prize cards", async ({ page }) => {
    await page.goto("/shop");
    const empty = page.getByText("No prizes yet");
    const cards = page.getByRole("button", { name: /Redeem|Need more points/ });
    const hasCards = (await cards.count()) > 0;
    if (hasCards) {
      await expect(cards.first()).toBeVisible();
    } else {
      await expect(empty).toBeVisible();
    }
  });

  test("nav link to Dashboard works from shop", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Hi, Sam!")).toBeVisible();
  });
});
