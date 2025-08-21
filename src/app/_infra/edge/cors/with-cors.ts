import {type NextRequest, NextResponse} from "next/server"

import type {Middleware} from "@/app/_infra/edge/compose"

// Configure to taste
const allowedOrigins: (string | RegExp)[] = [
  "https://acme.com",
  "https://my-app.org",
  // Example: allow subdomains
  /^https:\/\/.+\.my-app\.org$/,

  // Dev convenience (optional):
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]

const ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
const EXPOSE_HEADERS = "Content-Length, X-Request-Id"
const MAX_AGE_SECONDS = "600" // cache the preflight for 10 minutes
const ALLOW_CREDENTIALS = true // needed if you use Supabase auth cookies cross-site

const isAllowedOrigin = (origin: string | null): origin is string =>
  !!origin && allowedOrigins.some((o) => (typeof o === "string" ? o === origin : o.test(origin)))

const appendVary = (existing: string | null, value: string) =>
  existing ? (existing.includes(value) ? existing : `${existing}, ${value}`) : value

export const withCors: Middleware = async (req: NextRequest, res: NextResponse) => {
  console.info("Running withCors Middleware")

  // (Optional) only CORS-protect your API routes
  const {pathname} = new URL(req.url)
  if (!pathname.startsWith("/api/")) return res

  const origin = req.headers.get("origin")
  const allowed = isAllowedOrigin(origin)

  // --- Handle preflight (terminal) ---
  if (req.method === "OPTIONS") {
    const headers = new Headers()

    // If you echo requested headers/methods, you avoid mismatches
    const reqHeaders = req.headers.get("access-control-request-headers") ?? "Content-Type, Authorization"
    const reqMethod = req.headers.get("access-control-request-method") ?? ALLOW_METHODS

    if (allowed) {
      headers.set("Access-Control-Allow-Origin", origin!)
      headers.set("Vary", appendVary(null, "Origin"))
      if (ALLOW_CREDENTIALS) headers.set("Access-Control-Allow-Credentials", "true")
    }

    headers.set("Access-Control-Allow-Methods", reqMethod)
    headers.set("Access-Control-Allow-Headers", reqHeaders)
    headers.set("Access-Control-Max-Age", MAX_AGE_SECONDS)

    // 204 = No Content → chain stops (status !== 200)
    return new NextResponse(null, {status: 204, headers})
  }

  // --- Handle actual requests (pass-through) ---
  if (allowed) {
    res.headers.set("Access-Control-Allow-Origin", origin!)
    res.headers.set("Vary", appendVary(res.headers.get("Vary"), "Origin"))
    if (ALLOW_CREDENTIALS) res.headers.set("Access-Control-Allow-Credentials", "true")
  }

  // Method/header allowances (harmless to include on actual response)
  res.headers.set("Access-Control-Allow-Methods", ALLOW_METHODS)
  // If you prefer to be permissive, you can mirror from request as above,
  // but a static allow-list is also fine:
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.headers.set("Access-Control-Expose-Headers", EXPOSE_HEADERS)

  return res
}
