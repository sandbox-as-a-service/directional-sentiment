import {NextResponse} from "next/server"

export async function GET() {
  const body = {
    status: "ok",
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
