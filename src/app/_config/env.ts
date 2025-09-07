import {z} from "zod"

const isGHA = process.env.GITHUB_ACTIONS === "true"

// A schema for environment variables. @see https://env.t3.gg/docs/core
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_SUPABASE_URL: isGHA ? z.url().default("") : z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: isGHA ? z.string().default("") : z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: isGHA ? z.string().default("") : z.string().min(1),
})

const raw = EnvSchema.parse(process.env)

const flags = {
  IS_DEV: raw.NODE_ENV === "development",
  IS_TEST: raw.NODE_ENV === "test",
  IS_PROD: raw.NODE_ENV === "production",
} as const

export const env = {
  ...raw,
  ...flags,
}
