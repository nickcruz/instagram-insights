import {
  upsertInstagramAccount,
} from "@instagram-insights/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  clearInstagramLinkCookie,
  INSTAGRAM_STATE_COOKIE,
} from "@/lib/instagram-link";
import {
  exchangeInstagramCode,
  fetchInstagramProfile,
  isInstagramConfigured,
} from "@/lib/instagram-oauth";
import { getPostHogClient } from "@/lib/posthog-server";

function buildAuthCompleteUrl(
  request: Request,
  status: string,
  options?: {
    message?: string;
    username?: string | null;
  },
) {
  const target = new URL("/auth/complete", request.url);
  target.searchParams.set("status", status);

  if (options?.message) {
    target.searchParams.set("message", options.message);
  }

  if (options?.username) {
    target.searchParams.set("username", options.username);
  }

  return target;
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    return NextResponse.redirect(buildAuthCompleteUrl(request, "auth-required"), {
      status: 302,
    });
  }

  if (!isInstagramConfigured()) {
    return NextResponse.redirect(
      buildAuthCompleteUrl(request, "config-error"),
      {
        status: 302,
      },
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(INSTAGRAM_STATE_COOKIE)?.value;

  if (error) {
    getPostHogClient().capture({
      distinctId: userId,
      event: "instagram_link_failed",
      properties: { reason: "oauth_error", error },
    });
    const response = NextResponse.redirect(
      buildAuthCompleteUrl(request, "error", { message: error }),
      { status: 302 },
    );
    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    getPostHogClient().capture({
      distinctId: userId,
      event: "instagram_link_failed",
      properties: { reason: "state_mismatch" },
    });
    const response = NextResponse.redirect(
      buildAuthCompleteUrl(request, "state-error"),
      { status: 302 },
    );
    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    clearInstagramLinkCookie(response.cookies);
    return response;
  }

  try {
    const tokenPayload = await exchangeInstagramCode(code);
    const profile = await fetchInstagramProfile(tokenPayload.accessToken);
    await upsertInstagramAccount({
      userId,
      instagramUserId:
        profile.instagramUserId || tokenPayload.instagramUserId || "",
      username: profile.username,
      accessToken: tokenPayload.accessToken,
      graphApiVersion: tokenPayload.graphApiVersion,
      authAppUrl: tokenPayload.authAppUrl,
      tokenIssuedAt: new Date(tokenPayload.issuedAt ?? new Date().toISOString()),
      linkedAt: new Date(),
      rawProfile: profile.rawProfile,
    });
    getPostHogClient().capture({
      distinctId: userId,
      event: "instagram_linked",
      properties: {
        instagram_username: profile.username,
        instagram_user_id: profile.instagramUserId || tokenPayload.instagramUserId || "",
      },
    });
    const response = NextResponse.redirect(
      buildAuthCompleteUrl(request, "linked", {
        username: profile.username,
      }),
      { status: 302 },
    );

    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    clearInstagramLinkCookie(response.cookies);

    return response;
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Instagram OAuth failed.";
    getPostHogClient().capture({
      distinctId: userId,
      event: "instagram_link_failed",
      properties: { reason: "exchange_error", error: message },
    });
    const response = NextResponse.redirect(
      buildAuthCompleteUrl(request, "error", { message }),
      { status: 302 },
    );

    response.cookies.delete(INSTAGRAM_STATE_COOKIE);
    clearInstagramLinkCookie(response.cookies);

    return response;
  }
}
