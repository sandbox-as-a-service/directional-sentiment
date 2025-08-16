import {NextResponse} from "next/server"

export const fetchCache = "force-no-store"

export async function GET() {
  const body = {
    status: "ok",
    metadata: process.env,
    runtime: process.env.NEXT_RUNTIME ?? "unknown",
    node_env: process.env.NODE_ENV ?? "unknown",
    os: process.env.OS ?? "unknown",
    time: new Date().toISOString(),
  }

  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Content-Type": "application/health+json",
      "Cache-Control": "no-store",
    },
  })
}
