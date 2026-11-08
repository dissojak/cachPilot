import { test, expect } from "@playwright/test";

test("Google sign-in button redirects to Google", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page, { timeout: 20000 }).toHaveURL(/accounts\.google\.com/);
});
