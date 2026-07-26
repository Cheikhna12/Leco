import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DB_URL: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  SMS_PROVIDER: z.enum(["supabase", "test"]).optional(),
  DEVELOPMENT_OTP_CODE: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  RATE_LIMIT_HMAC_SECRET: z.string().min(32).optional(),
  CAPTCHA_PROVIDER: z.enum(["turnstile", "hcaptcha", "test"]).optional(),
  CAPTCHA_SECRET_KEY: z.string().min(1).optional(),
});

export const serverEnv = serverEnvSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  SMS_PROVIDER: process.env.SMS_PROVIDER,
  DEVELOPMENT_OTP_CODE: process.env.DEVELOPMENT_OTP_CODE,
  RATE_LIMIT_HMAC_SECRET: process.env.RATE_LIMIT_HMAC_SECRET,
  CAPTCHA_PROVIDER: process.env.CAPTCHA_PROVIDER,
  CAPTCHA_SECRET_KEY: process.env.CAPTCHA_SECRET_KEY,
});
