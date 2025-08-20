import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
  const { ip, type } = await req.json();

  if (!ip || !type) {
    return NextResponse.json({ message: "IPとtypeは必須です" }, { status: 400 });
  }

  const target = type === "admin" ? "admin_ips" : "blocked_ips";

  await setDoc(doc(db, target, ip), {
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ message: `${ip} を ${target} に追加しました` });
}
