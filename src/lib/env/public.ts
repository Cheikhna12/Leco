import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CAPTCHA_PROVIDER: z
    .enum(["turnstile", "hcaptcha", "test"])
    .optional(),
  NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().min(1).optional(),
});

function optionalEnv(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: optionalEnv(process.env.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_SUPABASE_URL: optionalEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  NEXT_PUBLIC_CAPTCHA_PROVIDER: optionalEnv(
    process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER,
  ),
  NEXT_PUBLIC_CAPTCHA_SITE_KEY: optionalEnv(
    process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
  ),
});
