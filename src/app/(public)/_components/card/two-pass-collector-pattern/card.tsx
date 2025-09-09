"use client"

import {type ComponentPropsWithRef, type ReactNode, useLayoutEffect, useMemo, useRef, useState} from "react"
import {createPortal} from "react-dom"
import {twMerge} from "tailwind-merge"

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Marker bookkeeping (module-level)
 * - We attach collected data to the actual DOM node created in the *fake DOM*
 *   pass via a WeakMap (no React context).
 * - After pass #1, we walk the detached container to find the first marker of
 *   each kind and read back the React nodes/props we stashed.
 * ──────────────────────────────────────────────────────────────────────────────
 */
type SlotKind = "header" | "content" | "footer"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SlotValue = {props: Record<string, any>; children: ReactNode}

const markerData = new WeakMap<Element, {kind: SlotKind} & SlotValue>()

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Public components: CardStack + Slot markers
 * - In the "collect" portal pass, markers render *real* DOM (tiny spans) so
 *   React fully renders through any wrappers/contexts and we can scrape them.
 * - Each marker stores its {kind, props, children} into WeakMap keyed by its
 *   DOM element (no context, no prop drilling).
 * - Outside of the "collect" pass, Card itself won’t render children; so markers
 *   never hit the visible DOM in pass #2.
 * ──────────────────────────────────────────────────────────────────────────────
 */
export function CardStack({className, ...props}: ComponentPropsWithRef<"div">) {
  return <div className={twMerge(["border"], className)} {...props} />
}

export function CardHeader(props: ComponentPropsWithRef<"header">) {
  // During the collect pass, this renders into the detached container.
  return (
    <span
      data-card-slot="header"
      // ref gets the actual DOM element the portal created.
      ref={(el) => {
        if (!el) return
        // Stash original props/children for the second pass.
        markerData.set(el, {kind: "header", props, children: props.children})
      }}
    />
  )
}

export function CardContent(props: ComponentPropsWithRef<"div">) {
  return (
    <span
      data-card-slot="content"
      ref={(el) => {
        if (!el) return
        markerData.set(el, {kind: "content", props, children: props.children})
      }}
    />
  )
}

export function CardFooter(props: ComponentPropsWithRef<"footer">) {
  return (
    <span
      data-card-slot="footer"
      ref={(el) => {
        if (!el) return
        markerData.set(el, {kind: "footer", props, children: props.children})
      }}
    />
  )
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Card: authentic two-pass with a "fake DOM" (detached container + portal)
 *
 * Pass #1 ("collect"):
 *   - Make a detached container (not in the real DOM).
 *   - Portal render the *children subtree* into that container.
 *   - Markers render tiny <span data-card-slot="..."> nodes and stash their
 *     React data into WeakMap keyed by the DOM nodes.
 *
 *   Why this fixes wrapper/provider issues:
 *     React still renders through ALL wrappers/contexts to build that fake DOM,
 *     so we see markers even if deeply nested.
 *
 * Pass #2 ("render"):
 *   - Scrape the detached container for the first header/content/footer spans.
 *   - Pull React nodes/props from WeakMap.
 *   - Render the real <article> + <header>/<div>/<footer> in the visible tree.
 *
 * Notes:
 *   - We intentionally do not render arbitrary non-slot children in pass #2.
 *   - First-one-wins. No warnings. No edge cases. Educational happy-path only.
 *   - SSR: this requires a DOM to do pass #1. If `window` is undefined, we skip
 *     to an empty shell; hydration on client will perform pass #1 then #2.
 * ──────────────────────────────────────────────────────────────────────────────
 */
export function Card({className, children, ...props}: ComponentPropsWithRef<"article">) {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined"

  // Create a persistent detached container for the fake DOM.
  const fakeContainer = useMemo(() => {
    if (!isBrowser) return null
    const el = document.createElement("div")
    // Never appended to document. React can still render into it.
    return el
  }, [isBrowser])

  // Phase flip: 'collect' -> 'render'
  const [phase, setPhase] = useState<"collect" | "render">(isBrowser ? "collect" : "render")

  const collectedRef = useRef<{
    header?: SlotValue
    content?: SlotValue
    footer?: SlotValue
  }>({})

  // After the collect portal commits, scrape markers and move to render phase.
  useLayoutEffect(() => {
    if (!isBrowser) return
    if (phase !== "collect") return
    if (!fakeContainer) return

    // Find the FIRST of each marker type inside the detached container.
    // Happy path: no duplicates handling beyond "first wins".
    const headerMarker = fakeContainer.querySelector('[data-card-slot="header"]') as Element | null
    const contentMarker = fakeContainer.querySelector('[data-card-slot="content"]') as Element | null
    const footerMarker = fakeContainer.querySelector('[data-card-slot="footer"]') as Element | null

    const take = (el: Element | null): SlotValue | undefined => {
      if (!el) return undefined
      const data = markerData.get(el)
      if (!data) return undefined
      // We only need props/children for pass #2; kind is already implied by slot.
      return {props: data.props, children: data.children}
    }

    collectedRef.current.header = take(headerMarker)
    collectedRef.current.content = take(contentMarker)
    collectedRef.current.footer = take(footerMarker)

    // Flip to the real render.
    setPhase("render")
    // No cleanup needed: fakeContainer and WeakMap entries can be GC'ed later.
  }, [phase, isBrowser, fakeContainer])

  // Shared base classes (arrays are fine with your twMerge).
  const articleClassNameBase = ["bg-card text-card-foreground", "flex flex-col", "py-4 gap-4", "border"]
  const headerClassNameBase = ["flex flex-col", "gap-2 px-4"]
  const bodyClassNameBase = ["flex flex-col", "gap-2 px-4"]
  const footerClassNameBase = ["flex flex-col", "gap-2 px-4"]

  // PASS #1: render portal to fake DOM. Nothing visible yet.
  if (phase === "collect" && isBrowser && fakeContainer) {
    return createPortal(<>{children}</>, fakeContainer)
  }

  // PASS #2: render the real DOM.
  const headerEl = collectedRef.current.header
  const contentEl = collectedRef.current.content
  const footerEl = collectedRef.current.footer

  const headerNode = headerEl && (
    <header {...headerEl.props} className={twMerge(headerClassNameBase, headerEl.props?.className)}>
      {headerEl.children}
    </header>
  )

  const bodyNode = contentEl && (
    <div {...contentEl.props} className={twMerge(bodyClassNameBase, contentEl.props?.className)}>
      {contentEl.children}
    </div>
  )

  const footerNode = footerEl && (
    <footer {...footerEl.props} className={twMerge(footerClassNameBase, footerEl.props?.className)}>
      {footerEl.children}
    </footer>
  )

  return (
    <article {...props} className={twMerge(articleClassNameBase, className)}>
      {headerNode}
      {bodyNode}
      {footerNode}
    </article>
  )
}
