import {Slot} from "@radix-ui/react-slot"
import {type VariantProps, cva} from "class-variance-authority"
import type {ComponentPropsWithRef} from "react"
import {twMerge} from "tailwind-merge"

const badgeBase = [
  // Layout
  "inline-flex items-center justify-center gap-1 w-fit whitespace-nowrap shrink-0",
  // Shape + type
  "rounded-md border px-2 py-0.5 text-xs font-medium",
  // Behavior
  "transition-[color,box-shadow] overflow-hidden",
  // Icon normalization: make embedded SVGs play nice
  "[&>svg]:size-3 [&>svg]:pointer-events-none",
  // Focus & a11y
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  // Invalid state styling
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
]

const badgeVariants = cva(badgeBase, {
  variants: {
    variant: {
      default: [
        "border-transparent", // no visible border
        "bg-primary", // semantic brand background
        "text-primary-foreground", // tokenized text for contrast
        "[a&]:hover:bg-primary/90", // 90% opacity on hover when used as link
      ],
      secondary: [
        "border-transparent", // no visible border
        "bg-secondary", // secondary background
        "text-secondary-foreground", // readable text on secondary
        "[a&]:hover:bg-secondary/90", // 90% opacity on hover when used as link
      ],
      destructive: [
        "border-transparent", // no visible border
        "bg-destructive", // danger background
        "text-white", // readable on destructive bg
        "[a&]:hover:bg-destructive/90", // 90% opacity on hover when used as link
        "focus-visible:ring-destructive/20", // themed focus ring (light)
        "dark:focus-visible:ring-destructive/40", // stronger ring in dark
        "dark:bg-destructive/60", // tone down bg in dark (60% opacity)
      ],
      outline: [
        "text-foreground", // default text color
        "[a&]:hover:bg-accent", // hover fill to accent when used as link
        "[a&]:hover:text-accent-foreground", // ensure contrast on accent hover
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

type BadgeProps = ComponentPropsWithRef<"button"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }

export function Badge({className, variant, asChild = false, ...props}: BadgeProps) {
  const Component = asChild ? Slot : "span"

  return <Component data-slot="badge" className={twMerge(badgeVariants({variant}), className)} {...props} />
}
