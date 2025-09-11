import {Button} from "../button/button"
import {Separator} from "../separator/separator"

export function NavLayout() {
  return (
    <header className="bg-background sticky top-0">
      <nav className="container mx-auto flex justify-end px-6 py-4">
        <Button className="rounded-none">Sign In</Button>
      </nav>
      <Separator />
      <div className="h-6" />
    </header>
  )
}
