// src/lib/ipinfo.ts
export async function getCountryFromIp(ip: string): Promise<string> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token) return "UNKNOWN";

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) return "UNKNOWN";

    const data = await res.json();
    return data.country || "UNKNOWN"; // ✅ Promise.resolve は不要
  } catch (err) {
    console.error("ipinfo error:", err);
    return "UNKNOWN";
  }
}
