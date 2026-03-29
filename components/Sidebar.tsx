"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Handshake,
  UserRound,
  Files,
  FolderKanban,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const linkStyle = (path: string) =>
    `flex items-center gap-2 px-2 py-2 transition text-sm ${pathname.startsWith(path)
      ? "bg-white text-black shadow-sm border border-gray-200"
      : "text-gray-600 hover:bg-[#f9f9f7] nav-item.active"
    }`;

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[#e8e4de] border-r border-gray-200  flex flex-col">

      {/* Top Section */}
      <div className="mb-1">

        {/* Logo Row */}
        <div className="sidebar-header">
          <div className="logo-icon">
            CE
          </div>
          <h1 className="logo-text">
            Creonox ERP
          </h1>
        </div>

        {/* Tabs */}
        {/* <div className="flex gap-2 bg-gray-200 p-1 rounded-lg w-fit">
          <button className="px-3 py-1 text-xs bg-white rounded-md shadow-sm">
            General
          </button>
          <button className="px-3 py-1 text-xs text-gray-500">
            Project
          </button>
        </div> */}
      </div>
      {/* Navigation */}
      <nav className="sidebar-nav mb-4 flex-1">
        <div className="nav-group-label">Main</div>
        <Link href="/dashboard" className={linkStyle("/dashboard")}>
          <LayoutDashboard size={14} />
          Dashboard
        </Link>

        <Link href="/leads" className={linkStyle("/leads")}>
          <UserPlus size={14} />
          Leads
        </Link>

        <Link href="/customers" className={linkStyle("/customers")}>
          <Users size={14} />
          Customers
        </Link>

        <Link href="/deals" className={linkStyle("/deals")}>
          <Handshake size={14} />
          Deals
        </Link>

        <Link href="/invoices" className={linkStyle("/invoices")}>
          <Files size={14} />
          invoice
        </Link>
        <Link href="/reports" className={linkStyle("/Reports")}>
          <FileText size={14} />
          Reports
        </Link>

        <div className="nav-group-label">System</div>
        <Link href="/projects" className={linkStyle("/projects")}>
          <FolderKanban size={14} />
          Projects
        </Link>
      </nav>

      {/* Bottom */}
      <div className="sidebar-footer" >
        <Link href="/agency" className={linkStyle("/agency")}>
          <UserRound size={14} />
          Profile
        </Link>
        <Link href="/logout" className={linkStyle("/logout")}>
          <LogOut size={14} />
          Logout
        </Link>
      </div>
    </aside>
  );
}