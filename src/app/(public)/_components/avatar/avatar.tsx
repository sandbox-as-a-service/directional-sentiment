"use client"

import * as AvatarPrimitive from "@radix-ui/react-avatar"
import type {ComponentProps} from "react"
import {twMerge} from "tailwind-merge"

export function Avatar({className, ...props}: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={twMerge("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
}

function AvatarImage({className, ...props}: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={twMerge("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({className, ...props}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={twMerge("bg-muted flex size-full items-center justify-center rounded-full", className)}
      {...props}
    />
  )
}

Avatar.Image = AvatarImage
Avatar.Fallback = AvatarFallback
