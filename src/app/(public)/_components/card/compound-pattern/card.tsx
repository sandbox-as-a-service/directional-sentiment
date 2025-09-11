import type {ComponentPropsWithRef} from "react"
import {twMerge} from "tailwind-merge"

export function Card({className, ...props}: ComponentPropsWithRef<"article">) {
  const classNameBase = [
    // colors
    "bg-card text-card-foreground",
    // layout
    "flex flex-col",
    // spacing
    "py-4 gap-4",
    // shape
    "border",
  ]

  return <article className={twMerge(classNameBase, className)} {...props} />
}

function CardHeader({className, ...props}: ComponentPropsWithRef<"header">) {
  const classNameBase = [
    // layout
    "flex flex-col",
    // spacing
    "gap-2 px-4",
  ]

  return <header className={twMerge(classNameBase, className)} {...props} />
}

function CardContent({className, ...props}: ComponentPropsWithRef<"div">) {
  const classNameBase = [
    // layout
    "flex flex-col",
    // spacing
    "gap-2 px-4",
  ]

  return <div className={twMerge(classNameBase, className)} {...props} />
}

function CardFooter({className, ...props}: ComponentPropsWithRef<"footer">) {
  const classNameBase = [
    // layout
    "flex flex-col",
    // spacing
    "gap-2 px-4",
  ]

  return <footer className={twMerge(classNameBase, className)} {...props} />
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter
