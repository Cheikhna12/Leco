import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      service: "leco-web",
      status: "ok",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
