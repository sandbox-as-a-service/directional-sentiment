import {Slot} from "@radix-ui/react-slot"
import {type VariantProps, cva} from "class-variance-authority"
import type {ComponentPropsWithRef} from "react"
import {twMerge} from "tailwind-merge"

const buttonBase = [
  // Layout
  "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
  // Shape + type
  "rounded-md text-sm font-medium",
  // Behavior
  "cursor-pointer transition-all",
  "disabled:pointer-events-none disabled:opacity-50",
  // Icon normalization: make embedded SVGs play nice
  "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  // Focus & a11y
  "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  // Invalid state styling
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
]

const buttonVariants = cva(buttonBase, {
  variants: {
    variant: {
      default: [
        "bg-primary", // semantic brand background
        "text-primary-foreground", // tokenized text for contrast
        "shadow-xs", // extra-small elevation
        "hover:bg-primary/90", // 90% opacity on hover (subtle visual shift)
      ],
      destructive: [
        "bg-destructive", // danger background
        "text-white", // readable on destructive bg
        "shadow-xs", // extra-small elevation
        "hover:bg-destructive/90", // 90% opacity on hover
        "focus-visible:ring-destructive/20", // themed focus ring (light)
        "dark:focus-visible:ring-destructive/40", // stronger ring in dark
        "dark:bg-destructive/60", // tone down bg in dark (60% opacity)
      ],
      outline: [
        "border", // visible border (uses --color-border)
        "bg-background", // fill with page background
        "shadow-xs", // extra-small elevation
        "hover:bg-accent", // hover fill to accent
        "hover:text-accent-foreground", // ensure contrast on accent
        "dark:bg-input/30", // subtle fill in dark (input token @ 30% opacity)
        "dark:border-input", // border matches input token in dark
        "dark:hover:bg-input/50", // stronger dark hover (50% opacity)
      ],
      secondary: [
        "bg-secondary", // secondary background
        "text-secondary-foreground", // readable text on secondary
        "shadow-xs", // extra-small elevation
        "hover:bg-secondary/80", // 80% opacity hover
      ],
      ghost: [
        "hover:bg-accent", // hover fills with accent (no base bg)
        "hover:text-accent-foreground", // readable text on accent hover
        "dark:hover:bg-accent/50", // lighter accent in dark (50% opacity)
      ],
      link: [
        "text-primary", // primary-colored text
        "underline-offset-4", // more legible underline spacing
        "hover:underline", // show underline on hover
      ],
    },
    size: {
      default: [
        "h-9", // 36px height
        "px-4 py-2", // standard horizontal/vertical padding
        "has-[>svg]:px-3", // reduce horizontal padding if a direct child <svg> exists (parent :has selector)
      ],
      sm: [
        "h-8", // 32px height
        "rounded-md", // keep radius at small size
        "gap-1.5", // tighter icon/text gap
        "px-3", // smaller horizontal padding
        "has-[>svg]:px-2.5", // even tighter when leading icon is present
      ],
      lg: [
        "h-10", // 40px height
        "rounded-md", // preserve radius
        "px-6", // larger horizontal padding
        "has-[>svg]:px-4", // reduce when a direct child <svg> exists
      ],
      icon: [
        "size-9", // square: width/height = 36px
      ],
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp className={twMerge(buttonVariants({variant, size, className}))} {...props} />
}
