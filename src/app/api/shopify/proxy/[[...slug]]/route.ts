import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return new NextResponse('[bot-protection-proxy] reached API route', {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
