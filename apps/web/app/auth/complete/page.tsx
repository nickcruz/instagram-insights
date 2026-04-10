import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCompletePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    username?: string;
  }>;
};

function getStatusCopy(
  status: string | undefined,
  message: string | undefined,
  username: string | undefined,
) {
  if (status === "linked") {
    return {
      title: "Instagram connected",
      description:
        "The browser handoff completed successfully. You can close this page and return to the Instagram Insights skill or CLI.",
      connectedUsername: username ? `@${username}` : null,
    };
  }

  if (status === "config-error") {
    return {
      title: "Configuration missing",
      description:
        "Instagram OAuth is not configured correctly on the hosted app. Check the developers page and environment variables.",
      connectedUsername: null,
    };
  }

  if (status === "state-error") {
    return {
      title: "Link verification failed",
      description:
        "The Instagram OAuth state could not be verified. Start the CLI or skill link flow again, then retry the browser handoff.",
      connectedUsername: null,
    };
  }

  if (status === "auth-required") {
    return {
      title: "Sign-in required",
      description:
        "Sign in with Google on the Instagram Insights handoff page first, then retry the CLI or skill flow.",
      connectedUsername: null,
    };
  }

  return {
    title: "Instagram handoff error",
    description: message ?? "The Instagram handoff did not complete successfully.",
    connectedUsername: null,
  };
}

export default async function AuthCompletePage({
  searchParams,
}: AuthCompletePageProps) {
  const params = await searchParams;
  const copy = getStatusCopy(params.status, params.message, params.username);
  const isLinked = params.status === "linked";

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-10">
      <div className="mx-auto max-w-2xl">
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {copy.connectedUsername ? (
              <div className="rounded-lg border bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                Connected account:{" "}
                <span className="font-medium text-neutral-950">
                  {copy.connectedUsername}
                </span>
              </div>
            ) : null}

            {isLinked ? (
              <p className="text-sm text-neutral-600">
                You can close this page now.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/api/login">Retry Instagram connect</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/developers">Open developers page</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
