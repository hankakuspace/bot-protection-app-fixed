export async function GET() {
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const secret = process.env.SHOPIFY_APP_SECRET || "";
  const appUrl = process.env.SHOPIFY_APP_URL || "";
  return new Response(JSON.stringify({
    ok: !!(apiKey && secret && appUrl),
    has: {
      SHOPIFY_API_KEY: !!apiKey,
      SHOPIFY_APP_SECRET: !!secret,
      SHOPIFY_APP_URL: !!appUrl
    }
  }), { headers: { "content-type": "application/json" } });
}
