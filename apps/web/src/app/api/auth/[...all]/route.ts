export const dynamic = "force-dynamic";
async function handle(request: Request) {
  if (!process.env.BETTER_AUTH_SECRET || !process.env.DATABASE_URL) {
    return Response.json({ error: "Accounts are unavailable right now. Your saved prompts are still in this browser." }, { status: 503 });
  }
  const [{ auth }, { toNextJsHandler }] = await Promise.all([
    import("@/lib/auth"), import("better-auth/next-js"),
  ]);
  const handlers = toNextJsHandler(auth);
  return request.method === "GET" ? handlers.GET(request) : handlers.POST(request);
}
export const GET = handle;
export const POST = handle;
