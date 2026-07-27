import { expect, test } from "@playwright/test";

test.describe("authentification mobile", () => {
  test("affiche la connexion et ses garanties", async ({ page }) => {
    await page.goto("/connexion");

    await expect(
      page.getByRole("heading", { name: /autour de toi/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Numéro mobile")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /recevoir mon code/i }),
    ).toBeVisible();
    await expect(page.getByText(/ton numéro reste privé/i)).toBeVisible();
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

  test("redirige une route protégée sans session", async ({ page }) => {
    await page.goto("/presence");
    await expect(page).toHaveURL(/\/connexion\?retour=%2Fpresence/);
  });
});
