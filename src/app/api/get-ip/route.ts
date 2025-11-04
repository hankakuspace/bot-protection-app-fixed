import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const IPINFO_TOKEN = process.env.IPINFO_TOKEN;

export async function GET(req: NextRequest) {
  try {
    // IPinfo でアクセス元情報を取得（トークン付き）
    const res = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
    const data = await res.json();

    console.log('[IPINFOレスポンス]', data);

    const ip = data.ip || 'UNKNOWN';
    const country = data.country || 'UNKNOWN';
    const allowedCountry = country === 'JP';
    const blocked = !allowedCountry;

    const adminIPs = ['123.1.27.101']; // 管理者IP
    const isAdmin = adminIPs.includes(ip);

    const userAgent = req.headers.get('user-agent') || 'unknown';

    await addDoc(collection(db, 'access_logs'), {
      ip,
      country,
      allowedCountry,
      blocked,
      isAdmin,
      userAgent,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({
      ip,
      country,
      allowedCountry,
      blocked,
      isAdmin,
    });
  } catch (error) {
    console.error('IPチェック失敗:', error);
    return NextResponse.json({ error: 'IP判定失敗' }, { status: 500 });
  }
}
