import { expect, test as it, type Page } from "@playwright/test";
import { reviewFixture } from "../../support/review-fixture";

const describe = it.describe;
const endpoint = "/configured-reviews";

async function configureHost(page: Page) {
  await page.route("**/configured?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><body><h1>Review target</h1>
        <script type="module">
          import { mount } from "/__rebyu/client.js";
          mount({
            endpoint: "${endpoint}", projectId: "configured:staging",
            initialPinsVisible: false, enableScreenshot: false, pageScope: "path",
            onError: () => document.body.dataset.reviewError = "reported"
          });
          window.rebyu.setUser({ id: "reviewer", name: "Reviewer" });
        </script></body></html>`,
    }),
  );
}

describe("Given a host with hidden initial pins and pathname-only page identity", () => {
  describe("When the widget loads on a URL with a query string", () => {
    it("Then pins stay hidden until requested and the page's review remains reachable", async ({
      page,
    }) => {
      await configureHost(page);
      await page.route(`**${endpoint}`, (route) =>
        route.fulfill({ json: [reviewFixture(1, "/configured")] }),
      );
      await page.goto("/configured?private=value");
      const launcher = page.getByRole("button", { name: "Open review tools", exact: true });
      await expect(launcher).toBeVisible();
      await expect(page.locator(".pin")).toHaveCount(0);
      await launcher.click();
      await page.getByRole("button", { name: "Show pins", exact: true }).click();
      await expect(page.getByRole("button", { name: "Open comment 1", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Open comment 1", exact: true }).click();
      await expect(page.locator(".detail-scroll")).toContainText("A long comment");
    });
  });
});

describe("Given a host with screenshot capture disabled", () => {
  describe("When a reviewer composes feedback", () => {
    it("Then capture controls are absent and submitted page identity excludes the query", async ({
      page,
    }) => {
      await configureHost(page);
      let submitted: { page?: string; screenshot?: string } | undefined;
      await page.route(`**${endpoint}`, async (route) => {
        if (route.request().method() === "POST") {
          submitted = route.request().postDataJSON();
          await route.fulfill({ status: 201, json: { ...reviewFixture(1), ...submitted } });
        } else await route.fulfill({ json: [] });
      });
      await page.goto("/configured?private=value");
      await page.getByRole("button", { name: "Open review tools", exact: true }).click();
      await page.getByRole("button", { name: "Annotation tools", exact: true }).click();
      await page.getByRole("button", { name: "Select an element", exact: true }).click();
      await page.locator("h1").click();
      await expect(
        page.getByRole("checkbox", { name: "Attach a screenshot of this viewport", exact: true }),
      ).toHaveCount(0);
      await page.getByLabel("Comment", { exact: true }).fill("Check this heading");
      await page.getByRole("button", { name: "Post comment", exact: true }).click();
      await expect.poll(() => submitted?.page).toBe("/configured");
      expect(submitted?.screenshot).toBeUndefined();
    });
  });
});

describe("Given a host that observes review outages", () => {
  describe("When the review API fails during initial loading", () => {
    it("Then the host receives the error callback", async ({ page }) => {
      await configureHost(page);
      await page.route(`**${endpoint}`, (route) =>
        route.fulfill({ status: 503, json: { error: "Review unavailable" } }),
      );
      await page.goto("/configured?private=value");
      await expect(page.locator("body")).toHaveAttribute("data-review-error", "reported");
    });
  });
});
