import type {NextRequest} from "next/server"

import {withSupabase} from "@/app/_infra/edge/auth/with-supabase"
import {compose} from "@/app/_infra/edge/compose"
import {withCors} from "@/app/_infra/edge/cors/with-cors"
import {withRateLimit} from "@/app/_infra/edge/rate-limit/with-rate-limit"

export default function middleware(req: NextRequest) {
  return compose(req, [withCors, withRateLimit, withSupabase])
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
