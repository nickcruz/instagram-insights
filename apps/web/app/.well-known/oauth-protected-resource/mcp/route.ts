export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(
    {
      error: "The MCP protected resource metadata has been deprecated.",
      status: 410,
      replacement:
        "Use the Instagram Insights skill and bundled CLI OAuth flow instead.",
      requestedPath: new URL(request.url).pathname,
      developersUrl: "/developers",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
