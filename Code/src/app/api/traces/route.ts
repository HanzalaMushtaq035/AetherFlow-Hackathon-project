export const dynamic = "force-static";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "traces",
    phase: "foundation"
  });
}

export async function POST() {
  return NextResponse.json({
    status: "ok",
    service: "traces",
    phase: "foundation"
  });
}
