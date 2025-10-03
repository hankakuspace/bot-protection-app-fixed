// src/app/page.tsx
export default function Home(props: any) {
  const host =
    typeof props?.searchParams?.host === "string"
      ? props.searchParams.host
      : undefined;

  if (host) {
    return (
      <main>
        <p>Host detected ✅: {host}</p>

        {/* /test-nav へのリンク */}
        <p>
          <a href={`/test-nav?host=${host}`}>➡ サイドナビテストへ</a>
        </p>

        {/* /_nav-test へのリンク */}
        <p>
           <a href={`/nav-test?host=${host}`}>➡ Navテストページへ</a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <p>Waiting for Shopify to add host…</p>
    </main>
  );
}
