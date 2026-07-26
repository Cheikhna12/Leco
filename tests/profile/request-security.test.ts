import { readFileSync } from "node:fs";
import path from "node:path";

import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

const APP_URL = "http://127.0.0.1:3000";

function request(
  pathname: string,
  init: ConstructorParameters<typeof NextRequest>[1] = {},
) {
  return new NextRequest(`${APP_URL}${pathname}`, init);
}

describe("frontière des mutations profil", () => {
  it("refuse une origine tierce avant de lire le JSON", async () => {
    const { readJson } = await import("@/features/profiles/server/request");
    const input = request("/api/profile", {
      body: JSON.stringify({ value: "ok" }),
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
      },
      method: "PATCH",
    });

    await expect(
      readJson(input, z.object({ value: z.string() })),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("borne la taille JSON déclarée et réelle", async () => {
    const { readJson } = await import("@/features/profiles/server/request");
    const oversizedHeader = request("/api/profile", {
      body: "{}",
      headers: {
        "Content-Length": String(16 * 1024 + 1),
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    oversizedHeader.headers.set("Origin", oversizedHeader.nextUrl.origin);
    const oversizedBody = request("/api/profile", {
      body: JSON.stringify({ value: "x".repeat(16 * 1024) }),
      headers: {
        "Content-Length": "2",
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    oversizedBody.headers.set("Origin", oversizedBody.nextUrl.origin);

    await expect(readJson(oversizedHeader, z.unknown())).rejects.toMatchObject({
      status: 413,
    });
    await expect(readJson(oversizedBody, z.unknown())).rejects.toMatchObject({
      status: 413,
    });
  });

  it("exige une longueur multipart bornée", async () => {
    const { assertProfileMultipartRequest } =
      await import("@/features/profiles/server/request");
    const withoutLength = request("/api/photos", {
      headers: {
        "Content-Type": "multipart/form-data; boundary=test",
      },
      method: "POST",
    });
    withoutLength.headers.set("Origin", withoutLength.nextUrl.origin);
    const oversized = request("/api/photos", {
      headers: {
        "Content-Length": "1025",
        "Content-Type": "multipart/form-data; boundary=test",
      },
      method: "POST",
    });
    oversized.headers.set("Origin", oversized.nextUrl.origin);

    let missingLengthError: unknown;
    let oversizedError: unknown;
    try {
      assertProfileMultipartRequest(withoutLength, 1024);
    } catch (error) {
      missingLengthError = error;
    }
    try {
      assertProfileMultipartRequest(oversized, 1024);
    } catch (error) {
      oversizedError = error;
    }

    expect(missingLengthError).toMatchObject({ status: 411 });
    expect(oversizedError).toMatchObject({ status: 413 });
  });

  it("applique la protection d’origine à chaque mutation profil/photo", () => {
    const routeExpectations = new Map([
      ["src/app/api/profile/route.ts", /readJson\(request,/],
      [
        "src/app/api/profile/complete/route.ts",
        /assertProfileMutationOrigin\(request\)/,
      ],
      ["src/app/api/profile/interests/route.ts", /readJson\(request,/],
      [
        "src/app/api/photos/route.ts",
        /assertProfileMultipartRequest\(request,/,
      ],
      ["src/app/api/photos/reorder/route.ts", /readJson\(request,/],
      [
        "src/app/api/photos/[photoId]/route.ts",
        /assertProfileMutationOrigin\(request\)/,
      ],
    ]);

    for (const [relativePath, expectation] of routeExpectations) {
      const source = readFileSync(
        path.join(process.cwd(), relativePath),
        "utf8",
      );
      expect(source, relativePath).toMatch(expectation);
    }

    const uploadRoute = readFileSync(
      path.join(process.cwd(), "src/app/api/photos/route.ts"),
      "utf8",
    );
    expect(uploadRoute).toMatch(/file\.size\s*>\s*MAX_PROFILE_PHOTO_BYTES/);
  });
});
