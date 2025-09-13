import type {ComponentPropsWithRef} from "react"
import {twMerge} from "tailwind-merge"

export function TypographyH1({className, ...props}: ComponentPropsWithRef<"h1">) {
  return (
    <h1
      className={twMerge(
        "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  )
}
