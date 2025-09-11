import {useGetUser} from "../../_hooks/use-get-user"
import {getInitials} from "../../_utils/get-initials"
import {Avatar, AvatarFallback, AvatarImage} from "../avatar/avatar"
import {Button} from "../button/button"
import {Separator} from "../separator/separator"

export function NavLayout() {
  const {data, isLoading} = useGetUser()

  async function onSignOut() {
    const res = await fetch("/api/auth/sign-out", {method: "POST"})

    if (res.redirected) {
      // Follow the redirect manually
      window.location.href = res.url
    }
  }

  async function onSignIn() {
    const returnTo = encodeURIComponent(window.location.pathname)
    window.location.href = `/api/auth/sign-in?returnTo=${returnTo}`
  }

  return (
    <header className="bg-background sticky top-0">
      <nav className="container mx-auto flex justify-end px-6 py-4">
        {isLoading && (
          <Button variant="outline" className="rounded-none">
            Loading
          </Button>
        )}
        {!isLoading && data && (
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-none" onClick={onSignOut}>
              Sign Out
            </Button>
            <Avatar>
              <AvatarImage src={data.user_metadata.avatar_url} />
              <AvatarFallback>{getInitials(data.user_metadata.full_name)}</AvatarFallback>
            </Avatar>
          </div>
        )}
        {!isLoading && !data && (
          <Button className="rounded-none" onClick={onSignIn}>
            Sign In
          </Button>
        )}
      </nav>
      <Separator />
      <div className="h-6" />
    </header>
  )
}
