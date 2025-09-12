import type {ComponentPropsWithRef} from "react"
import {twMerge} from "tailwind-merge"

export function Skeleton({className, ...props}: ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={twMerge("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}
