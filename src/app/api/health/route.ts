import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      service: "heyema-web",
      status: "ok",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
