// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Shopify 管理画面からアプリをクリックしたときは必ず /admin/logs に飛ばす
  redirect("/admin/logs");
}
