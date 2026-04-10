export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DEPRECATION_PAYLOAD = {
  error: "The hosted MCP endpoint has been deprecated.",
  status: 410,
  replacement:
    "Install the Instagram Insights skill and use the bundled CLI instead.",
  developersUrl: "/developers",
};

export async function GET(request: Request) {
  return Response.json(
    {
      ...DEPRECATION_PAYLOAD,
      requestedPath: new URL(request.url).pathname,
    },
    { status: 410 },
  );
}

export async function POST(request: Request) {
  return Response.json(
    {
      ...DEPRECATION_PAYLOAD,
      requestedPath: new URL(request.url).pathname,
    },
    { status: 410 },
  );
}

export async function DELETE(request: Request) {
  return Response.json(
    {
      ...DEPRECATION_PAYLOAD,
      requestedPath: new URL(request.url).pathname,
    },
    { status: 410 },
  );
}
