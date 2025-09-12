export function useAuthActions() {
  const signIn = () => {
    const returnTo = encodeURIComponent(window.location.pathname)
    window.location.href = `/api/auth/sign-in?returnTo=${returnTo}`
  }

  const signOut = async () => {
    const res = await fetch("/api/auth/sign-out", {method: "POST"})
    if (res.redirected) window.location.href = res.url
  }

  return {signIn, signOut}
}
