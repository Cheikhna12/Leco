import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  buildCorsHeaders,
  buildSecurityHeaders,
  isAllowedOrigin,
} from "@/lib/security";

describe("security headers", () => {
  it("builds a CSP without wildcard script or connection sources", () => {
    const policy = buildContentSecurityPolicy({
      appOrigin: "https://leco.example",
      nonce: "a-secure-base64url-nonce",
      supabaseUrl: "https://project.supabase.co",
      cloudinaryCloudName: "leco",
    });

    expect(policy).toContain(
      "script-src 'self' 'nonce-a-secure-base64url-nonce'",
    );
    expect(policy).toContain("wss://project.supabase.co");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toMatch(/script-src[^;]*\*/);
    expect(policy).not.toMatch(/connect-src[^;]*\*/);
  });

  it("adds HSTS only in production", () => {
    const developmentHeaders = buildSecurityHeaders({
      appOrigin: "http://localhost:3000",
      production: false,
    });
    const productionHeaders = buildSecurityHeaders({
      appOrigin: "https://leco.example",
      production: true,
    });

    expect(
      developmentHeaders.some(({ key }) => key === "Strict-Transport-Security"),
    ).toBe(false);
    expect(
      productionHeaders.some(({ key }) => key === "Strict-Transport-Security"),
    ).toBe(true);
  });

  it("uses exact CORS origin matching", () => {
    const allowedOrigins = ["https://leco.example"];

    expect(isAllowedOrigin("https://leco.example", allowedOrigins)).toBe(true);
    expect(
      isAllowedOrigin("https://leco.example.attacker.test", allowedOrigins),
    ).toBe(false);
    expect(buildCorsHeaders("https://attacker.test", allowedOrigins)).toEqual(
      {},
    );
    expect(
      buildCorsHeaders("https://leco.example", allowedOrigins),
    ).toMatchObject({
      "Access-Control-Allow-Origin": "https://leco.example",
      Vary: "Origin",
    });
  });
});
