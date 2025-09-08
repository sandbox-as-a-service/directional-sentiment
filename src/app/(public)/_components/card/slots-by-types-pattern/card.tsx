import {Children, type ComponentPropsWithRef, type ReactElement, type ReactNode, isValidElement} from "react"
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

const isHeader = (node: ReactNode): node is HeaderEl => {
  return isValidElement(node) && node.type === CardHeader
}
const isContent = (node: ReactNode): node is ContentEl => {
  return isValidElement(node) && node.type === CardContent
}
const isFooter = (node: ReactNode): node is FooterEl => {
  return isValidElement(node) && node.type === CardFooter
}

export function Card({className, children, ...props}: ComponentPropsWithRef<"article">) {
  let headerEl: HeaderEl | undefined
  let contentEl: ContentEl | undefined
  let footerEl: FooterEl | undefined

  Children.forEach(children, (child) => {
    // First one of each wins. extras are ignored.
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

  const headerClassNameBase = [
    // layout
    "flex flex-col",
    // spacing
    "gap-2 px-4",
  ]

  const headerNode = headerEl && (
    <header {...headerEl.props} className={twMerge(headerClassNameBase, headerEl.props.className)} />
  )

  const bodyClassNameBase = [
    // layout
    "flex flex-col",
    // spacing
    "gap-2 px-4",
  ]

  const bodyNode = contentEl && (
    <div {...contentEl.props} className={twMerge(bodyClassNameBase, contentEl.props.className)} />
  )

  const footerClassNameBase = [
    // layout
    "flex flex-col",
    // spacing
    "gap-2 px-4",
  ]

  const footerNode = footerEl && (
    <footer {...footerEl.props} className={twMerge(footerClassNameBase, footerEl.props.className)} />
  )

  const articleClassNameBase = [
    // colors
    "bg-card text-card-foreground",
    // layout
    "flex flex-col",
    // spacing
    "py-4 gap-4",
    // shape
    "border",
  ]

  return (
    <article {...props} className={twMerge(articleClassNameBase, className)}>
      {headerNode}
      {bodyNode}
      {footerNode}
    </article>
  )
}
