import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const CLIENT_FILES = [
  "src/components/onboarding/onboarding-flow.tsx",
  "src/features/profiles/profile-schema.ts",
  "src/features/profiles/profile-types.ts",
];

describe("frontière des secrets photo", () => {
  it("ne référence aucun secret Cloudinary dans le code client", () => {
    const bundleInputs = CLIENT_FILES.map((file) =>
      fs.readFileSync(path.resolve(file), "utf8"),
    ).join("\n");
    expect(bundleInputs).not.toContain("CLOUDINARY_API_SECRET");
    expect(bundleInputs).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
