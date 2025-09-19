// src/lib/check-useragent.ts

/**
 * BOT判定関数
 * - allowList: 正規クローラー（Googlebot, Bingbot, SNSクローラーなど）→ isBot = false
 * - blockPatterns: 不正クローラーやスクレイピングツール → isBot = true
 */
export function isBotUserAgent(ua: string): boolean {
  if (!ua) return false;

  // ✅ 正規クローラーの許可リスト
  const allowList = [
    /googlebot/i,
    /adsbot-google/i,
    /mediapartners-google/i, // AdSense
    /bingbot/i,
    /yahoo/i,
    /baiduspider/i,
    /yandexbot/i,
    /duckduckbot/i,
    /slurp/i, // Yahoo
    /applebot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /slackbot/i,
    /discordbot/i,
    /linkedinbot/i,
    /pinterestbot/i,
  ];

  // 🚫 不正アクセス・スクレイピング系のブロックリスト
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

  // 許可リストに一致したら BOT ではない（= allow）
  if (allowList.some((p) => p.test(ua))) {
    return false;
  }

  // ブロック対象に一致したら BOT と判定
  return blockPatterns.some((p) => p.test(ua));
}
