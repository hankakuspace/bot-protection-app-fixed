import { describe, it, expect } from 'vitest';
import { canonicalizeForSignature, verifyAppProxySignature } from '@/lib/shopifyProxy';
import crypto from 'crypto';

const secret = 'shpss_test_secret';

function sign(urlString: string, sharedSecret: string) {
  const canonical = canonicalizeForSignature(urlString);
  const sig = crypto.createHmac('sha256', sharedSecret).update(canonical).digest('hex');
  const url = new URL(urlString);
  url.searchParams.set('signature', sig);
  return url.toString();
}

describe('Shopify App Proxy signature', () => {
  it('verifies a correct signature', () => {
    const base = 'https://example.com/api/shopify/proxy/echo';
    const url = new URL(base);
    url.searchParams.set('shop', 'ruhra-store.myshopify.com');
    url.searchParams.set('path_prefix', '/apps/bpp-20250814');
    url.searchParams.set('timestamp', '1710000000');
    url.searchParams.set('echo', '1');

    const signed = sign(url.toString(), secret);
    expect(verifyAppProxySignature(signed, secret)).toBe(true);
  });

  it('rejects when signature missing', () => {
    const u = 'https://example.com/api/shopify/proxy/echo?shop=a&timestamp=1';
    expect(verifyAppProxySignature(u, secret)).toBe(false);
  });

  it('rejects when secret is wrong', () => {
    const base = 'https://example.com/api/shopify/proxy/echo?shop=a&timestamp=1';
    const signed = sign(base, secret);
    expect(verifyAppProxySignature(signed, 'wrong')).toBe(false);
  });
});
