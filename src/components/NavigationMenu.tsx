// src/components/NavigationMenu.tsx
"use client";

import { NavigationMenu } from "@shopify/app-bridge-react";

export default function AppNavigationMenu() {
  return (
    <NavigationMenu
      navigationLinks={[
        { label: "Add IP", destination: "/admin/add-ip" },
        { label: "Admin IPs", destination: "/admin/admin-ips" },
        { label: "Blocklist", destination: "/admin/blocklist" },
        { label: "List IP", destination: "/admin/list-ip" },
        { label: "Logs", destination: "/admin/logs" },
      ]}
    />
  );
}
