// src/app/page.tsx
"use client";

import { Suspense } from "react";
import { NavigationMenu } from "@shopify/app-bridge-react";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NavigationMenu
        navigationLinks={[
          { label: "Add IP", destination: "/admin/add-ip" },
          { label: "Delete IP", destination: "/admin/delete-ip" },
          { label: "IPs", destination: "/admin/ips" },
          { label: "List IP", destination: "/admin/list-ip" },
          { label: "Logs", destination: "/admin/logs" },
        ]}
      />
    </Suspense>
  );
}
