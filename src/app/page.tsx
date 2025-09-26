// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home(props: any) {
  const host =
    typeof props?.searchParams?.host === "string"
      ? props.searchParams.host
      : undefined;

  // ✅ host があるときだけ dashboard にリダイレクト
  if (host) {
    redirect(`/admin/dashboard?host=${host}`);
  }

  // ✅ host がない場合 → exitiframe を経由して再ロードさせる
  return (
    <main>
      <p>Loading app…</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (window.top === window.self) {
              window.location.href = "/api/auth?redirected=1";
            }
          `,
        }}
      />
    </main>
  );
}
