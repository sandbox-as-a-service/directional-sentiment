import type {Middleware} from "@/app/_infra/edge/compose"

export const withRateLimit: Middleware = async (_req, res) => {
  try {
    // ... call Upstash here ...
    // if too many:
    // return NextResponse.json({ message: "Too many requests" }, { status: 429 });

    return res // allowed -> pass-through
  } catch (err) {
    // Fail-open for resilience
    console.error("[withRateLimit] error:", err)
    return res

    // OR fail-closed:
    // return NextResponse.json({ message: "Rate limiter unavailable" }, { status: 503 });
  }
}
