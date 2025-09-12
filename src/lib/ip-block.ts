import { db } from "@/lib/firebase";
import admin from "firebase-admin";

export async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const doc = await db.collection("block_ips").doc(ip).get();
    return doc.exists;
  } catch (e) {
    console.error("Error checking if IP is blocked:", e);
    return false;
  }
}

export async function blockIp(ip: string, reason: string = "manual"): Promise<void> {
  try {
    await db.collection("block_ips").doc(ip).set({
      blocked: true,
      reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Error blocking IP:", e);
  }
}

export async function unblockIp(ip: string): Promise<void> {
  try {
    await db.collection("block_ips").doc(ip).delete();
  } catch (e) {
    console.error("Error unblocking IP:", e);
  }
}
