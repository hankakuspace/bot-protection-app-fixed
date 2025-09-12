// src/lib/ipinfo.ts
type IpInfoResponse = {
  country?: string;
  [key: string]: any;
};

export async function getCountryFromIp(ip: string): Promise<any> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token) return "UNKNOWN";

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) return "UNKNOWN";

    const data: IpInfoResponse = await res.json();
    return data.country ?? "UNKNOWN"; // ✅ string を返すが any 扱い
  } catch (err) {
    console.error("ipinfo error:", err);
    return "UNKNOWN";
  }
}
