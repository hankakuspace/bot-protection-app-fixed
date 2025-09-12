// src/lib/ipinfo.ts
type IpInfoResponse = {
  country?: string;
  [key: string]: any;
};

export async function getCountryFromIp(ip: string): Promise<string> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token) {
      return "UNKNOWN"; // ✅ Promise.resolve は使わない
    }

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) {
      return "UNKNOWN";
    }

    const data: IpInfoResponse = await res.json();
    return data.country ?? "UNKNOWN"; // ✅ これで string
  } catch (err) {
    console.error("ipinfo error:", err);
    return "UNKNOWN";
  }
}
