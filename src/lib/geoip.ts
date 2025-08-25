// src/lib/geoip.ts
export async function getCountry(ip: string): Promise<string> {
  try {
    const token = process.env.IPINFO_TOKEN; // .env にセット
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`);
    if (!res.ok) return "UNKNOWN";
    const data = await res.json();
    return data.country || "UNKNOWN";
  } catch (err) {
    console.error("geoip error:", err);
    return "UNKNOWN";
  }
}
