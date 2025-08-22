export async function POST(req: Request) {
  try {
    console.log("[add-ip] API called"); // デバッグログ
    const body = await req.json().catch(() => ({}));
    console.log("[add-ip] body =", body);

    let rule = String(body.ip ?? "").trim();
    if (!rule) return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });

    rule = rule.includes("/") ? normalizeCidr(rule) : normalizeIp(rule);

    const cur = await listIps();
    if (!cur.includes(rule)) {
      cur.push(rule);
      await setIps(cur);
      console.log("[add-ip] added =", rule);
      return NextResponse.json({ ok: true, added: true, blocked: cur });
    } else {
      return NextResponse.json({ ok: true, added: false, blocked: cur });
    }
  } catch (err) {
    console.error("[add-ip] error", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
