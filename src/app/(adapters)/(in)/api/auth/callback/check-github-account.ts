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

  const accountCreated = new Date(account.created_at)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  return accountCreated < threeMonthsAgo
}
