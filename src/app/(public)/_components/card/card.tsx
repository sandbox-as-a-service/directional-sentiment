import type {ComponentPropsWithRef} from "react"
import {twMerge} from "tailwind-merge"

// React 19+: Refs are now passed as props in function components
export function Card({className, ...props}: ComponentPropsWithRef<"article">) {
  return (
    <article
      className={twMerge("bg-card text-card-foreground flex w-fit flex-col gap-4 border py-4", className)}
      {...props}
    />
  )
}

export function CardHeader({className, ...props}: ComponentPropsWithRef<"header">) {
  return <header className={twMerge("flex flex-col gap-2 px-4", className)} {...props} />
}

export function CardContent({className, ...props}: ComponentPropsWithRef<"div">) {
  return <div className={twMerge("flex flex-col gap-2 px-4", className)} {...props} />
}

export function CardFooter({className, ...props}: ComponentPropsWithRef<"footer">) {
  return <footer className={twMerge("flex flex-col gap-2 px-4", className)} {...props} />
}
