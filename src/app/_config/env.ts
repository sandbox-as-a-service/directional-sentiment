import {z} from "zod"

const isGHA = process.env.GITHUB_ACTIONS === "true"

// A schema for environment variables. @see https://env.t3.gg/docs/core
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: isGHA ? z.url().default("") : z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: isGHA ? z.string().default("") : z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: isGHA ? z.string().default("") : z.string().min(1),
})

export const env = EnvSchema.parse(process.env)
