import { expect, test } from "@playwright/test";

const appOrigin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3107";

test.describe("présence protégée", () => {
  test("redirige vers la connexion sans session", async ({ page }) => {
    await page.goto("/presence");

    await expect(page).toHaveURL(/\/connexion\?retour=%2Fpresence/);
  });

  test("ne divulgue aucune coordonnée dans une réponse anonyme", async ({
    request,
  }) => {
    const response = await request.post("/api/location", {
      data: {
        accuracy: 25,
        capturedAt: new Date().toISOString(),
        latitude: 5.3364,
        longitude: -4.0267,
      },
      headers: {
        Origin: appOrigin,
      },
    });
    const body = await response.text();

    expect(body).not.toContain("5.3364");
    expect(body).not.toContain("-4.0267");
    expect(body).not.toMatch(/latitude|longitude/i);
  });
});
