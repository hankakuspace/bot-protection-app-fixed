// src/lib/logStore.ts
import { adminDb } from "@/lib/firebase";
import { isBotUserAgent } from "@/lib/check-useragent";

const LOG_COLLECTION = "access_logs";

export interface AccessLogInput {
  ip: string;
  country: string;
  allowedCountry: boolean;
  blocked: boolean;
  isAdmin: boolean;
  userAgent: string;
}

/**
 * アクセスログを保存
 */
export async function saveAccessLog({
  ip,
  country,
  allowedCountry,
  blocked,
  isAdmin,
  userAgent,
}: AccessLogInput): Promise<void> {
  await adminDb.collection(LOG_COLLECTION).add({
    ip,
    country,
    allowedCountry,
    blocked,
    isAdmin,
    userAgent,
    isBot: isBotUserAgent(userAgent), // 👈 BOT判定を追加
    timestamp: new Date(),
  });
}

/**
 * ログ一覧を取得
 */
export async function listAccessLogs(limit: number = 200) {
  const snapshot = await adminDb
    .collection(LOG_COLLECTION)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
