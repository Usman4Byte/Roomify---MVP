import type { Route } from "./+types/well-known.$";

// Handles `/.well-known/*` probes (e.g. Chrome DevTools) without 404 spam in logs.
export async function loader({ request }: Route.LoaderArgs) {
  const path = new URL(request.url).pathname;
  if (
    path === "/.well-known/appspecific/com.chrome.devtools.json" ||
    path.endsWith(".json")
  ) {
    return Response.json({});
  }
  return new Response(null, { status: 204 });
}

export default function WellKnownFallback() {
  return null;
}
