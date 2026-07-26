import path from "node:path";

import { expect, test } from "@playwright/test";

const liveEnabled = process.env.E2E_ONBOARDING_LIVE === "true";
const developmentCode = process.env.E2E_DEVELOPMENT_OTP_CODE;
const fixtureOne = process.env.E2E_PROFILE_PHOTO_ONE;
const fixtureTwo = process.env.E2E_PROFILE_PHOTO_TWO;

test.describe("onboarding local réel", () => {
  test.skip(
    !liveEnabled || !developmentCode || !fixtureOne || !fixtureTwo,
    "Nécessite Supabase Auth, Cloudinary test et deux photos locales.",
  );

  test("OTP → profil → photos → intérêts → consentement", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Numéro mobile").fill("07 00 00 12 45");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /recevoir mon code/i }).click();
    await page.getByLabel("Chiffre 1 sur 6").fill(developmentCode!);
    await page.getByRole("button", { name: /confirmer le code/i }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    await page.getByLabel("Prénom").fill("Awa");
    await page.getByLabel("Date de naissance").fill("2000-05-14");
    await page.getByLabel("Femme", { exact: true }).first().check();
    await page.getByLabel("Homme", { exact: true }).nth(1).check();
    await page
      .getByLabel("Quelques mots")
      .fill("Toujours partante pour une expo.");
    await page.getByLabel(/je confirme avoir au moins 18 ans/i).check();
    await page.getByRole("button", { name: /continuer/i }).click();

    const chooser = page.locator('input[type="file"]');
    await chooser.setInputFiles(path.resolve(fixtureOne!));
    await chooser.setInputFiles(path.resolve(fixtureTwo!));
    await expect(page.getByText("Principale")).toBeVisible();
    await page.getByRole("button", { name: /continuer/i }).click();

    await page.getByRole("button", { name: "Art" }).click();
    await page.getByRole("button", { name: "Cinéma" }).click();
    await page.getByRole("button", { name: /continuer/i }).click();

    await page.context().grantPermissions(["geolocation"]);
    await page.getByRole("button", { name: /autoriser ma position/i }).click();
    await expect(page.getByText("Autorisation accordée")).toBeVisible();
  });
});
