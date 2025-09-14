// src/lib/check-useragent.ts

/**
 * BOT判定関数
 * - allowList: 正規クローラー（Googlebot, Bingbotなど）→ isBot = false
 * - blockPatterns: 不正クローラーやスクレイピングツール → isBot = true
 */
export function isBotUserAgent(ua: string): boolean {
  if (!ua) return false;

  // 正規クローラーの許可リスト（SEOに必要なものは弾かない）
  const allowList = [
    /googlebot/i,
    /bingbot/i,
    /yahoo/i,
    /baiduspider/i,
    /yandexbot/i,
    /duckduckbot/i,
    /slurp/i, // Yahoo
  ];

  // 不正アクセス・スクレイピング系のブロックリスト
  const blockPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /httpclient/i,
    /scrapy/i,
    /mechanize/i,
    /beautifulsoup/i,
    /php/i,
    /java/i,
    /bot/i,
    /spider/i,
    /crawler/i,
    /scanner/i,
    /nikto/i,
    /acunetix/i,
    /sqlmap/i,
  ];

  // 許可リストに一致したら BOT ではない
  if (allowList.some((p) => p.test(ua))) {
    return false;
  }

  // ブロック対象に一致したら BOT と判定
  return blockPatterns.some((p) => p.test(ua));
}
