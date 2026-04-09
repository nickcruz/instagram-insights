import crypto from "node:crypto";

export const MCP_TOOLS_SCOPE = "mcp:tools";

export function hashOpaqueSecret(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
