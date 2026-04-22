import { NextRequest, NextResponse } from "next/server"

function makeJsonp(callback: string, payload: unknown) {
  const safeCallback = callback.replace(/[^\w.$]/g, "")
  return `${safeCallback}(${JSON.stringify(payload)});`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params
  const callback = request.nextUrl.searchParams.get("__callback__")

  const payload = {
    ok: true,
    action,
    handledBy: "next-local-dev",
    timestamp: Date.now(),
  }

  if (callback) {
    return new NextResponse(makeJsonp(callback, payload), {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  }

  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } })
}
