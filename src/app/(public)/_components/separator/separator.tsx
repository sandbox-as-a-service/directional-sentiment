import * as SeparatorPrimitive from "@radix-ui/react-separator"
import type {ComponentProps} from "react"
import {twMerge} from "tailwind-merge"

export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
  const classNameBase = [
    "bg-border", // Use theme border color
    "shrink-0", // Prevent flexbox shrinking
    "data-[orientation=horizontal]:h-px", // 1px height when horizontal
    "data-[orientation=horizontal]:w-full", // Full width when horizontal
    "data-[orientation=vertical]:h-full", // Full height when vertical
    "data-[orientation=vertical]:w-px", // 1px width when vertical
  ]

  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={twMerge(classNameBase, className)}
      {...props}
    />
  )
}
