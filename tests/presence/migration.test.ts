import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/0006_wave2_location_presence.sql",
  ),
  "utf8",
);

describe("migration présence de vague 2", () => {
  it("n’expose aucun champ de localisation dans le read model", () => {
    const readModel = migration.match(
      /create or replace function public\.get_my_presence\(\)[\s\S]*?\$\$;/i,
    )?.[0];

    expect(readModel).toBeTruthy();
    expect(readModel).not.toMatch(
      /latitude|longitude|user_locations|accuracy_m/i,
    );
  });

  it("expire après cinq minutes sans heartbeat", () => {
    expect(migration).toMatch(/interval '5 minutes'/i);
  });

  it("refuse PUBLIC et anon, avec search_path vide", () => {
    expect(migration).toMatch(/security definer\s+set search_path = ''/i);
    expect(migration).toMatch(
      /revoke all on function public\.get_my_presence\(\)\s+from public, anon, authenticated/i,
    );
    expect(migration).toMatch(
      /grant execute on function public\.get_my_presence\(\)\s+to authenticated/i,
    );
  });

  it("revérifie le statut actif lors de chaque heartbeat", () => {
    expect(migration).toMatch(/profile\.account_status = 'active'/i);
    expect(migration).toMatch(/profile\.is_profile_complete/i);
  });
});
