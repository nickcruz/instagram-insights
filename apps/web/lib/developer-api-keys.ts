import crypto from "node:crypto";

const API_KEY_PREFIX = "ii";

export type GeneratedDeveloperApiKey = {
  apiKey: string;
  keyPrefix: string;
  secretHash: string;
};

export function hashDeveloperApiKey(apiKey: string) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export function generateDeveloperApiKey(): GeneratedDeveloperApiKey {
  const tokenId = crypto.randomBytes(6).toString("hex");
  const secret = crypto.randomBytes(24).toString("base64url");
  const keyPrefix = `${API_KEY_PREFIX}_${tokenId}`;
  const apiKey = `${keyPrefix}.${secret}`;

  return {
    apiKey,
    keyPrefix,
    secretHash: hashDeveloperApiKey(apiKey),
  };
}

export function parseDeveloperApiKey(apiKey: string) {
  const separatorIndex = apiKey.indexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const keyPrefix = apiKey.slice(0, separatorIndex);
  const secret = apiKey.slice(separatorIndex + 1);

  if (!keyPrefix.startsWith(`${API_KEY_PREFIX}_`) || !secret) {
    return null;
  }

  return {
    keyPrefix,
    secret,
  };
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ", 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}
