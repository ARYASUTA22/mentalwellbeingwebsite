import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .min(1, "GOOGLE_GENERATIVE_AI_API_KEY is required"),
});

export type AppEnv = z.infer<typeof envSchema>;

function readProcessEnv(): Record<string, string | undefined> {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  };
}

/**
 * Strictly validates all required environment variables.
 * Throws a descriptive error if any key from .env.local is missing.
 */
export function validateEnv(): AppEnv {
  const parsed = envSchema.safeParse(readProcessEnv());
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid .env.local configuration:\n${formatted}`);
  }
  return parsed.data;
}

/**
 * Non-throwing accessor allowing graceful fallback during local builds
 * or preview environments prior to provisioning external secrets.
 */
export function getSafeEnv(): Partial<AppEnv> & {
  hasDatabase: boolean;
  hasCloudinary: boolean;
  hasGoogleAI: boolean;
} {
  const raw = readProcessEnv();
  return {
    ...raw,
    hasDatabase: Boolean(raw.DATABASE_URL && raw.DIRECT_URL),
    hasCloudinary: Boolean(
      raw.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
        raw.CLOUDINARY_API_KEY &&
        raw.CLOUDINARY_API_SECRET
    ),
    hasGoogleAI: Boolean(raw.GOOGLE_GENERATIVE_AI_API_KEY),
  };
}
