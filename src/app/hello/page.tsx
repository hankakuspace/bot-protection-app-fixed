// src/app/hello/page.tsx
export default function Page() {
  const shop = 'ruhra-store.myshopify.com';
  return (
    <main style={{fontFamily:'system-ui', padding:'32px'}}>
      <h1>Install Hello 👋</h1>
      <ol>
        <li>
          <a href={`/api/auth-start?shop=${shop}`} target="_blank" rel="noreferrer">
            1) /api/auth-start を GET（中身をJSONで確認）
          </a>
        </li>
        <li>
          <form action={`/api/auth-start`} method="post">
            <input type="hidden" name="shop" value={shop} />
            <button type="submit" style={{padding:'8px 16px'}}>2) OAuth を開始（POST）</button>
          </form>
        </li>
      </ol>
    </main>
  );
}
