// src/app/page.tsx
export default function Home(props: any) {
  const searchParams = props?.searchParams;
  console.log("🟢 / page.tsx searchParams:", searchParams);

  const host =
    typeof searchParams?.host === "string"
      ? searchParams.host
      : undefined;

  return (
    <main>
      <h1>Bot Guard MAN</h1>

      <p>Host detected: {host ? `✅ ${host}` : "❌ 取得できませんでした"}</p>

      {host && (
        <p>
          <a href={`/test-nav?host=${host}`}>➡ サイドナビテストへ</a>
        </p>
      )}

      {!host && (
        <p>
          ⚠️ host が URL に含まれていません。
          Admin から開かないと host は渡されません。
        </p>
      )}
    </main>
  );
}
