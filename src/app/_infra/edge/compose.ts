import {type NextRequest, NextResponse} from "next/server"

// Contract: every middleware MUST return a NextResponse.
// If a middleware has nothing to change, just `return res` to pass through.
export type Middleware = (req: NextRequest, res: NextResponse) => Promise<NextResponse> | NextResponse

export async function compose(req: NextRequest, steps: Middleware[]): Promise<NextResponse> {
  const url = new URL(req.url)
  console.info("Middleware Chain Start:", url.href)
  // Start with a pass-through response bound to this request.
  // Middlewares can replace `current` (e.g., to mutate cookies) or return a terminal response.
  let current = NextResponse.next({request: req})

  for (const step of steps) {
    // Always hand the latest response to the next middleware.
    current = await step(req, current)

    // Convention: status 200 means "pass-through"; anything else is terminal.
    // e.g., 204/401/403/404/429/30x/5xx will stop the chain here.
    if (current.status !== 200) {
      console.info("Middleware Chain End:", url.href)
      return current
    }
  }

  // No middleware stopped the chain → return the final pass-through response.
  console.info("Middleware Chain End:", url.href)

  return current
}
