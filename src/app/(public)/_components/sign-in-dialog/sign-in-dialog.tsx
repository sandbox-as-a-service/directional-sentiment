import * as DialogPrimitive from "@radix-ui/react-dialog"
import type {ComponentProps} from "react"

import {useAuthActions} from "../../_hooks/use-auth-actions"
import {GitHubLogo} from "../../_icons/github-logo"
import {Button} from "../button/button"
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "../dialog/dialog"

export function SignInDialog({children}: ComponentProps<typeof DialogPrimitive.Root>) {
  const {signIn} = useAuthActions()

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col gap-8 rounded-none">
        <DialogHeader>
          <DialogTitle>Sign in to your account</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" size="lg" onClick={signIn}>
            <GitHubLogo />
            Sign in with GitHub
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
