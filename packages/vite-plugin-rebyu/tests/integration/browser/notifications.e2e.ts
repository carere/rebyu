import { expect, test } from "@playwright/test";
import type { Review } from "../../../src/schema";
import { reviewFixture } from "../../support/review-fixture";

test.describe("Given unread replies in unresolved and finished conversations", () => {
  test.beforeEach(async ({ page }) => {
    const statuses: Review["status"][] = ["open", "in-progress", "resolved", "dismissed"];
    const reviews = statuses.map((status, index) => ({
      ...reviewFixture(index + 1, "/", status),
      authorId: "alice",
      author: "Alice",
      replies: [
        {
          id: `reply-${index}`,
          author: "Bob",
          authorId: "bob",
          message: "Please check this change.",
          createdAt: "2026-10-17T01:00:00.000Z",
        },
      ],
    }));
    await page.route("**/__rebyu/reviews", (route) => route.fulfill({ json: reviews }));
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Open review tools", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.rebyu?.setUser({ id: "alice", name: "Alice" }));
  });

  test("Then the badge counts only reachable conversations and opening them clears it", async ({
    page,
  }) => {
    await expect(page.locator(".launcher-unread")).toHaveText("2");
    await page.getByRole("button", { name: "Open review tools", exact: true }).click();
    await page.getByRole("button", { name: "Needs your reply", exact: true }).click();
    await expect(page.locator(".review-card")).toHaveCount(2);
    await expect(page.locator(".review-number")).toHaveText(["1", "2"]);
    await page.locator(".review-card").first().click();
    await expect(page.locator(".launcher-unread")).toHaveText("1");
    await page.getByRole("button", { name: "All comments", exact: true }).click();
    await expect(page.locator(".review-card")).toHaveCount(1);
    await expect(page.locator(".review-number")).toHaveText("2");
    await page.locator(".review-card").click();
    await expect(page.locator(".launcher-unread")).toHaveCount(0);
    await page.getByRole("button", { name: "All comments", exact: true }).click();
    await expect(page.getByText("You’re all caught up", { exact: true })).toBeVisible();
  });
});
