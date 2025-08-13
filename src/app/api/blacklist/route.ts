import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { revalidateTag } from 'next/cache';

const COLL = 'ip_blacklist';

export async function GET() {
  const snap = await getDocs(collection(db, COLL));
  const ips = snap.docs.map(d => ({ ip: d.id, ...(d.data() as any) }));
  return NextResponse.json({ ips });
}

export async function POST(req: Request) {
  const { ip, reason } = await req.json();
  if (!ip) return NextResponse.json({ ok: false, error: 'ip required' }, { status: 400 });

  await setDoc(doc(db, COLL, ip), {
    reason: reason ?? 'manual',
    createdAt: Date.now(),
  });
  revalidateTag('ipRules'); // ← ここで即時反映
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { ip } = await req.json();
  if (!ip) return NextResponse.json({ ok: false, error: 'ip required' }, { status: 400 });

  await deleteDoc(doc(db, COLL, ip));
  revalidateTag('ipRules'); // ← ここで即時反映
  return NextResponse.json({ ok: true });
}
