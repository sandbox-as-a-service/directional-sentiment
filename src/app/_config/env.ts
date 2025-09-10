import {z} from "zod"

const flags = {
  IS_DEV: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",
  IS_PROD: process.env.NODE_ENV === "production",
  IS_GHA: process.env.GITHUB_ACTIONS === "true",
} as const

// A schema for environment variables. @see https://env.t3.gg/docs/core
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: flags.IS_GHA ? z.url().default("") : z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: flags.IS_GHA ? z.string().default("") : z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: flags.IS_GHA ? z.string().default("") : z.string().min(1),
})

const raw = EnvSchema.parse(process.env)

export const env = {
  ...raw,
  ...flags,
}
