import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const serverSecretNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "CLOUDINARY_API_SECRET",
  "SMS_PROVIDER_API_KEY",
] as const;

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }

    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

describe("server secret boundary", () => {
  const sourceFiles = collectSourceFiles(sourceRoot);

  it("never uses a public-prefixed server secret", () => {
    const violations = sourceFiles.flatMap((path) => {
      const content = readFileSync(path, "utf8");
      return serverSecretNames
        .filter((name) => content.includes(`NEXT_PUBLIC_${name}`))
        .map((name) => `${relative(sourceRoot, path)}: NEXT_PUBLIC_${name}`);
    });

    expect(violations).toEqual([]);
  });

  it("does not reference server env or secret names from client modules", () => {
    const violations = sourceFiles.flatMap((path) => {
      const content = readFileSync(path, "utf8");
      const isClientModule = /^\s*["']use client["'];/m.test(content);

      if (!isClientModule) {
        return [];
      }

      const importsServerEnv =
        /from\s+["'][^"']*(?:env\/server|server-env)["']/.test(content);
      const mentionedSecrets = serverSecretNames.filter((name) =>
        content.includes(name),
      );

      return importsServerEnv || mentionedSecrets.length > 0
        ? [
            `${relative(sourceRoot, path)}: ${mentionedSecrets.join(", ") || "server env import"}`,
          ]
        : [];
    });

    expect(violations).toEqual([]);
  });
});
