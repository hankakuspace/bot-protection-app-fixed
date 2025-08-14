// Blob バックエンド版 ipStore
import { list, put } from "@vercel/blob";

const PATH = "config/blocked-ips.json";

// Blob 上の JSON を取得（なければ空配列）
export async function listIps(): Promise<string[]> {
  // ファイルの存在確認＆URL取得
  const { blobs } = await list({ prefix: PATH });
  const blob = blobs.find(b => b.pathname === PATH);
  if (!blob) return [];
  try {
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? (json as string[]) : [];
  } catch {
    return [];
  }
}

// 配列まるごと保存（上書き）
export async function setIps(rules: string[]): Promise<void> {
  await put(PATH, JSON.stringify(rules), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,    // 固定パスで管理
    allowOverwrite: true,      // 上書き保存を許可
  });
}
