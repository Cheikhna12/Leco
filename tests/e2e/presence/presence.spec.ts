import { expect, test } from "@playwright/test";

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
        Origin: "http://127.0.0.1:3000",
      },
    });
    const body = await response.text();

    expect(body).not.toContain("5.3364");
    expect(body).not.toContain("-4.0267");
    expect(body).not.toMatch(/latitude|longitude/i);
  });
});
