import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("frontières de confidentialité de la présence", () => {
  it("la Route Handler ne lit jamais cookie ou JWT directement", () => {
    const routes = [
      "src/app/api/location/route.ts",
      "src/app/api/presence/route.ts",
      "src/app/api/presence/heartbeat/route.ts",
    ]
      .map(source)
      .join("\n");

    expect(routes).not.toMatch(
      /cookies\(|authorization|jwt|getUser|getSession/i,
    );
    expect(source("src/features/presence/server/factory.ts")).toMatch(
      /getServerSession/,
    );
  });

  it("aucune coordonnée n’est loggée ou rendue par le contrôle", () => {
    const feature = [
      "src/app/api/location/route.ts",
      "src/components/presence/presence-control.tsx",
      "src/features/presence/server/service.ts",
    ]
      .map(source)
      .join("\n");

    expect(feature).not.toMatch(/console\.(?:log|info|warn|error)/);
    expect(source("src/components/presence/presence-control.tsx")).not.toMatch(
      /latitude|longitude|coords/,
    );
  });

  it("le navigateur ne peut pas écrire directement user_locations", () => {
    const client = source("src/features/locations/client.ts");
    expect(client).toMatch(/fetch\("\/api\/location"/);
    expect(client).not.toMatch(/user_locations|supabase|\.from\(/i);
  });
});
