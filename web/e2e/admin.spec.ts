import { test, expect } from "@playwright/test";

test.describe("Admin PIN protection", () => {
  test("navigating to /admin redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText("Admin Access")).toBeVisible();
  });

  test("shows PIN input and Unlock button on login page", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("PIN")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unlock" })).toBeVisible();
  });

  test("displays error message for a wrong PIN", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("PIN").fill("0000");
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page.getByText("Wrong PIN")).toBeVisible();
  });

  test("PIN field is cleared after a failed attempt", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("PIN").fill("9999");
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page.getByLabel("PIN")).toHaveValue("");
  });

  test("correct PIN unlocks admin and redirects to /admin", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("PIN").fill("1234");
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page).toHaveURL("/admin");
    await expect(page.getByText("Admin Panel")).toBeVisible();
  });

  test("admin page stays accessible after login within same session", async ({ page }) => {
    // Log in first
    await page.goto("/admin/login");
    await page.getByLabel("PIN").fill("1234");
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page).toHaveURL("/admin");

    // Navigate away and back
    await page.goto("/");
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    await expect(page.getByText("Admin Panel")).toBeVisible();
  });
});
