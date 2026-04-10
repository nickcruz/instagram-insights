import crypto from "node:crypto";

export const API_BEARER_SCOPE = "instagram-insights:api";
export const LEGACY_MCP_TOOLS_SCOPE = "mcp:tools";

export function hashOpaqueSecret(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
