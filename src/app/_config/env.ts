import {z} from "zod"

// A schema for environment variables. @see https://env.t3.gg/docs/core
const isGitHubActions = process.env.GITHUB_ACTIONS === "true"

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: isGitHubActions ? z.url().default("") : z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: isGitHubActions ? z.string().default("") : z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: isGitHubActions ? z.string().default("") : z.string().min(1),
})

export const env = EnvSchema.parse(process.env)
