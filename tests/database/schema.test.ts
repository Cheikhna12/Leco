import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0001_initial_schema.sql"),
  "utf8",
);

const expectedTables = [
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

describe("migration PostgreSQL/PostGIS initiale", () => {
  it.each(expectedTables)("crée public.%s et active RLS", (table) => {
    expect(migration).toMatch(
      new RegExp(`create table public\\.${table}\\s*\\(`, "i"),
    );
    expect(migration).toMatch(
      new RegExp(
        `alter table public\\.${table} enable row level security`,
        "i",
      ),
    );
  });

  it("stocke une position PostGIS courante et indexée", () => {
    expect(migration).toMatch(
      /location extensions\.geography\(Point, 4326\) not null/i,
    );
    expect(migration).toMatch(
      /on public\.user_locations using gist \(location\)/i,
    );
    expect(migration).toMatch(/user_id uuid primary key/i);
    expect(migration).toMatch(
      /delete from public\.user_locations[\s\S]*expires_at <=/i,
    );
  });

  it("ne retourne aucune coordonnée dans la découverte", () => {
    const discoverySignature = migration.match(
      /create or replace function public\.get_nearby_profiles[\s\S]*?\)\r?\nlanguage plpgsql/i,
    )?.[0];

    expect(discoverySignature).toBeDefined();
    expect(discoverySignature).toContain("distance_band public.distance_band");
    expect(discoverySignature).not.toMatch(
      /^\s*(latitude|longitude|location|distance_m)\s+/im,
    );
    expect(migration).toMatch(
      /revoke all on table public\.user_locations from anon, authenticated/i,
    );
  });

  it("sécurise toutes les RPC security definer", () => {
    const securityDefinerFunctions = [
      "update_my_location",
      "activate_presence",
      "heartbeat_presence",
      "deactivate_presence",
      "get_nearby_profiles",
      "send_hello",
      "expire_stale_presence",
    ];

    for (const functionName of securityDefinerFunctions) {
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
          `revoke all on function public\\.${functionName}\\([\\s\\S]*?from public, anon, authenticated`,
          "i",
        ),
      );
    }
  });

  it("rend le matching atomique et applique les limites anti-harcèlement", () => {
    const sendHello = migration.match(
      /create or replace function public\.send_hello[\s\S]*?\$\$;/i,
    )?.[0];

    expect(sendHello).toBeDefined();
    expect(sendHello).toMatch(/pg_advisory_xact_lock/i);
    expect(sendHello).toMatch(/interval '1 hour'[\s\S]*>= 5/i);
    expect(sendHello).toMatch(/hello_daily_limit/i);
    expect(sendHello).toMatch(/for update/i);
    expect(sendHello).toMatch(
      /on conflict \(user_low_id, user_high_id\) do update/i,
    );
  });

  it("applique immédiatement les blocages et garde les messages", () => {
    const blockHandler = migration.match(
      /create or replace function private\.handle_block_insert[\s\S]*?\$\$;/i,
    )?.[0];
    const messageGuard = migration.match(
      /create or replace function private\.guard_message_insert[\s\S]*?\$\$;/i,
    )?.[0];

    expect(blockHandler).toMatch(/update public\.likes/i);
    expect(blockHandler).toMatch(/update public\.matches/i);
    expect(messageGuard).toMatch(/from public\.blocks/i);
    expect(messageGuard).toMatch(/v_match\.status <> 'active'/i);
    expect(migration).not.toMatch(/delete from public\.messages/i);
  });
});
