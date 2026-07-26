import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "0002_rls_policies.sql"),
  "utf8",
)
  .replace(/--.*$/gm, "")
  .replace(/\s+/g, " ")
  .toLowerCase();

const tables = [
  "profiles",
  "profile_photos",
  "interests",
  "user_interests",
  "user_locations",
  "user_presence",
  "likes",
  "matches",
  "messages",
  "blocks",
  "reports",
  "moderation_actions",
  "audit_logs",
] as const;

describe("0002 RLS policy migration", () => {
  it.each(tables)("enables and forces RLS on %s", (table) => {
    expect(migration).toContain(
      `alter table public.${table} enable row level security`,
    );
    expect(migration).toContain(
      `alter table public.${table} force row level security`,
    );
  });

  it("removes every direct user_locations privilege and creates no policy", () => {
    expect(migration).toContain(
      "revoke all on table public.user_locations from public, anon, authenticated",
    );
    expect(migration).not.toMatch(
      /create policy [^;]+ on public\.user_locations/,
    );
    expect(migration).not.toMatch(
      /grant [^;]+ on (?:table )?public\.user_locations/,
    );
  });

  it("does not expose sensitive mutation policies or client grants", () => {
    expect(migration).not.toMatch(
      /create policy [^;]+ for (?:insert|update|delete|all)/,
    );
    expect(migration).not.toMatch(
      /grant (?:insert|update|delete|all)[^;]+ to authenticated/,
    );
    expect(migration).not.toMatch(/grant [^;]+ to anon/);
  });

  it("requires verified app metadata and aal2 for direct admin reads", () => {
    expect(migration).toContain(
      "auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'",
    );
    expect(migration).toContain("auth.jwt() ->> 'aal', '') = 'aal2'");

    for (const table of ["reports", "moderation_actions", "audit_logs"]) {
      expect(migration).toMatch(
        new RegExp(
          `create policy [^;]+ on public\\.${table} [^;]+private\\.current_user_is_admin_mfa\\(\\)`,
        ),
      );
    }
  });

  it("checks membership, active status and blocking before reading messages", () => {
    expect(migration).toContain("match.status = 'active'");
    expect(migration).toContain(
      "private.users_are_blocked( match.user_low_id, match.user_high_id )",
    );
    expect(migration).toMatch(
      /create policy messages_select_match_member on public\.messages for select to authenticated using \(private\.can_access_active_match\(match_id\)\)/,
    );
  });

  it("does not grant profile birth dates or message anti-abuse hashes", () => {
    const profileGrant =
      migration.match(
        /grant select \(([^)]+)\) on table public\.profiles to authenticated/,
      )?.[1] ?? "";
    const messageGrant =
      migration.match(
        /grant select \(([^)]+)\) on table public\.messages to authenticated/,
      )?.[1] ?? "";

    expect(profileGrant).not.toContain("birth_date");
    expect(profileGrant).not.toContain("account_status");
    expect(messageGrant).not.toContain("content_hash");
  });
});
