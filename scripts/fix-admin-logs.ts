// scripts/fix-admin-logs.ts
import { adminDb } from "@/lib/firebase";
import { isAdminIp } from "@/lib/check-ip";

async function fixAdminLogs() {
  console.log("=== 過去ログの isAdmin 修正開始 ===");

  const logsSnap = await adminDb.collection("access_logs").get();
  let fixedCount = 0;

  for (const doc of logsSnap.docs) {
    const data = doc.data();
    const ip = data.ip as string;
    const isAdmin = data.isAdmin;

    if (!ip) continue;

    // 既にtrueならスキップ
    if (isAdmin === true) continue;

    // 判定し直し
    const check = await isAdminIp(ip);
    if (check) {
      await doc.ref.update({ isAdmin: true });
      console.log(`✅ 修正: ${ip} → isAdmin=true`);
      fixedCount++;
    }
  }

  console.log(`=== 修正完了: ${fixedCount} 件更新しました ===`);
}

fixAdminLogs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("エラー:", err);
    process.exit(1);
  });
