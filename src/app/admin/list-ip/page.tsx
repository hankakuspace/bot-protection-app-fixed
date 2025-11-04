'use client';

import { useEffect, useState } from 'react';

export default function ListIpPage() {
  const [ips, setIps] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/ip')
      .then((res) => res.json())
      .then((data) => setIps(data.ips));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>登録済みIP一覧</h2>
      <ul>
        {ips.map((ip, i) => (
          <li key={i}>{ip}</li>
        ))}
      </ul>
    </div>
  );
}
