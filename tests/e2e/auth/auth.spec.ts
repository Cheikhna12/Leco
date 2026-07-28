import { expect, test } from "@playwright/test";

test.describe("authentification mobile", () => {
  test("affiche la connexion et ses garanties", async ({ page }) => {
    await page.goto("/connexion");

    await expect(
      page.getByRole("heading", { name: /entre dans le moment/i }),
    ).toBeVisible();
    await expect(page.locator(".auth-title-trace")).toBeVisible();
    await expect(page.locator(".auth-brand")).not.toContainText("Leco");
    await expect(page.getByLabel("Numéro mobile")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /recevoir mon code/i }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/ton numéro suffit/i);
    await expect(page.getByRole("checkbox")).toBeVisible();
  });

  test("valide les erreurs sans appeler le serveur", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Numéro mobile").fill("1234");
    await page.getByRole("button", { name: /recevoir mon code/i }).click();

    await expect(page.locator("#phone-error")).toContainText(
      "numéro mobile ivoirien valide",
    );
  });

  test("l’écran OTP prend en charge le collage", async ({ page }) => {
    await page.goto("/connexion");
    await page.evaluate(() => {
      sessionStorage.setItem("leco:otp-phone", "+2250701020304");
    });
    await page.goto("/verification-otp");
    const firstDigit = page.getByLabel("Chiffre 1 sur 6");
    await firstDigit.fill("123456");

    for (let index = 1; index <= 6; index += 1) {
      await expect(page.getByLabel(`Chiffre ${index} sur 6`)).toHaveValue(
        String(index),
      );
    }
  });

  test("un code OTP refusé reste sur l’écran sans erreur navigateur", async ({
    page,
  }) => {
    const browserErrors: string[] = [];

    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !message
          .text()
          .includes(
            "upgrade-insecure-requests' is ignored when delivered in a report-only policy",
          ) &&
        !message.text().includes("400 (Bad Request)")
      ) {
        browserErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      browserErrors.push(error.stack ?? error.message);
    });

    await page.route("**/api/auth/otp/verify", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          error: {
            code: "OTP_INVALID",
            message: "Ce code n’est pas valide ou a expiré.",
          },
        }),
        contentType: "application/json",
        status: 400,
      });
    });
    await page.goto("/connexion");
    await page.evaluate(() => {
      sessionStorage.setItem("leco:otp-phone", "+2250701020304");
    });
    await page.goto("/verification-otp");
    await page.getByLabel("Chiffre 1 sur 6").fill("654321");
    await page.getByRole("button", { name: /confirmer le code/i }).click();

    await expect(page.locator("#otp-status")).toContainText(
      "Ce code n’est pas valide ou a expiré.",
    );
    await expect(page).toHaveURL(/\/verification-otp$/);
    await page.getByRole("link", { name: /modifier le numéro/i }).click();
    await expect(page).toHaveURL(/\/connexion$/);
    expect(browserErrors).toEqual([]);
  });

  test("redirige une route protégée sans session", async ({ page }) => {
    await page.goto("/presence");
    await expect(page).toHaveURL(/\/connexion\?retour=%2Fpresence/);
  });
});
