import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';

// 管理者判定 & ブロック判定を行う関数
export async function checkIp(ip: string) {
  const blockedRef = doc(db, 'blocked_ips', ip);
  const blockedSnap = await getDoc(blockedRef);
  const blocked = blockedSnap.exists();

  const adminRef = collection(db, 'admin_ips');
  const adminSnap = await getDocs(adminRef);
  const adminIps = adminSnap.docs.map((doc) => doc.id);
  const isAdmin = adminIps.includes(ip);

  return {
    ip,
    blocked,
    isAdmin,
  };
}

// --- 追加: isIpBlocked / blockIp / unblockIp ---

// 単純にブロックされているか確認
export async function isIpBlocked(ip: string): Promise<boolean> {
  const ref = doc(db, 'blocked_ips', ip);
  const snap = await getDoc(ref);
  return snap.exists();
}

// IP をブロックリストに追加
export async function blockIp(ip: string): Promise<void> {
  const ref = doc(db, 'blocked_ips', ip);
  await setDoc(ref, { createdAt: new Date().toISOString() });
}

// IP をブロックリストから解除
export async function unblockIp(ip: string): Promise<void> {
  const ref = doc(db, 'blocked_ips', ip);
  await deleteDoc(ref);
}
