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

  // ✅ host が無いときは Shopify Admin が exitiframe から再ロードしてくれるのを待つ
  return (
    <main>
      <p>Loading app… waiting for Shopify host parameter…</p>
    </main>
  );
}
