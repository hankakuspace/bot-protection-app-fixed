'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { isIpBlocked, blockIp, unblockIp } from '@/lib/check-ip';

type Props = {
  ip: string;
  /** 行データに blocked がある場合は渡すと初回チェックを省略 */
  initialBlocked?: boolean;
  /** ボタン操作後に親へ通知（表示中の "blocked (at log)" 同期） */
  onChange?: (blocked: boolean) => void;
};

export default function IpActions({ ip, initialBlocked, onChange }: Props) {
  const [blocked, setBlocked] = useState<boolean>(!!initialBlocked);
  const [loading, startTransition] = useTransition();
  const [initDone, setInitDone] = useState<boolean>(!!initialBlocked);

  useEffect(() => {
    if (initDone) return;
    let mounted = true;
    (async () => {
      const b = await isIpBlocked(ip);
      if (mounted) {
        setBlocked(b);
        setInitDone(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ip, initDone]);

  const handleBlock = () => {
    startTransition(async () => {
      // 楽観更新
      setBlocked(true);
      onChange?.(true);
      try {
        await blockIp(ip, 'from_logs');
      } catch (e) {
        // 失敗時は巻き戻し
        setBlocked(false);
        onChange?.(false);
        console.error(e);
      }
    });
  };

  const handleUnblock = () => {
    startTransition(async () => {
      setBlocked(false);
      onChange?.(false);
      try {
        await unblockIp(ip);
      } catch (e) {
        setBlocked(true);
        onChange?.(true);
        console.error(e);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
          blocked ? 'bg-red-100' : 'bg-green-100'
        }`}
        title={blocked ? 'このIPは現在ブロック中' : 'このIPは許可中'}
      >
        {blocked ? 'Blocked' : 'Allowed'}
      </span>

      {blocked ? (
        <button
          className="px-3 py-1 rounded-2xl shadow border disabled:opacity-50"
          onClick={handleUnblock}
          disabled={loading}
        >
          Unblock
        </button>
      ) : (
        <button
          className="px-3 py-1 rounded-2xl shadow border disabled:opacity-50"
          onClick={handleBlock}
          disabled={loading}
        >
          Block
        </button>
      )}
    </div>
  );
}
