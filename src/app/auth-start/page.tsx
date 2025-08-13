// src/app/auth-start/page.tsx
import AuthStartClient from "./AuthStartClient";

// 事前レンダリングさせず毎回動的評価（デバッグ/診断ページのため）
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Next 15 では searchParams が Promise で来る場合があるので両対応
type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function Page(props: { searchParams: SearchParams }) {
  const sp =
    typeof (props.searchParams as any)?.then === "function"
      ? await (props.searchParams as Promise<Record<string, string | string[] | undefined>>)
      : (props.searchParams as Record<string, string | string[] | undefined>);

  const shop = (sp.shop as string) ?? "";

  // サーバ環境変数（Vercel: SHOPIFY_API_KEY / SHOPIFY_SCOPES）をそのまま読む
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";
  const scopes = process.env.SHOPIFY_SCOPES ?? "";

  return <AuthStartClient shop={shop} apiKey={apiKey} scopes={scopes} />;
}
