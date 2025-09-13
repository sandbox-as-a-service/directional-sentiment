import {useAuthActions} from "../../_hooks/use-auth-actions"
import {useGetUser} from "../../_hooks/use-get-user"
import {getInitials} from "../../_utils/get-initials"
import {Avatar} from "../avatar/avatar"
import {Button} from "../button/button"
import {Separator} from "../separator/separator"
import {SignInDialog} from "../sign-in-dialog/sign-in-dialog"
import {Skeleton} from "../skeleton/skeleton"
import {TypographyH1} from "../typography/typography"

export function HeaderLayout() {
  const {data, isLoading} = useGetUser()
  const {signOut} = useAuthActions()

  return (
    <header className="bg-background sticky top-0 z-10">
      <nav className="container mx-auto flex justify-between px-4 py-4 xl:px-8">
        <TypographyH1 className="ml-6 text-3xl lg:ml-0">Opinion Registry</TypographyH1>
        {isLoading && <Skeleton className="h-9 w-34 rounded-none" />}
        {!isLoading && data && (
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-none" onClick={signOut}>
              Sign Out
            </Button>
            <Avatar>
              <Avatar.Image src={data.user_metadata.avatar_url} />
              <Avatar.Fallback>{getInitials(data.user_metadata.full_name)}</Avatar.Fallback>
            </Avatar>
          </div>
        )}
        {!isLoading && !data && (
          <SignInDialog>
            <Button className="rounded-none">Sign In</Button>
          </SignInDialog>
        )}
      </nav>
      <Separator />
      <div className="h-6.5" />
    </header>
  )
}
