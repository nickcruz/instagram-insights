import { headers } from "next/headers";

import { getEnv } from "@/lib/env";

export async function getAppUrl() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? null;
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return (
    getEnv("APP_URL") ??
    getEnv("INSTAGRAM_APP_URL") ??
    "http://localhost:3000"
  );
}
