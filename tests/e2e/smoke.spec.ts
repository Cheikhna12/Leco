import { expect, test } from "@playwright/test";

test("routes an anonymous visitor to the real authentication flow", async ({
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
  await expect(page).toHaveURL(/\/connexion$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Entre dans le moment/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Numéro mobile")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    /données fictives|aperçu local|Awa|Mariam|Yann/i,
  );
  expect(criticalErrors).toEqual([]);
});

test("keeps the reserved administration surface inaccessible anonymously", async ({
  page,
}) => {
  const response = await page.goto("/admin");

  expect(response?.status()).toBe(404);
  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
});
