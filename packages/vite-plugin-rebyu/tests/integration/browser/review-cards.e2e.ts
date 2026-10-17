import { expect, test } from "@playwright/test";
import { reviewFixture as review } from "../../support/review-fixture";

test.beforeEach(async ({ page }) => {
  const reviews = [review(1), review(2, "/work", "in-progress"), review(3, "/", "resolved")];
  await page.route("**/__rebyu/reviews**", async (route) => {
    if (route.request().method() === "DELETE") {
      const index = reviews.findIndex((item) => route.request().url().endsWith(item.id));
      if (index < 0) throw new Error("Unknown review");
      reviews.splice(index, 1);
      await route.fulfill({ json: {} });
    } else if (route.request().method() === "PATCH") {
      const selected = reviews.find((item) => route.request().url().endsWith(item.id));
      if (!selected) throw new Error("Unknown review");
      expect(route.request().postDataJSON()).toEqual({ status: "resolved" });
      selected.status = "resolved";
      await route.fulfill({ json: selected });
    } else await route.fulfill({ json: reviews });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open review tools", exact: true }).click();
  await page.getByRole("button", { name: "All reviews", exact: true }).click();
});

test.describe("Given the comment detail toolbar and screenshot", () => {
  test("Then the toolbar aligns at mobile width and deleting requires confirmation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator(".review-card").first().click();
    const geometry = await page.locator(".detail-toolbar").evaluate((toolbar) =>
      [...toolbar.children].map((element) => ({
        center: element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2,
        height: element.getBoundingClientRect().height,
      })),
    );
    expect(Math.max(...geometry.map((item) => item.center)) - geometry[0].center).toBeLessThan(1);
    expect(geometry[1].height).toBe(geometry[2].height);
    await expect(page.locator(".detail-toolbar .review-category svg")).toHaveCount(1);
    await page.getByRole("button", { name: "Delete comment", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Delete permanently", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".detail-message")).toBeVisible();
    await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
    await expect(page.locator(".review-card")).toHaveCount(1);
  });

  test("Then a screenshot opens inside the widget dialog and closes without closing the drawer", async ({
    page,
  }) => {
    await page.locator(".review-card").nth(1).click();
    await page.getByRole("button", { name: "Show screenshot", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Screenshot · Comment 2", exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    await expect(page.locator("body")).not.toHaveAttribute("aria-hidden", "true");
    await expect(
      dialog.getByRole("img", { name: "Screenshot attached to comment 2", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("#rebyu-widget")).not.toHaveAttribute("data-kb-top-layer");
    await expect(page.locator(".detail-message")).toBeVisible();
    await page.getByRole("button", { name: "Show screenshot", exact: true }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-slot="drawer-content"]')).toBeVisible();
  });
});

test.describe("Given the simplified review cards", () => {
  test("Then long messages expand without navigating and resolved comments stay hidden", async ({
    page,
  }) => {
    await expect(page.locator(".review-card")).toHaveCount(2);
    await expect(page.locator(".review-total")).toHaveText("2 of 2 comments");
    const message = page.locator(".review-card p").first();
    await expect(message).toHaveClass(/message-collapsed/);
    await page.getByRole("button", { name: "Show more", exact: true }).click();
    await expect(message).not.toHaveClass(/message-collapsed/);
    await expect(page.locator(".review-card")).toHaveCount(2);
    await page.getByRole("button", { name: "Show less", exact: true }).click();
    await expect(message).toHaveClass(/message-collapsed/);
    await expect(page.locator(".card-page").nth(1)).toHaveText("/work");
    await expect(page.locator(".card-status, .review-page")).toHaveCount(0);
  });

  test("Then selecting a cross-page card navigates and resolving returns to the inbox", async ({
    page,
  }) => {
    await page.locator(".review-card").nth(1).click();
    await expect(page).toHaveURL(/\/work#rebyu-review=/);
    await expect(page.locator(".detail-message")).toHaveText("A short note.");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await page.getByRole("button", { name: "Resolve comment", exact: true }).click();
    await expect(page.locator(".detail-message")).toHaveCount(0);
    await expect(page.locator(".review-card")).toHaveCount(1);
    await expect(page.locator(".review-total")).toHaveText("1 of 1 comment");
    await expect(page.getByRole("button", { name: "Open comment 2", exact: true })).toHaveCount(0);
  });
});

test.describe("Given the comment detail tools", () => {
  test("Then the tools share one line and Info shows the captured context", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator(".review-card").first().click();
    const tools = page.locator(".detail-tools");
    await expect(tools.getByRole("button")).toHaveCount(3);
    await expect(
      tools.getByRole("button", { name: "Show screenshot", exact: true }),
    ).toBeDisabled();
    const positions = await tools
      .getByRole("button")
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().top));
    expect(new Set(positions).size).toBe(1);
    expect(await tools.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
      false,
    );
    await tools.getByRole("button", { name: "Info", exact: true }).click();
    const context = page.locator(".review-context");
    await expect(context).toBeVisible();
    await expect(context.locator("dt")).toHaveText(["Viewport", "User agent", "Console errors"]);
    await expect(context.locator("dd")).toHaveText([
      "1280x800",
      "Browser test",
      "No errors captured",
    ]);
    await page.keyboard.press("Escape");
    await expect(context).toHaveCount(0);
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveAttribute("data-open", "");
    await expect(page.locator(".detail-message")).toBeVisible();
    await tools.getByRole("button", { name: "Locate on page", exact: true }).click();
    await expect(page.locator(".detail-message")).toBeVisible();
  });
});
