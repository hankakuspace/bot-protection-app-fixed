'use client';

import { useState } from 'react';

export default function AddIpPage() {
  const [ip, setIp] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    if (res.ok) {
      setMessage(`登録しました: ${ip}`);
      setIp('');
    } else {
      setMessage('登録に失敗しました');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>IPアドレス登録</h2>
      <input
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="例: 111.222.333.444"
        style={{ marginRight: 10 }}
      />
      <button onClick={handleSubmit}>登録</button>
      <p>{message}</p>
    </div>
  );
}
