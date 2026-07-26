import { expect, test } from "@playwright/test";

const FULL_PHONE = "+2250701020304";

test.describe("frontières de sécurité de la vague 2", () => {
  test("affiche un OTP incorrect sans révéler le numéro complet", async ({
    page,
  }) => {
    await page.addInitScript((phone) => {
      window.sessionStorage.setItem("leco:otp-phone", phone);
    }, FULL_PHONE);
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

    await page.goto("/verification-otp");
    await page.getByLabel("Chiffre 1 sur 6").fill("123456");
    await page.getByRole("button", { name: /confirmer le code/i }).click();

    await expect(page.locator("#otp-status")).toContainText(
      "Ce code n’est pas valide ou a expiré.",
    );
    await expect(page.locator("body")).not.toContainText(FULL_PHONE);
  });

  test("distingue un OTP expiré et efface les chiffres saisis", async ({
    page,
  }) => {
    await page.addInitScript((phone) => {
      window.sessionStorage.setItem("leco:otp-phone", phone);
    }, FULL_PHONE);
    await page.route("**/api/auth/otp/verify", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          error: {
            code: "OTP_EXPIRED",
            message: "Ce code a expiré. Demande un nouveau code.",
          },
        }),
        contentType: "application/json",
        status: 400,
      });
    });

    await page.goto("/verification-otp");
    await page.getByLabel("Chiffre 1 sur 6").fill("654321");
    await page.getByRole("button", { name: /confirmer le code/i }).click();

    await expect(page.locator("#otp-status")).toContainText("Ce code a expiré");
    for (let index = 1; index <= 6; index += 1) {
      await expect(page.getByLabel(`Chiffre ${index} sur 6`)).toHaveValue("");
    }
  });

  test("refuse les mutations cross-origin sans refléter les données privées", async ({
    request,
  }) => {
    const profileResponse = await request.patch("/api/profile", {
      data: {
        adultConfirmed: true,
        bio: "privé",
        birthDate: "2000-01-01",
        firstName: "Awa",
        gender: "woman",
        onboardingStep: 2,
        searchingFor: ["man"],
      },
      headers: { Origin: "https://evil.example" },
    });
    expect(profileResponse.status()).toBe(403);
    expect(await profileResponse.text()).not.toContain("Awa");

    const locationResponse = await request.post("/api/location", {
      data: {
        accuracy: 20,
        capturedAt: new Date().toISOString(),
        latitude: 5.3364,
        longitude: -4.0267,
      },
      headers: { Origin: "https://evil.example" },
    });
    const body = await locationResponse.text();
    expect(locationResponse.status()).toBe(403);
    expect(body).not.toMatch(/5\.3364|-4\.0267|latitude|longitude/i);
  });

  test("traite une session absente ou expirée comme déconnectée", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/presence");
    await expect(page).toHaveURL(/\/connexion\?retour=%2Fpresence/);
  });

  test("la déconnexion ne divulgue aucun jeton sans configuration live", async ({
    page,
  }) => {
    await page.goto("/connexion");
    const response = await page.evaluate(async () => {
      const result = await fetch("/api/auth/logout", { method: "POST" });
      return { body: await result.text(), status: result.status };
    });

    expect([200, 503]).toContain(response.status);
    expect(response.body).not.toMatch(
      /access_token|refresh_token|eyJ[A-Za-z0-9_-]+/,
    );

    await page.goto("/profil");
    await expect(page).toHaveURL(/\/connexion/);
  });
});
