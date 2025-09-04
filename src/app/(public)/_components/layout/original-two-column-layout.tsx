import type {ComponentPropsWithoutRef, FC} from "react"
import {twMerge} from "tailwind-merge"

/* ---------- Root ---------- */

export type TwoColumnLayoutProps = ComponentPropsWithoutRef<"div"> & {
  // when there is NO aside, make main span both tracks @lg (off => keep ~70%)
  expandMainWhenNoAside?: boolean
  // on stacked view, render aside first; reset to natural order @lg
  stackAsideFirst?: boolean
}

const containerBase = [
  // stacked by default; 2 cols @lg using 70/30 split
  "grid grid-cols-1 lg:grid lg:grid-cols-[7fr_3fr]",
  // design-locked spacing
  "gap-8 p-6",
]

const TwoColumnLayout: FC<TwoColumnLayoutProps> = (props) => {
  const {expandMainWhenNoAside = true, stackAsideFirst = false, className, ...divProps} = props

  // if NO aside, upgrade main to span both tracks @lg
  const noAsideMakesMainFull =
    expandMainWhenNoAside && "[&:not(:has([data-slot=aside]))_[data-slot=main]]:lg:col-span-2"

  // on stacked view, move aside before main; reset @lg
  const stackedAsideFirst =
    stackAsideFirst && "[&_[data-slot=aside]]:order-first lg:[&_[data-slot=aside]]:order-none"

  return (
    <div
      {...divProps}
      className={twMerge(containerBase, noAsideMakesMainFull, stackedAsideFirst, className)}
    />
  )
}

/* ---------- Main ---------- */

export type TwoColumnLayoutMainProps = ComponentPropsWithoutRef<"main">

const mainBase = [
  // default desktop span = left track (~70%)
  "lg:col-span-1",
]

const Main: FC<TwoColumnLayoutMainProps> = ({className, ...mainProps}) => {
  return <main data-slot="main" className={twMerge(mainBase, className)} {...mainProps} />
}

/* ---------- Aside ---------- */

export type TwoColumnLayoutAsideProps = ComponentPropsWithoutRef<"aside"> & {
  // e.g., "top-8" to pin under an offset while page scrolls
  stickyOffsetClassName?: string
}

const asideBase = [
  // desktop = right track
  "lg:col-span-1",
  // don't stretch vertically; sticky needs content-sized box
  "self-start",
]

const Aside: FC<TwoColumnLayoutAsideProps> = ({stickyOffsetClassName, className, ...asideProps}) => {
  // sticky keeps the sidebar visible while main scrolls; offset defines pin distance
  const sticky = stickyOffsetClassName && `sticky ${stickyOffsetClassName}`
  return <aside data-slot="aside" className={twMerge(asideBase, sticky, className)} {...asideProps} />
}

/* ---------- Compound export ---------- */

type TwoColumnLayoutCompound = FC<TwoColumnLayoutProps> & {
  Main: FC<TwoColumnLayoutMainProps>
  Aside: FC<TwoColumnLayoutAsideProps>
}

const TwoColumnLayoutCompound: TwoColumnLayoutCompound = Object.assign(TwoColumnLayout, {
  Main,
  Aside,
})

TwoColumnLayoutCompound.displayName = "TwoColumnLayout"
Main.displayName = "TwoColumnLayout.Main"
Aside.displayName = "TwoColumnLayout.Aside"

export {TwoColumnLayoutCompound as TwoColumnLayout}

/**
 * Option A: Controlled by the layout (props + CSS on the root)
 *
 * What it is
 *
 * The root layout owns cross-child behavior like stacked ordering or "expand when no aside."
 * Consumers flip behavior with small, well-named props (e.g., stackAsideFirst, expandMainWhenNoAside).
 * Implementation uses container-scoped selectors and Tailwind utilities (:has, order-first lg:order-none, etc.).
 *
 * Pros
 *
 * Consistency. Everyone gets the same behavior from the same API. Lower variance across the codebase.
 * First paint correctness. Root CSS decides without waiting on render order or context.
 * Low cognitive load. Callsite stays declarative: stackAsideFirst says exactly what will happen.
 * A11y safer by default. You can centralize how visual order changes vs source order and document it once.
 * Refactor-friendly. If the grid template or breakpoints change, you fix it in one place.
 *
 * Cons
 *
 * API surface. Adds a few props to the root. You must keep them minimal and well named.
 * Hidden magic. Container selectors can feel "spooky" if the team is not used to :has or Tailwind arbitrary variants.
 * Edge overrides. Consumers still need escape hatches via className for the 1% cases.
 *
 * When to prefer
 *
 * Internal design system with locked spacing and breakpoints.
 * Multiple teams consuming the layout.
 * You want predictable behavior and fewer per-screen decisions.
 *
 * Option B: Let the consumer handle it (manual DOM order or ad-hoc classes)
 *
 * What it is
 *
 * Consumers reorder children in JSX or add their own utility classes to achieve stack-first and other behaviors.
 *
 * // Reorder DOM manually when stacked is desired
 * <TwoColumnLayout>
 *   <TwoColumnLayout.Aside>aside</TwoColumnLayout.Aside>
 *   <TwoColumnLayout.Main>main</TwoColumnLayout.Main>
 * </TwoColumnLayout>
 *
 * // Or sprinkle classes ad-hoc
 * <TwoColumnLayout>
 *   <TwoColumnLayout.Main className="lg:col-span-2">main</TwoColumnLayout.Main>
 * </TwoColumnLayout>
 *
 * Pros
 *
 * Maximum flexibility. No waiting on the layout API for new tweaks.
 * Fewer root props. Keeps the component surface tiny.
 * Explicitness at callsite. You see the literal JSX order or classes right there.
 *
 * Cons
 *
 * Inconsistency creep. Every screen can do it slightly differently. Harder to audit or change globally.
 * A11y risk. Reordering DOM changes reading and tab order, which might not match visual order. Using CSS order-* flips visual order but not DOM order, which can also confuse screen readers if used thoughtlessly.
 * Higher error rate. Easy to forget self-start for sticky, or to miss resetting order at the breakpoint, or to mismatch spans when the aside is removed.
 * Maintenance tax. When design changes, you touch many callsites.
 * Onboarding cost. New devs must relearn the patterns for each page.
 *
 * When to prefer
 *
 * One-off prototypes or very custom screens where global rules do not fit.
 *
 * Very small teams where one person controls most screens.
 */
