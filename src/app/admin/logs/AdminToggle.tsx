'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { isAdminIp, addAdminIp, removeAdminIp } from '@/lib/admin';

type Props = {
  ip: string;
  initialIsAdmin?: boolean;
  onChange?: (isAdmin: boolean) => void;
};

export default function AdminToggle({ ip, initialIsAdmin, onChange }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean>(!!initialIsAdmin);
  const [initDone, setInitDone] = useState<boolean>(!!initialIsAdmin);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initDone) return;
    let alive = true;
    (async () => {
      const ok = await isAdminIp(ip);
      if (!alive) return;
      setIsAdmin(ok);
      setInitDone(true);
    })();
    return () => {
      alive = false;
    };
  }, [ip, initDone]);

  const makeAdmin = () => {
    startTransition(async () => {
      setIsAdmin(true);
      onChange?.(true);
      try {
        await addAdminIp(ip, 'from_logs');
      } catch (e) {
        console.error(e);
        setIsAdmin(false);
        onChange?.(false);
      }
    });
  };

  const revokeAdmin = () => {
    startTransition(async () => {
      setIsAdmin(false);
      onChange?.(false);
      try {
        await removeAdminIp(ip);
      } catch (e) {
        console.error(e);
        setIsAdmin(true);
        onChange?.(true);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
          isAdmin ? 'bg-blue-100' : 'bg-gray-100'
        }`}
        title={isAdmin ? 'このIPは管理者として登録されています' : 'このIPは一般扱いです'}
      >
        {isAdmin ? 'Admin' : 'User'}
      </span>
      {isAdmin ? (
        <button className="px-3 py-1 rounded-2xl shadow border disabled:opacity-50" onClick={revokeAdmin} disabled={pending}>
          Remove Admin
        </button>
      ) : (
        <button className="px-3 py-1 rounded-2xl shadow border disabled:opacity-50" onClick={makeAdmin} disabled={pending}>
          Make Admin
        </button>
      )}
    </div>
  );
}
