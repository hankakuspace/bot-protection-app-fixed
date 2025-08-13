// src/app/api/shopify/proxy/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', source: 'app proxy' });
}
