import { expect, test } from "@playwright/test";

test.describe("Given the keyboard shortcuts button in the drawer header", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/__rebyu/reviews", (route) => route.fulfill({ json: [] }));
    await page.goto("/");
    await page.getByRole("button", { name: "Open review tools", exact: true }).click();
    await page.getByRole("button", { name: "All reviews", exact: true }).click();
  });

  test("Then shortcuts use a translated popover with Zaidan keys and dismiss independently", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Keyboard shortcuts", exact: true });
    await trigger.click();
    const popover = page.getByRole("dialog", {
      name: "A shortcut to better feedback",
      exact: true,
    });
    await expect(popover).toBeVisible();
    expect(await popover.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    await expect(popover.locator('[data-slot="kbd"]')).toHaveText([
      "Alt",
      "R",
      "Esc",
      "J",
      "K",
      "Tab",
      "Enter",
    ]);
    await expect(popover.locator('[data-slot="kbd-group"]')).toHaveCount(3);
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveAttribute("data-open", "");
    await trigger.click();
    await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
    await expect(popover).toHaveCount(0);
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveAttribute("data-open", "");
    await page.getByRole("button", { name: "Language", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Français", exact: true }).click();
    await page.getByRole("button", { name: "Raccourcis clavier", exact: true }).click();
    const french = page.getByRole("dialog", {
      name: "Des raccourcis pour vos retours",
      exact: true,
    });
    await expect(french).toBeVisible();
    await expect(french.locator('[data-slot="kbd"]')).toHaveText([
      "Alt",
      "R",
      "Échap",
      "J",
      "K",
      "Tab",
      "Entrée",
    ]);
    await french.getByRole("button", { name: "Compris", exact: true }).click();
    await expect(french).toHaveCount(0);
    await expect(page.locator('[data-slot="drawer-content"]')).toBeVisible();
  });
});
