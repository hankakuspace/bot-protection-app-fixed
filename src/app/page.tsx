// src/app/page.tsx
export default function Home(props: any) {
  const host =
    typeof props?.searchParams?.host === "string"
      ? props.searchParams.host
      : undefined;

  if (host) {
    return (
      <main>
        <p>Redirecting to dashboard…</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.location.href = "/admin/dashboard?host=${host}";
            `,
          }}
        />
      </main>
    );
  }

  return (
    <main>
      <p>Waiting for Shopify to add host…</p>
    </main>
  );
}
