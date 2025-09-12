import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function getClientIp(req: NextRequest): Promise<string> {
  const headers = req.headers;
  const cf = headers.get("cf-connecting-ip");
  const shopify = headers.get("x-shopify-client-ip");
  const xff = headers.get("x-forwarded-for")?.split(",")[0].trim();
  const xri = headers.get("x-real-ip");

  let ip =
    cf ||
    shopify ||
    xff ||
    xri ||
    requestIp.getClientIp(req as any) ||
    "UNKNOWN";

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}
