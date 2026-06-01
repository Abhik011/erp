"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f2f1]">

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content */}
      <main
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${
          collapsed ? "ml-[72px]" : "ml-[280px]"
        }`}
      >

        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.08),transparent_35%)]" />

        {/* Page Content */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-5 md:p-6">
          {children}
        </div>

      </main>
    </div>
  );
}