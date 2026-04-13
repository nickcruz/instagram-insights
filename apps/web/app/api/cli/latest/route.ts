import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";

export async function GET() {
  const manifestUrl = getEnv("INSTASIGHTS_CLI_MANIFEST_URL");

  if (!manifestUrl) {
    return NextResponse.json(
      {
        error: "Instasights CLI manifest URL is not configured.",
      },
      { status: 404 },
    );
  }

  return NextResponse.redirect(manifestUrl);
}
