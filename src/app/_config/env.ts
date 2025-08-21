import {z} from "zod"

// A schema for environment variables. @see https://env.t3.gg/docs/core
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional().default(""), // TODO: Remove .optional().default("")
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""), // TODO: Remove .optional().default("")
  USE_MEMORY: z.coerce.string().optional().default("0"),
})

export const env = EnvSchema.parse(process.env)
