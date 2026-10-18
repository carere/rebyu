import { expect, test } from "@playwright/test";

test.describe("Given the public website production build", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Then a visitor can attach, resolve, and reset a local example note", async ({ page }) => {
    await page.getByRole("button", { name: "Review the sample button", exact: true }).click();
    await expect(page.locator("#selected-target")).toHaveText("Button");
    const note = 'Move this button a little lower. <img src=x onerror="alert(1)">';
    await page.getByLabel("Your note", { exact: true }).fill(note);
    await page.getByRole("button", { name: "Leave a note", exact: true }).click();
    await expect(page.locator(".demo-comment p")).toHaveText(note);
    await expect(page.locator(".demo-comment img")).toHaveCount(0);
    await expect(page.locator('[data-review-target="button"]')).toHaveAttribute("data-pin", "2");
    await page.getByRole("button", { name: "Resolve example comment 2", exact: true }).click();
    await expect(page.locator("#demo-count")).toHaveText("1 open sample note");
    await expect(page.locator('[data-review-target="button"]')).not.toHaveAttribute("data-pin");
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    await expect(page.locator("#selected-target")).toHaveText("Heading");
    await expect(page.locator(".demo-comment p")).toContainText("breathing room");
  });

  test("Then demo notes disappear on reload and no production review plugin is mounted", async ({
    page,
  }) => {
    await expect(page.locator("#rebyu-widget")).toHaveCount(0);
    await page.getByLabel("Your note", { exact: true }).fill("Private to this example tab.");
    await page.getByRole("button", { name: "Leave a note", exact: true }).click();
    await expect(page.locator("#demo-count")).toHaveText("2 open sample notes");
    await page.reload();
    await expect(page.locator("#demo-count")).toHaveText("1 open sample note");
    await expect(page.locator(".demo-comments")).not.toContainText("Private to this example tab.");
  });

  test("Then the example works at phone width without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: "Review the sample note card", exact: true }).click();
    await expect(page.locator("#selected-target")).toHaveText("Note card");
    await expect(page.getByLabel("Your note", { exact: true })).toBeFocused();
    const widths = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  });
});
