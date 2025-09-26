// src/app/page.tsx
export default function Home(props: any) {
  // ✅ searchParams をサーバー側ログに出す
  console.log("🟢 / page.tsx searchParams:", props?.searchParams);

  const host =
    typeof props?.searchParams?.host === "string"
      ? props.searchParams.host
      : undefined;

  if (host) {
    return (
      <main>
        <p>Host detected ✅: {host}</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log("🟢 Host detected in client:", "${host}");
              // window.location.href = "/admin/dashboard?host=${host}";
              // ✅ 今はリダイレクトを止めて、hostが付くかどうかだけ確認
            `,
          }}
        />
      </main>
    );
  }

  return (
    <main>
      <p>Waiting for Shopify to add host…</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            console.log("⚠️ No host found in URL. Waiting for Shopify to add it...");
          `,
        }}
      />
    </main>
  );
}
