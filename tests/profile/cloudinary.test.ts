import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("suppression Cloudinary côté serveur", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("signe une suppression serveur sans envoyer le secret", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "leco-test");
    vi.stubEnv("CLOUDINARY_API_KEY", "public-api-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "server-secret-never-exposed");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"result":"ok"}', { status: 200 }));
    const { deleteProfilePhoto } = await import("@/lib/cloudinary/server");

    await deleteProfilePhoto("leco/profiles/user/photo");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/image/destroy");
    expect(String(options?.body)).toContain(
      "public_id=leco%2Fprofiles%2Fuser%2Fphoto",
    );
    expect(String(options?.body)).toContain("signature=");
    expect(String(options?.body)).not.toContain("server-secret-never-exposed");
  });
});
