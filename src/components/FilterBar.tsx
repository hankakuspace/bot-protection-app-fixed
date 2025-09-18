'use client';
import { useState } from 'react';

export interface FilterOptions {
  country: string;
  isAdmin: boolean;
  blocked: boolean;
}

export default function FilterBar({
  countries,
  filter,
  onChange,
}: {
  countries: string[];
  filter: FilterOptions;
  onChange: (f: FilterOptions) => void;
}) {
  return (
    <div className="flex gap-4 items-center p-4 bg-gray-100 rounded">
      <div>
        <label className="mr-2 font-semibold">国:</label>
        <select
          className="border rounded px-2 py-1"
          value={filter.country}
          onChange={(e) => onChange({ ...filter, country: e.target.value })}
        >
          <option value="">すべて</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={filter.isAdmin}
          onChange={(e) => onChange({ ...filter, isAdmin: e.target.checked })}
        />
        isAdmin
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={filter.blocked}
          onChange={(e) => onChange({ ...filter, blocked: e.target.checked })}
        />
        blocked
      </label>
    </div>
  );
}
