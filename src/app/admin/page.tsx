"use client";

import ShopifyNavigation from "@/components/ShopifyNavigation";

export default function AdminHome() {
  return (
    <div>
      {/* Shopify左ナビに統合される */}
      <ShopifyNavigation />
      <h1 className="text-xl font-bold">管理画面トップ</h1>
    </div>
  );
}
