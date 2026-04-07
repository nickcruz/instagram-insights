import {
  getDeveloperApiKeyByPrefix,
  touchDeveloperApiKeyLastUsed,
} from "@instagram-insights/db";

import {
  getBearerToken,
  hashDeveloperApiKey,
  parseDeveloperApiKey,
} from "@/lib/developer-api-keys";

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

export async function requireDeveloperApiKey(request: Request) {
  const apiKey = getBearerToken(request);

  if (!apiKey) {
    return {
      ok: false as const,
      response: createBearerChallenge(
        "Missing bearer token. Create a personal API key in the dashboard and send it as Authorization: Bearer <token>.",
      ),
    };
  }

  const parsedKey = parseDeveloperApiKey(apiKey);

  if (!parsedKey) {
    return {
      ok: false as const,
      response: createBearerChallenge("Malformed API key."),
    };
  }

  const keyRecord = await getDeveloperApiKeyByPrefix(parsedKey.keyPrefix);

  if (!keyRecord) {
    return {
      ok: false as const,
      response: createBearerChallenge("Invalid API key."),
    };
  }

  if (keyRecord.revokedAt) {
    return {
      ok: false as const,
      response: createBearerChallenge("API key has been revoked."),
    };
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt.getTime() <= Date.now()) {
    return {
      ok: false as const,
      response: createBearerChallenge("API key has expired."),
    };
  }

  if (hashDeveloperApiKey(apiKey) !== keyRecord.secretHash) {
    return {
      ok: false as const,
      response: createBearerChallenge("Invalid API key."),
    };
  }

  await touchDeveloperApiKeyLastUsed(keyRecord.id);

  return {
    ok: true as const,
    auth: {
      userId: keyRecord.userId,
      keyId: keyRecord.id,
      keyPrefix: keyRecord.keyPrefix,
      keyName: keyRecord.name,
    },
  };
}
