"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f2f1]">

      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Scrollable Content Area */}
      <main
  className={`flex-1 h-screen overflow-hidden p-6 transition-all duration-300 ${
    collapsed ? "ml-16" : "ml-64"
  }`}
>
        {children}
      </main>

    </div>
  );
}