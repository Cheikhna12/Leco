import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/0003_wave1_security_hardening.sql",
  ),
  "utf8",
);

const clientRpcs = [
  "update_my_profile",
  "send_message",
  "block_user",
  "create_report",
  "review_report",
  "get_nearby_profiles_filtered",
] as const;

describe("0003 Wave 1 security hardening", () => {
  it.each(clientRpcs)(
    "secures public.%s and only grants authenticated execution",
    (functionName) => {
      const functionBody = migration.match(
        new RegExp(
          `create or replace function public\\.${functionName}[\\s\\S]*?\\$\\$;`,
          "i",
        ),
      )?.[0];

      expect(functionBody, functionName).toBeDefined();
      expect(functionBody, functionName).toMatch(/security definer/i);
      expect(functionBody, functionName).toMatch(/set search_path = ''/i);
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${functionName}[\\s\\S]*?from public, anon, authenticated`,
          "i",
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `grant execute on function public\\.${functionName}[\\s\\S]*?to authenticated`,
          "i",
        ),
      );
    },
  );

  it("derives every client identity from auth.uid", () => {
    for (const functionName of [
      "update_my_profile",
      "send_message",
      "block_user",
      "create_report",
      "review_report",
    ]) {
      const functionBody = migration.match(
        new RegExp(
          `create or replace function public\\.${functionName}[\\s\\S]*?\\$\\$;`,
          "i",
        ),
      )?.[0];

      expect(functionBody, functionName).toMatch(/auth\.uid\(\)/i);
      expect(functionBody, functionName).not.toMatch(/p_(?:user|sender)_id/i);
    }
  });

  it("requires aal2 and scoped app_metadata permissions for moderators", () => {
    expect(migration).toContain("coalesce(auth.jwt() ->> 'aal', '') = 'aal2'");
    expect(migration).toContain("auth.jwt() -> 'app_metadata' ->> 'role'");
    expect(migration).toContain("'reports:write'");
    expect(migration).toContain("'moderation:read'");
  });

  it("keeps the atomic rate limiter private and service-role-only", () => {
    expect(migration).toMatch(/create table private\.rate_limit_buckets/i);
    expect(migration).toMatch(
      /on conflict \(key_hash, window_started_at\) do update/i,
    );
    expect(migration).toMatch(
      /grant execute on function public\.consume_rate_limit[\s\S]*?to service_role/i,
    );
    expect(migration).not.toMatch(
      /grant execute on function public\.consume_rate_limit[\s\S]*?to authenticated/i,
    );
  });
});
