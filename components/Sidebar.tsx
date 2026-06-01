"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { companyTenureFromCreatedAt } from "@/lib/tenure";

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
  MessageSquare,
  UserCog,
} from "lucide-react";

import { useCompany, canManageUsers } from "@/components/CompanyProvider";
import { COMPANY_NAME, PRODUCT_NAME, PRODUCT_SHORT } from "@/lib/brand";
import { canAccessPath } from "@/lib/navAccess";
import { useAuth } from "@clerk/nextjs";
import { performAppSignOut } from "@/lib/signOut";

type NavDef = { href: string; label: string; icon: React.ReactNode };

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const { companies, companyId, selectCompany, workspaceUser, workspaceReady } =
    useCompany();
  const [, setTenureTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTenureTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const companyTenure = useMemo(
    () =>
      workspaceUser?.companyTenure ??
      companyTenureFromCreatedAt(workspaceUser?.createdAt),
    [workspaceUser?.companyTenure, workspaceUser?.createdAt]
  );
  const { signOut, isLoaded: authLoaded } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const role = workspaceUser?.role;
  const roleForNav = workspaceReady ? role : undefined;

  const mainNav = useMemo<NavDef[]>(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { href: "/leads", label: "Leads", icon: <UserPlus size={16} /> },
      { href: "/chat", label: "Chat", icon: <MessageSquare size={16} /> },
      { href: "/customers", label: "Customers", icon: <Users size={16} /> },
      { href: "/deals", label: "Deals", icon: <Handshake size={16} /> },
      { href: "/invoices", label: "Invoices", icon: <Files size={16} /> },
      { href: "/quotes", label: "Quotes", icon: <ScrollText size={16} /> },
      { href: "/reports", label: "Reports", icon: <FileText size={16} /> },
    ],
    []
  );

  const systemNav = useMemo<NavDef[]>(
    () => [
      { href: "/projects", label: "Projects", icon: <FolderKanban size={16} /> },
      { href: "/agency", label: "Agency", icon: <Building2 size={16} /> },
      { href: "/billing", label: "Billing", icon: <CreditCard size={16} /> },
      { href: "/pricing", label: "Pricing", icon: <Sparkles size={16} /> },
    ],
    []
  );

  const visibleMain = useMemo(
    () => mainNav.filter((item) => canAccessPath(roleForNav, item.href)),
    [mainNav, roleForNav]
  );
  const visibleSystem = useMemo(
    () => systemNav.filter((item) => canAccessPath(roleForNav, item.href)),
    [systemNav, roleForNav]
  );

  const handleSignOut = async () => {
    if (signingOut || !authLoaded) return;
    setSigningOut(true);
    try {
      await performAppSignOut(signOut);
    } finally {
      setSigningOut(false);
    }
  };

  // ✅ Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved && typeof setCollapsed === "function") {
      setCollapsed(saved === "true");
    }
  }, [setCollapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed.toString());
  }, [collapsed]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#00000] border-r border-[#ececec] shadow-[0_0_40px_rgba(0,0,0,0.04)] flex flex-col transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[280px] pl-2"
        }`}
    >

      {/* HEADER */}
      <div
        className={`sidebar-header  flex px-4 py-4 ${collapsed ? "flex-col items-center gap-2" : "items-center justify-between"
          }`}
      >
        {collapsed ? (
           <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] flex items-center justify-center text-white font-semibold shadow-sm" title={PRODUCT_NAME}>
            C
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
           <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] flex items-center justify-center text-white font-semibold shadow-sm" title={PRODUCT_NAME}>
              C
            </div>
            <div className="min-w-0">
              <h1 className="logo-text text-sm font-semibold leading-tight truncate">
                {COMPANY_NAME}
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                {PRODUCT_SHORT}
              </p>
            </div>
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
        <div className="px-3 mt-2 space-y-1.5">
          <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500">
            <Building2 size={12} />
            Company
          </label>
          <select
            value={companyId || ""}
            onChange={(e) => selectCompany(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-2xl px-2 py-1.5 bg-white text-gray-800"
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
      <nav
        className={`flex-1 mt-3 px-2 ${collapsed
            ? "overflow-hidden"
            : "sidebar-scroll overflow-y-auto"
          }`}
      >

        <GroupLabel collapsed={collapsed} label="Main" />

        {visibleMain.map((item) => (
          <NavItem
            key={item.href}
            collapsed={collapsed}
            href={item.href}
            icon={item.icon}
            label={item.label}
            pathname={pathname}
          />

        ))}

        {workspaceReady && canManageUsers(role) && canAccessPath(roleForNav, "/users") && (
          <NavItem
            collapsed={collapsed}
            href="/users"
            icon={<UserCog size={16} />}
            label="HRM"
            pathname={pathname}
          />
        )}

        <GroupLabel collapsed={collapsed} label="System" />

        {visibleSystem.map((item) => (
          <NavItem
            key={item.href}
            collapsed={collapsed}
            href={item.href}
            icon={item.icon}
            label={item.label}
            pathname={pathname}
          />
        ))}



      </nav>

      {/* FOOTER */}
      <div className="border-t border-[#ececec] bg-[#f7f7f8] pt-2 px-2 mb-2">

        {workspaceReady && workspaceUser && companyTenure && (
          <div
            className={`mb-2 ${collapsed ? "flex justify-center px-1" : "px-2"}`}
            title={`Time in company: ${companyTenure.label} (24h clock)`}
          >
            {collapsed ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[10px] font-bold text-gray-700 shadow-sm ring-1 ring-gray-200">
                {companyTenure.days}d
              </span>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  In company
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 tabular-nums">
                  {companyTenure.label}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Since account created · hr 1–24
                </p>
              </div>
            )}
          </div>
        )}

        <GroupLabel collapsed={collapsed} label="Account" />

        {canAccessPath(roleForNav, "/profile") && (
          <NavItem collapsed={collapsed} href="/profile" icon={<UserRound size={16} />} label="Profile" pathname={pathname} />
        )}
        <SignOutNavItem
          collapsed={collapsed}
          onSignOut={handleSignOut}
          disabled={signingOut || !authLoaded}
        />

      </div>

    </aside>
  );
}

/* SIGN OUT — same look as NavItem, runs Clerk signOut + clears workspace */
function SignOutNavItem({
  collapsed,
  onSignOut,
  disabled,
}: {
  collapsed: boolean;
  onSignOut: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <div className="relative group">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void onSignOut()}
        className={`flex items-center w-full ${collapsed ? "justify-center" : "gap-2 px-2"
          } py-2 rounded-2xl text-sm transition-all duration-150 hover:scale-[1.02] text-[#616161] hover:bg-white/80 hover:text-black disabled:cursor-wait disabled:opacity-60`}
      >
        <LogOut size={16} />
        {!collapsed && <span>{disabled ? "Signing out…" : "Sign out"}</span>}
      </button>

      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap bg-[#1f1f1f] text-white bg-[#f7f7f8]/95 backdrop-blur-xl text-xs px-2.5 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50">
          Sign out
        </div>
      )}
    </div>
  );
}

/* NAV ITEM */
function NavItem({
  collapsed,
  href,
  icon,
  label,
  pathname,
}: {
  collapsed: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
}) {
  const active = pathname.startsWith(href);

  return (
    <div className="relative group">

      <Link
        href={href}
        className={`flex items-center ${collapsed ? "justify-center" : "gap-2 px-2"
          } py-2 rounded-2xl text-sm transition-all duration-150 hover:scale-[1.02] ${active
            ? "bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] text-white shadow-[0_6px_18px_rgba(124,92,255,0.28)]"
            : "text-[#616161] hover:bg-white/80 hover:text-black"
          }`}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>

      {/* TOOLTIP */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap bg-[#1f1f1f] text-white bg-[#f7f7f8]/95 backdrop-blur-xl text-xs px-2.5 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50">
          {label}
        </div>
      )}
    </div>
  );
}

/* GROUP LABEL */
function GroupLabel({ collapsed, label }: { collapsed: boolean; label: string }) {
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
