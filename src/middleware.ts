import type {NextRequest} from "next/server"

import {withSupabase} from "@/app/_infra/edge/auth/with-supabase"
import {compose} from "@/app/_infra/edge/compose"
import {withRateLimit} from "@/app/_infra/edge/rate-limit/with-rate-limit"

export default function middleware(req: NextRequest) {
  return compose(req, [withRateLimit, withSupabase])
}

export const config = {
  runtime: "nodejs",
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - any /api/* route
     * - common asset extensions (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
