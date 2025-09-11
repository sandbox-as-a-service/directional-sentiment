import type {User} from "@supabase/supabase-js"

import type {Database} from "./types"

// Base OAuth metadata fields common across providers
type BaseOAuthMetadata = {
  iss?: string
  sub?: string
  email?: string
  email_verified?: boolean
  phone_verified?: boolean
}

// GitHub-specific metadata
export type GitHubUserMetadata = BaseOAuthMetadata & {
  name?: string
  full_name?: string
  user_name?: string
  avatar_url?: string
  provider_id?: string
  preferred_username?: string
}

// Google-specific metadata (for future use)
export type GoogleUserMetadata = BaseOAuthMetadata & {
  given_name?: string
  family_name?: string
  picture?: string
  locale?: string
  hd?: string // hosted domain
}

// Twitter/X-specific metadata (for future use)
export type TwitterUserMetadata = BaseOAuthMetadata & {
  screen_name?: string
  name?: string
  profile_image_url?: string
  followers_count?: number
  verified?: boolean
}

// Union type for all possible OAuth metadata
export type OAuthUserMetadata = GitHubUserMetadata | GoogleUserMetadata | TwitterUserMetadata

// Extended User type with strongly typed user_metadata
export type UserExtended<T extends OAuthUserMetadata = OAuthUserMetadata> = Omit<User, "user_metadata"> & {
  user_metadata: T
}

// Convenience types for specific providers
export type GitHubUser = UserExtended<GitHubUserMetadata>
export type GoogleUser = UserExtended<GoogleUserMetadata>
export type TwitterUser = UserExtended<TwitterUserMetadata>

type PollOption = {optionId: string; label: string}
type VoteBreakdownItem = {optionId: string; label: string; count: number; pct: number}

export type GetPollSummariesRow = {
  poll_id: string
  slug: string
  question: string
  status: Database["public"]["Enums"]["poll_status"]
  category: string | null
  opened_at: string
  created_at: string
  options: Array<PollOption>
  vote_total: number
  vote_latest_at: string | null
  below_quorum: boolean
  vote_breakdown: Array<VoteBreakdownItem>
}

// Override just the RPC signature while keeping the rest of the generated types.
export type DatabaseExtended = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Omit<Database["public"]["Functions"], "get_poll_summaries"> & {
      get_poll_summaries: {
        Args: {poll_ids: string[]; quorum_threshold: number}
        Returns: Array<GetPollSummariesRow>
      }
    }
  }
}
