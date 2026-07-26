import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.resolve("supabase/migrations/0004_auth_session_context.sql"),
  "utf8",
);

describe("migration du contrat de session", () => {
  it("utilise une RPC sans paramètre fondée sur auth.uid", () => {
    expect(migration).toMatch(/get_my_session_context\s*\(\s*\)/i);
    expect(migration).toMatch(/where profile\.id = auth\.uid\(\)/i);
  });

  it("durcit le contexte d’exécution", () => {
    expect(migration).toMatch(/security definer/i);
    expect(migration).toMatch(/set search_path = ''/i);
  });

  it("réserve l’exécution aux utilisateurs authentifiés", () => {
    expect(migration).toMatch(
      /revoke all on function public\.get_my_session_context\(\) from public/i,
    );
    expect(migration).toMatch(
      /revoke all on function public\.get_my_session_context\(\) from anon/i,
    );
    expect(migration).toMatch(
      /grant execute on function public\.get_my_session_context\(\) to authenticated/i,
    );
  });
});
