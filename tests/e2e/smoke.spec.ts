import { expect, test } from "@playwright/test";

test("loads Leco, switches theme and navigates without critical errors", async ({
  page,
}) => {
  const criticalErrors: string[] = [];

  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("Download the React DevTools") &&
      !message
        .text()
        .includes(
          "upgrade-insecure-requests' is ignored when delivered in a report-only policy",
        )
    ) {
      criticalErrors.push(message.text());
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page).toHaveTitle(/Leco/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Qui est partant/ }),
  ).toBeVisible();
  await expect(page.getByText("Aperçu privé")).toBeVisible();
  await expect(page.getByText("Aperçu UI · données fictives")).toBeVisible();
  await page.waitForTimeout(500);
  expect(criticalErrors).toEqual([]);

  const themeButton = page.getByRole("button", { name: "Changer de thème" });
  if (await themeButton.isVisible()) {
    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      /^(dark|light)$/,
    );
    const firstTheme = await page.locator("html").getAttribute("data-theme");
    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      firstTheme === "dark" ? "light" : "dark",
    );
  } else {
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload({ waitUntil: "networkidle" });
    const lightBackground = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const darkBackground = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);
  }

  await page.getByRole("button", { name: /^Messages/ }).click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Des conversations qui comptent.",
    }),
  ).toBeVisible();
  await expect(page.getByText(/données fictives/i)).toBeVisible();

  await page.getByRole("button", { name: /^Ma vibe/ }).click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Pose ta vibe. Vis ta soirée.",
    }),
  ).toBeVisible();
  await expect(page.getByText(/aperçu interactif local/i)).toBeVisible();

  expect(criticalErrors).toEqual([]);
});

test("keeps the reserved administration surface inaccessible anonymously", async ({
  page,
}) => {
  const response = await page.goto("/admin");

  expect(response?.status()).toBe(404);
  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
});
