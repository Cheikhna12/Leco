import { expect, test } from "@playwright/test";

const liveAuthEnabled = process.env.E2E_AUTH_LIVE === "true";
const developmentCode = process.env.E2E_DEVELOPMENT_OTP_CODE;

test.describe("session OTP locale réelle", () => {
  test.skip(
    !liveAuthEnabled || !developmentCode,
    "Nécessite Supabase local et le fournisseur OTP de développement.",
  );

  test("numéro → OTP → session → onboarding → déconnexion", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByLabel("Numéro mobile").fill("07 00 00 12 35");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /recevoir mon code/i }).click();

    await expect(page).toHaveURL(/\/verification-otp/);
    await page.getByLabel("Chiffre 1 sur 6").fill(developmentCode!);
    await page.getByRole("button", { name: /confirmer le code/i }).click();

    await expect(page).toHaveURL(/\/onboarding/);

    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.ok()).toBe(true);
    await expect(sessionResponse.json()).resolves.toMatchObject({
      authenticated: true,
      session: {
        accountState: "active",
        profileState: "incomplete",
      },
    });

    const logoutResponse = await page.request.post("/api/auth/logout", {
      headers: { Origin: "http://127.0.0.1:3000" },
    });
    expect(logoutResponse.ok()).toBe(true);

    await page.goto("/presence");
    await expect(page).toHaveURL(/\/connexion/);
  });
});
