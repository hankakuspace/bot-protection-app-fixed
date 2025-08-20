// src/lib/check-ip.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export async function checkIp(ip: string) {
  // 🔹 ブラックリスト確認
  const blockedRef = doc(db, 'blocked_ips', ip);
  const blockedSnap = await getDoc(blockedRef);
  const blocked = blockedSnap.exists();

  // 🔹 管理者リスト確認
  const adminRef = collection(db, 'admin_ips');
  const adminSnap = await getDocs(adminRef);
  const adminIps = adminSnap.docs.map((doc) => doc.id); // ドキュメントIDをIPとして利用
  const isAdmin = adminIps.includes(ip);

  return {
    ip,
    blocked,
    isAdmin,
  };
}
