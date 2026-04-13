import {
  getDeveloperApiKeyByPrefix,
  getMcpOAuthAccessTokenByHash,
  touchDeveloperApiKeyLastUsed,
  touchMcpOAuthAccessTokenLastUsed,
} from "@instasights/db";

import {
  getBearerToken,
  hashDeveloperApiKey,
  parseDeveloperApiKey,
} from "@/lib/developer-api-keys";
import {
  API_BEARER_SCOPE,
  hashOpaqueSecret,
  LEGACY_MCP_TOOLS_SCOPE,
} from "@/lib/oauth-shared";

export type BearerAuthSuccess = {
  ok: true;
  auth: {
    userId: string;
    authType: "developer_api_key" | "oauth_access_token";
    keyId?: string;
    keyPrefix?: string;
    keyName?: string;
    clientId?: string;
  };
};

export type BearerAuthFailure = {
  ok: false;
  status: number;
  message: string;
};

export type BearerAuthResult = BearerAuthSuccess | BearerAuthFailure;

export async function resolveBearerAuth(request: Request): Promise<BearerAuthResult> {
  const bearerToken = getBearerToken(request);

  if (!bearerToken) {
    return {
      ok: false,
      status: 401,
      message:
        "Missing bearer token. Authenticate with the Instasights CLI OAuth flow or send Authorization: Bearer <api-key>.",
    };
  }

  const parsedApiKey = parseDeveloperApiKey(bearerToken);

  if (parsedApiKey) {
    const keyRecord = await getDeveloperApiKeyByPrefix(parsedApiKey.keyPrefix);

    if (!keyRecord) {
      return {
        ok: false,
        status: 401,
        message: "Invalid API key.",
      };
    }

    if (keyRecord.revokedAt) {
      return {
        ok: false,
        status: 401,
        message: "API key has been revoked.",
      };
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt.getTime() <= Date.now()) {
      return {
        ok: false,
        status: 401,
        message: "API key has expired.",
      };
    }

    if (hashDeveloperApiKey(bearerToken) !== keyRecord.secretHash) {
      return {
        ok: false,
        status: 401,
        message: "Invalid API key.",
      };
    }

    await touchDeveloperApiKeyLastUsed(keyRecord.id);

    return {
      ok: true,
      auth: {
        userId: keyRecord.userId,
        authType: "developer_api_key",
        keyId: keyRecord.id,
        keyPrefix: keyRecord.keyPrefix,
        keyName: keyRecord.name,
      },
    };
  }

  const accessToken =
    await getMcpOAuthAccessTokenByHash(hashOpaqueSecret(bearerToken));

  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      message: "Invalid access token.",
    };
  }

  if (accessToken.token.revokedAt) {
    return {
      ok: false,
      status: 401,
      message: "Access token revoked.",
    };
  }

  if (accessToken.token.expiresAt.getTime() <= Date.now()) {
    return {
      ok: false,
      status: 401,
      message: "Access token expired.",
    };
  }

  const scopes = (accessToken.token.scope ?? "")
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);

  if (
    !scopes.includes(API_BEARER_SCOPE) &&
    !scopes.includes(LEGACY_MCP_TOOLS_SCOPE)
  ) {
    return {
      ok: false,
      status: 403,
      message:
        "Access token does not include the required Instasights API scope.",
    };
  }

  await touchMcpOAuthAccessTokenLastUsed(accessToken.token.id);

  return {
    ok: true,
    auth: {
      userId: accessToken.token.userId,
      authType: "oauth_access_token",
      clientId: accessToken.client.clientId,
    },
  };
}
