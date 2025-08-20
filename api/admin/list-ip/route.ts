// src/app/api/admin/list-ip/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  const blockedSnap = await getDocs(collection(db, "blocked_ips"));
  const adminSnap = await getDocs(collection(db, "admin_ips"));

  const blocked = blockedSnap.docs.map((doc) => ({
    ip: doc.id,
    ...doc.data(),
  }));

  const admins = adminSnap.docs.map((doc) => ({
    ip: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ blocked, admins });
}
