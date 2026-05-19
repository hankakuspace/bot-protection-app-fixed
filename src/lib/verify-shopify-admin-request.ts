// src/lib/verify-shopify-admin-request.ts
import crypto from "crypto";
import { NextRequest } from "next/server";

type ShopifySessionTokenPayload = {
  aud?: string | string[];
  dest?: string;
  exp?: number;
  nbf?: number;
  [key: string]: unknown;
};

type VerifyResult =
  | {
      ok: true;
      shop: string;
      payload: ShopifySessionTokenPayload;
    }
  | {
      ok: false;
      error: string;
    };

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64").toString("utf8");
}

function base64UrlToBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64");
}

function getBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || "";
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getShopFromDest(dest: string | undefined): string {
  if (!dest) return "";

  try {
    return new URL(dest).hostname.trim().toLowerCase();
  } catch {
    return "";
  }
}

function hasValidAudience(payload: ShopifySessionTokenPayload): boolean {
  const expectedAudiences = [
    process.env.SHOPIFY_API_KEY,
    process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
  ].filter(Boolean);

  if (expectedAudiences.length === 0) return false;

  const aud = payload.aud;

  if (Array.isArray(aud)) {
    return aud.some((value) => expectedAudiences.includes(value));
  }

  return typeof aud === "string" && expectedAudiences.includes(aud);
}

export function verifyShopifyAdminRequest(request: NextRequest): VerifyResult {
  const token = getBearerToken(request);
  const secret =
    process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";

  if (!token) {
    return {
      ok: false,
      error: "Missing authorization token.",
    };
  }

  if (!secret) {
    return {
      ok: false,
      error: "Missing Shopify API secret.",
    };
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return {
      ok: false,
      error: "Invalid token format.",
    };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signedContent = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedContent)
    .digest();

  const actualSignature = base64UrlToBuffer(encodedSignature);

  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return {
      ok: false,
      error: "Invalid token signature.",
    };
  }

  const payload = safeJsonParse<ShopifySessionTokenPayload>(
    base64UrlDecode(encodedPayload),
  );

  if (!payload) {
    return {
      ok: false,
      error: "Invalid token payload.",
    };
  }

  const now = Math.floor(Date.now() / 1000);

  if (typeof payload.exp === "number" && payload.exp <= now) {
    return {
      ok: false,
      error: "Token expired.",
    };
  }

  if (typeof payload.nbf === "number" && payload.nbf > now) {
    return {
      ok: false,
      error: "Token is not active yet.",
    };
  }

  if (!hasValidAudience(payload)) {
    return {
      ok: false,
      error: "Invalid token audience.",
    };
  }

  const shop = getShopFromDest(payload.dest);

  if (!shop) {
    return {
      ok: false,
      error: "Invalid token destination.",
    };
  }

  return {
    ok: true,
    shop,
    payload,
  };
}
