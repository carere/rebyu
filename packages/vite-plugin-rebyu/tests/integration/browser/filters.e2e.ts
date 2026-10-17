import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Keep browser checks independent of local reviewers' comments and storage.
  await page.route("**/__rebyu/reviews", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  await page.getByRole("button", { name: "Open review tools", exact: true }).click();
  await page.getByRole("button", { name: "All reviews", exact: true }).click();
});

test.describe("Given filters portaled inside the widget ShadowRoot", () => {
  test("Then hovering submenu options keeps them open and closes the previous field", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    for (const [field, label] of [
      ["Page", "Current page"],
      ["Author", "Me"],
    ]) {
      await page.getByRole("menuitem", { name: field, exact: true }).hover();
      const option = page.getByRole("menuitemcheckbox", { name: label, exact: true });
      await option.hover();
      // The original adapter closed the submenu asynchronously on the option's events.
      await page.waitForTimeout(1100);
      await expect(option).toBeVisible();
      await expect(
        page.locator('[data-slot="dropdown-menu-sub-content"][data-expanded]'),
      ).toHaveCount(1);
      await expect(page.locator('[data-slot="dropdown-menu-sub-content"] input')).toHaveCount(0);
    }
    await page.getByRole("menuitemcheckbox", { name: "Me", exact: true }).click();
    await expect(page.getByRole("button", { name: "Me", exact: true })).toHaveCount(1);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("Then keyboard navigation selects a page filter once and Escape dismisses menus", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    const field = page.getByRole("menuitem", { name: "Page", exact: true });
    await field.focus();
    await field.press("ArrowRight");
    const option = page.getByRole("menuitemcheckbox", { name: "Current page", exact: true });
    await expect(option).toBeFocused();
    await option.press("Enter");
    await expect(page.getByRole("button", { name: "Current page", exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("Given the review drawer uses Mira in a flush sidebar", () => {
  test("Then the review drawer background reaches the viewport edges", async ({ page }) => {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 800 });
      const drawer = page.locator('[data-slot="drawer-content"]');
      await expect(drawer).toBeVisible();
      await expect(drawer).not.toHaveAttribute("data-transitioning");
      const geometry = () =>
        drawer.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const css = getComputedStyle(element);
          const background = getComputedStyle(element, "::before");
          return {
            top: bounds.top,
            right: innerWidth - bounds.right,
            bottom: innerHeight - bounds.bottom,
            padding: css.padding,
            backgroundInset: background.inset,
            backgroundRadius: background.borderRadius,
          };
        });
      await expect.poll(geometry).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        padding: "0px",
        backgroundInset: "0px",
        backgroundRadius: "0px",
      });
    }
  });
});

test.describe("Given the widget’s Mira styles", () => {
  test("Then borders, matching sizes, shadows, and focus rings work in both themes", async ({
    page,
  }) => {
    for (let theme = 0; theme < 2; theme++) {
      if (theme) await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
      await page.getByRole("button", { name: "Filter", exact: true }).click();
      await page.getByRole("menuitem", { name: "Page", exact: true }).hover();
      await page.getByRole("menuitemcheckbox", { name: "Current page", exact: true }).click();
      const controls = await page.locator(".review-filters button").evaluateAll((buttons) =>
        buttons.map((button) => {
          const css = getComputedStyle(button);
          return {
            height: button.getBoundingClientRect().height,
            border: css.borderTopWidth,
            style: css.borderTopStyle,
          };
        }),
      );
      expect(
        controls.every(
          (control) =>
            control.height === controls[0].height &&
            control.border === "1px" &&
            control.style === "solid",
        ),
      ).toBe(true);
      const trigger = page.getByRole("button", { name: "Filter", exact: true });
      await page.keyboard.press("Tab");
      await trigger.focus();
      await expect
        .poll(() => trigger.evaluate((button) => getComputedStyle(button).boxShadow))
        .not.toBe("none");
      await trigger.click();
      await expect
        .poll(() =>
          page
            .locator('[data-slot="dropdown-menu-content"][data-expanded]')
            .evaluate((menu) => getComputedStyle(menu).boxShadow),
        )
        .not.toBe("none");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Remove filter", exact: true }).click();
    }
  });

  test("Then mobile menus remain usable and text editing keeps focus", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.getByRole("menuitem", { name: "Text", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Text", exact: true });
    await input.fill("contrast");
    await input.press("End");
    await input.pressSequentially(" details");
    await expect(input).toHaveValue("contrast details");
    await expect(input).toBeFocused();
    await expect(page.locator(".review-total")).toHaveText("0 of 0 comments");
    const overflow = await page
      .locator(".review-filters")
      .evaluate((bar) => bar.scrollWidth > bar.clientWidth);
    expect(overflow).toBe(false);
  });
});
