"use client"

import {PropsWithChildren} from "react"
import {SWRConfig} from "swr"

import {fetcher} from "../_utils/fetcher"

export function SWRProvider({children}: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        fetcher,
      }}
    >
      {children}
    </SWRConfig>
  )
}
