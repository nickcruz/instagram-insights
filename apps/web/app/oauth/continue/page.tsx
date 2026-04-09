import { Suspense } from "react";

import { OAuthContinueClient } from "@/components/oauth-continue-client";

export const dynamic = "force-dynamic";

type OAuthContinuePageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function OAuthContinuePage({
  searchParams,
}: OAuthContinuePageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-10">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center">
        <div className="w-full rounded-[28px] border border-[var(--border)] bg-white p-8 shadow-sm md:p-10">
          <Suspense fallback={<p className="text-sm text-[var(--muted-foreground)]">Preparing Claude sign-in…</p>}>
            <OAuthContinueClient initialReturnTo={params.returnTo ?? null} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
