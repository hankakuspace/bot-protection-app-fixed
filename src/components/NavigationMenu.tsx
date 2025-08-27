// src/components/NavigationMenu.tsx
"use client";

import { NavigationMenu } from "@shopify/app-bridge-react";

export default function AppNavigationMenu() {
  return (
    <NavigationMenu
      navigationLinks={[
        { label: "Add IP", destination: "/apps/bpp-20250814-final01/admin/add-ip" },
        { label: "Admin IPs", destination: "/apps/bpp-20250814-final01/admin/admin-ips" },
        { label: "Blocklist", destination: "/apps/bpp-20250814-final01/admin/blocklist" },
        { label: "List IP", destination: "/apps/bpp-20250814-final01/admin/list-ip" },
        { label: "Logs", destination: "/apps/bpp-20250814-final01/admin/logs" },
      ]}
    />
  );
}
