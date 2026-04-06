"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Handshake,
  UserRound,
  Files,
  FolderKanban,
  LogOut,
  ScrollText,
  Building2,
  CreditCard,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useCompany } from "@/components/CompanyProvider";

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const { companies, companyId, selectCompany } = useCompany();

  // ✅ Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved && typeof setCollapsed === "function") {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed.toString());
  }, [collapsed]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#e8e4de] border-r border-gray-200 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"
        }`}
    >

      {/* HEADER */}
      <div className="sidebar-header flex items-center justify-between px-3 py-3">

        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="logo-icon">N</div>
            <h1 className="logo-text text-sm font-semibold">
              Nexora
            </h1>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white transition"
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>
      </div>

      {/* COMPANY SELECT */}
      {!collapsed && (
        <div className="px-3 mt-2 space-y-1">
          <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500">
            <Building2 size={12} />
            Company
          </label>
          <select
            value={companyId || ""}
            onChange={(e) => selectCompany(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800"
          >
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name?.trim()
                  ? c.name
                  : `Company ${c._id.slice(-6)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="flex-1 mt-3 px-2 space-y-1">

        <GroupLabel collapsed={collapsed} label="Main" />

        <NavItem collapsed={collapsed} href="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/leads" icon={<UserPlus size={16} />} label="Leads" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/customers" icon={<Users size={16} />} label="Customers" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/deals" icon={<Handshake size={16} />} label="Deals" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/invoices" icon={<Files size={16} />} label="Invoices" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/quotes" icon={<ScrollText size={16} />} label="Quotes" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/reports" icon={<FileText size={16} />} label="Reports" pathname={pathname} />

        <GroupLabel collapsed={collapsed} label="System" />

        <NavItem collapsed={collapsed} href="/projects" icon={<FolderKanban size={16} />} label="Projects" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/billing" icon={<CreditCard size={16} />} label="Billing" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/pricing" icon={<Sparkles size={16} />} label="Pricing" pathname={pathname} />

      </nav>

      {/* FOOTER */}
      <div className="border-t border-gray-200 pt-2 px-2 mb-2">

        <GroupLabel collapsed={collapsed} label="Account" />

        <NavItem collapsed={collapsed} href="/agency" icon={<UserRound size={16} />} label="Profile" pathname={pathname} />
        <NavItem collapsed={collapsed} href="/logout" icon={<LogOut size={16} />} label="Logout" pathname={pathname} />

      </div>

    </aside>
  );
}

/* NAV ITEM */
function NavItem({ collapsed, href, icon, label, pathname }: any) {
  const active = pathname.startsWith(href);

  return (
    <div className="relative group">

      <Link
        href={href}
        className={`flex items-center ${collapsed ? "justify-center" : "gap-2 px-2"
          } py-2 rounded-lg text-sm transition-all duration-150 hover:scale-[1.02] ${active
            ? "bg-white text-black shadow-sm border border-gray-200 ring-1 ring-gray-100"
            : "text-gray-600 hover:bg-[#f9f9f7]"
          }`}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>

      {/* TOOLTIP */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50">
          {label}
        </div>
      )}
    </div>
  );
}

/* GROUP LABEL */
function GroupLabel({ collapsed, label }: any) {
  if (collapsed) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          {label.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className="text-[10px] uppercase tracking-wide text-gray-500 px-2 mt-2 mb-1">
      {label}
    </div>
  );
}