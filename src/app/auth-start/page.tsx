// src/app/auth-start/page.tsx
import AuthStartClient from "./AuthStartClient";

// 毎回動的評価（診断ページのため）
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function Page({
  searchParams,
}: {
  // Next 15: searchParams は Promise で来る
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const shop = (sp.shop as string) ?? "";

  // サーバ環境変数をここで取得してクライアントに渡す
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";
  const scopes = process.env.SHOPIFY_SCOPES ?? "";

  return <AuthStartClient shop={shop} apiKey={apiKey} scopes={scopes} />;
}
