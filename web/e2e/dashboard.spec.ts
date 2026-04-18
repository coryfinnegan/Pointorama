import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads and shows the kid's name", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Hi, Sam!")).toBeVisible();
  });

  test("shows a level badge", async ({ page }) => {
    await page.goto("/");
    // At any point total the level badge should be visible (at least Rookie)
    const badge = page.getByRole("status").or(
      page.locator("text=/Rookie|Explorer|Achiever|Champion|Legend/")
    );
    await expect(badge.first()).toBeVisible();
  });

  test("shows the three stat cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Total Earned")).toBeVisible();
    await expect(page.getByText("Available")).toBeVisible();
    await expect(page.getByText("Spent")).toBeVisible();
  });

  test("nav links are present and active state highlights Dashboard", async ({ page }) => {
    await page.goto("/");
    const dashLink = page.getByRole("link", { name: "Dashboard" });
    await expect(dashLink).toBeVisible();
    await expect(dashLink).toHaveClass(/bg-indigo-600/);
  });

  test("Prize Shop nav link navigates to /shop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Prize Shop" }).click();
    await expect(page).toHaveURL("/shop");
    await expect(page.getByRole("heading", { name: /Prize Shop/ })).toBeVisible();
  });
});
