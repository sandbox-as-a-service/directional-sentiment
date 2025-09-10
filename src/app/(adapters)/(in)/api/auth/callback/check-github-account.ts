import type {User} from "@supabase/supabase-js"

export async function checkGitHubAccount(user: User): Promise<boolean> {
  const username = user.user_metadata?.user_name
  if (!username) {
    console.warn("no_github_username_found_in_user_metadata")
    return false
  }

  const res = await fetch(`https://api.github.com/users/${username}`)

  if (!res.ok) {
    console.warn("failed_to_fetch_github_profile")
    return false
  }

  const account = await res.json()

  if (!account.created_at) {
    console.warn("no_created_at_found_in_github_account")
    return false
  }

  const accountAge = Date.now() - new Date(account.created_at).getTime()
  const minAge = 30 * 24 * 60 * 60 * 1000 // 30 days

  return accountAge > minAge
}
