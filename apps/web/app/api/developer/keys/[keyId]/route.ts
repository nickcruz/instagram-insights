import { revokeDeveloperApiKey } from "@instasights/db";

import { auth } from "@/lib/auth";
import { createJsonResponse } from "@/lib/developer-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    keyId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    return createJsonResponse(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { keyId } = await context.params;
  const revokedKey = await revokeDeveloperApiKey({
    keyId,
    userId,
  });

  if (!revokedKey) {
    return createJsonResponse({ error: "API key not found." }, { status: 404 });
  }

  return createJsonResponse({
    keyId: revokedKey.id,
    revokedAt: revokedKey.revokedAt?.toISOString() ?? null,
  });
}
