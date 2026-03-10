import { adminDb } from "./firebase-admin";

export async function isIpBlocked(ip: string): Promise<boolean> {
  const snapshot = await adminDb
    .collection("blocked_ips")
    .where("ip", "==", ip)
    .limit(1)
    .get();

  return !snapshot.empty;
}
