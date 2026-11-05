import { expect, test } from "@playwright/test";
import { reviewFixture } from "../../support/review-fixture";

test.describe("Given a standalone widget connected to a hosted API", () => {
  test("Then it initializes without Vite injection and loads private screenshot routes", async ({
    page,
  }) => {
    const review = reviewFixture(2, "/standalone");
    const screenshot = Buffer.from((review.screenshot ?? "").split(",")[1], "base64");
    const endpoint = "/feedback/reviews";
    const screenshotPath = `${endpoint}/${review.id}/screenshot`;
    let screenshotRequests = 0;
    await page.route(`**${endpoint}`, (route) =>
      route.fulfill({ json: [{ ...review, screenshot: screenshotPath }] }),
    );
    await page.route(`**${screenshotPath}`, async (route) => {
      screenshotRequests += 1;
      await route.fulfill({ contentType: "image/png", body: screenshot });
    });
    await page.route("http://127.0.0.1:5199/standalone", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="en"><body><h1>Reviewed application</h1>
          <script type="module">
            import { mount } from "/__rebyu/client.js";
            const unmount = mount({ endpoint: "${endpoint}", projectId: "delimoov:staging" });
            window.rebyu.setUser({ id: "reviewer", name: "Reviewer" });
            window.addEventListener("rebyu:unmount", unmount, { once: true });
          </script></body></html>`,
      }),
    );
    await page.goto("/standalone");
    await page.getByRole("button", { name: "Open review tools", exact: true }).click();
    await page.getByRole("button", { name: "All reviews", exact: true }).click();
    await page.locator(".review-card").click();
    await page.getByRole("button", { name: "Show screenshot", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Screenshot · Comment 2", exact: true });
    await expect(dialog.getByRole("img")).toBeVisible();
    await expect(dialog.getByRole("img")).toHaveAttribute("src", screenshotPath);
    expect(screenshotRequests).toBeGreaterThan(0);
    await page.evaluate(() => window.dispatchEvent(new Event("rebyu:unmount")));
    await expect(page.locator("#rebyu-widget")).toHaveCount(0);
  });
});
