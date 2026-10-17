import { expect, test } from "@playwright/test";
import { reviewFixture } from "../../support/review-fixture";

test.beforeEach(async ({ page }) => {
  await page.route("**/__rebyu/reviews", (route) =>
    route.fulfill({ json: [reviewFixture(1), reviewFixture(2, "/work")] }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Open review tools", exact: true }).click();
  await page.getByRole("button", { name: "All reviews", exact: true }).click();
});

test.describe("Given the independent widget language preference", () => {
  test("Then switching language preserves an unfinished comment and the host document", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.lang = "de";
      document.body.dataset.localeTest = "not-reloaded";
    });
    await page.getByRole("button", { name: "Add a comment", exact: true }).click();
    await page.locator("h1").click();
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Alice");
    await page
      .getByRole("textbox", { name: "Comment", exact: true })
      .fill("Keep my original note.");
    await page.getByRole("button", { name: "Language", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Français", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Publier le commentaire", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Votre nom", exact: true })).toHaveValue(
      "Alice",
    );
    await expect(page.getByRole("textbox", { name: "Commentaire", exact: true })).toHaveValue(
      "Keep my original note.",
    );
    await page.getByRole("button", { name: /^Type de commentaire/ }).click();
    await page.getByRole("option", { name: "Idée", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Type de commentaire/ })).toContainText("Idée");
    await expect(page.locator(".rebyu-root")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("body")).toHaveAttribute("data-locale-test", "not-reloaded");
  });
});

test.describe("Given translated filters", () => {
  test("Then translated filters keep their values and the locale persists across pages", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.getByRole("menuitem", { name: "Page", exact: true }).hover();
    await page.getByRole("menuitemcheckbox", { name: "Current page", exact: true }).click();
    await page.getByRole("button", { name: "Language", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Français", exact: true }).click();
    await expect(page.getByRole("button", { name: "Page actuelle", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Supprimer le filtre", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".review-total")).toHaveText("1 sur 2 commentaires");
    await page.goto("/work");
    await page
      .getByRole("button", { name: "Ouvrir les outils de commentaire", exact: true })
      .click();
    await page.getByRole("button", { name: "Tous les commentaires", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Ajouter un commentaire", exact: true }),
    ).toBeVisible();
    await page.locator(".review-card").nth(1).click();
    await expect(page.locator(".detail-message")).toHaveText("A short note.");
    await expect(
      page.getByRole("button", { name: "Localiser sur la page", exact: true }),
    ).toBeVisible();
  });
});

test.describe("Given an unsupported persisted language", () => {
  test("Then the widget falls back to English", async ({ page, context }) => {
    await context.addCookies([
      { name: "rebyu_locale", value: "unsupported", url: page.url() },
      { name: "PARAGLIDE_LOCALE", value: "fr", url: page.url() },
    ]);
    await page.reload();
    await page.getByRole("button", { name: "Open review tools", exact: true }).click();
    await page.getByRole("button", { name: "All reviews", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add a comment", exact: true })).toBeVisible();
    await expect(page.locator(".rebyu-root")).toHaveAttribute("lang", "en");
  });
});

test.describe("Given a comment viewed in French", () => {
  test("Then dates, screenshot dialogs, and failure messages use French", async ({ page }) => {
    await page.getByRole("button", { name: "Language", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Français", exact: true }).click();
    await page.locator(".review-card").nth(1).click();
    const expectedDate = await page.evaluate(() =>
      new Date("2026-10-17T00:00:00.000Z").toLocaleString("fr"),
    );
    await expect(page.locator(".author-line p")).toHaveText(expectedDate);
    await page.getByRole("button", { name: "Voir la capture", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Capture · Commentaire 2", exact: true });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("img", { name: "Capture jointe au commentaire 2", exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.route("**/__rebyu/reviews/*", (route) =>
      route.fulfill({
        status: 500,
        json: { error: "Could not save reviews. Check the Vite server log." },
      }),
    );
    await page.getByRole("button", { name: "Résoudre le commentaire", exact: true }).click();
    await expect(
      page.getByText(
        "Impossible d’enregistrer les commentaires. Consultez les journaux du serveur Vite.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.locator(".detail-message")).toHaveText("A short note.");
  });
});
