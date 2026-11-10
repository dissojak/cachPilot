import { z } from "zod";

const baseSchema = z.object({
  // Required to run the app; optional so `next build` and CI work without a database.
  DATABASE_URL: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//)
    .optional(),
  // Required in production (validated below); optional otherwise.
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV === "production" && (!env.AUTH_SECRET || env.AUTH_SECRET.length < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["AUTH_SECRET"],
      message: "AUTH_SECRET is required in production",
    });
  }
});

export type ServerEnv = z.infer<typeof envSchema>;

type PartialEnv = Partial<z.infer<typeof baseSchema>>;

/** Applies the schema defaults to a shape-only (SKIP_ENV_VALIDATION) parse. */
function withDefaults(partial: PartialEnv): ServerEnv {
  return {
    ...partial,
    NODE_ENV: partial.NODE_ENV ?? "development",
  };
}

let cached: ServerEnv | null = null;

/** Parses and caches the server environment once per process. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  // CI and E2E run without full configuration; validate shape only.
  const source = process.env.SKIP_ENV_VALIDATION === "true"
    ? withDefaults(baseSchema.partial().parse(process.env))
    : envSchema.parse(process.env);
  cached = source;
  return source;
}
