// src/app/blocked/page.tsx
import { getBlockedPageSettings } from "@/lib/blocked-page-settings";

type BlockedPageProps = {
  searchParams?: Promise<{
    shop?: string | string[];
  }>;
};

function normalizeShop(value: string | string[] | undefined): string {
  const shop = Array.isArray(value) ? value[0] : value;

  return (shop || "be-search.biz").trim().toLowerCase();
}

export default async function BlockedPage({ searchParams }: BlockedPageProps) {
  const resolvedSearchParams = await searchParams;
  const shop = normalizeShop(resolvedSearchParams?.shop);
  const settings = await getBlockedPageSettings(shop);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-4 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
            Access Denied
          </div>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
            {settings.title}
          </h1>

          <p className="whitespace-pre-line text-base leading-7 text-gray-700">
            {settings.message}
          </p>
        </div>
      </div>
    </main>
  );
}
