import {NextResponse} from "next/server"

export const fetchCache = "force-no-store"

export async function GET() {
  const body = {
    status: "ok",
    runtime: process.env.NEXT_RUNTIME ?? "unknown",
    node_env: process.env.NODE_ENV ?? "unknown",
    vercel_env: process.env.VERCEL_ENV ?? "unknown",
    vercel_branch_url: process.env.VERCEL_BRANCH_URL ?? "unknown",
    vercel_project_production_url: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "unknown",
    vercel_url: process.env.VERCEL_URL ?? "unknown",
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
