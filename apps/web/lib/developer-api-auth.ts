import { resolveBearerAuth } from "@/lib/bearer-auth";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Authorization",
} as const;

function createBearerChallenge(message: string, status = 401) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
      "WWW-Authenticate": 'Bearer realm="instagram-insights"',
    },
  });
}

export function createJsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function requireApiAccess(request: Request) {
  const authResult = await resolveBearerAuth(request);

  if (!authResult.ok) {
    return {
      ok: false as const,
      response: createBearerChallenge(authResult.message, authResult.status),
    };
  }

  return authResult;
}

export const requireDeveloperApiKey = requireApiAccess;
