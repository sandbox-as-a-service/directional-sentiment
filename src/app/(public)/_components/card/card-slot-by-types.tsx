import React, {
  Children,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from "react"
import {twMerge} from "tailwind-merge"

export function CardStack({className, ...props}: ComponentPropsWithRef<"div">) {
  return <div className={twMerge("border", className)} {...props} />
}

export function CardHeader(props: ComponentPropsWithRef<"header">) {
  return <>{props.children}</>
}
export function CardContent(props: ComponentPropsWithRef<"div">) {
  return <>{props.children}</>
}
export function CardFooter(props: ComponentPropsWithRef<"footer">) {
  return <>{props.children}</>
}

type HeaderEl = ReactElement<ComponentPropsWithRef<"header">>
type ContentEl = ReactElement<ComponentPropsWithRef<"div">>
type FooterEl = ReactElement<ComponentPropsWithRef<"footer">>

const isHeader = (n: ReactNode): n is HeaderEl => isValidElement(n) && n.type === CardHeader
const isContent = (n: ReactNode): n is ContentEl => isValidElement(n) && n.type === CardContent
const isFooter = (n: ReactNode): n is FooterEl => isValidElement(n) && n.type === CardFooter

export function Card({className, children, ...props}: ComponentPropsWithRef<"article">) {
  let headerEl: HeaderEl | undefined
  let contentEl: ContentEl | undefined
  let footerEl: FooterEl | undefined

  Children.forEach(children, (child) => {
    // First one of each wins; extras are ignored.
    if (!headerEl && isHeader(child)) {
      headerEl = child
      return
    }
    if (!contentEl && isContent(child)) {
      contentEl = child
      return
    }
    if (!footerEl && isFooter(child)) {
      footerEl = child
      return
    }
    // strict mode: by design, ignore anything that isn’t a slot marker
  })

  const headerNode = headerEl && (
    <header {...headerEl.props} className={twMerge("flex flex-col gap-2 px-4", headerEl.props.className)} />
  )

  const bodyNode = contentEl && (
    <div {...contentEl.props} className={twMerge("flex flex-col gap-2 px-4", contentEl.props.className)} />
  )

  const footerNode = footerEl && (
    <footer {...footerEl.props} className={twMerge("flex flex-col gap-2 px-4", footerEl.props.className)} />
  )

  return (
    <article
      {...props}
      className={twMerge("bg-card text-card-foreground flex flex-col gap-4 border py-4", className)}
    >
      {headerNode}
      {bodyNode}
      {footerNode}
    </article>
  )
}
