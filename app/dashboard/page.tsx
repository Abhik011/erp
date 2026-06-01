"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  Users,
  IndianRupee,
  FileText,
  CalendarDays,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  Bell,
  Settings,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import { PRODUCT_NAME } from "@/lib/brand";
import { canAccessPath } from "@/lib/navAccess";

function roleCaps(role: string) {
  const r = role.toLowerCase();
  const inR = (...roles: string[]) => roles.includes(r);
  return {
    leads: inR("super_admin", "admin", "sales", "manager", "finance", "employee"),
    customers: inR("super_admin", "admin", "sales", "manager", "finance", "employee"),
    revenue: inR("super_admin", "admin", "finance", "manager"),
    invoices: inR("super_admin", "admin", "finance", "manager"),
    pipeline: inR("super_admin", "admin", "sales", "manager", "finance"),
    reminders: true,
    manageUsers: inR("super_admin", "admin"),
  };
}

export default function Dashboard() {
  const { ready, companyId, workspaceUser } = useCompany();
  const role = workspaceUser?.role || "viewer";
  const caps = useMemo(() => roleCaps(role), [role]);

  const [stats, setStats] = useState({
    leads: 0,
    customers: 0,
    revenue: 0,
    invoices: 0
  });
  const [reminders, setReminders] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pipelineData, setPipelineData] = useState<{ stage: keyof typeof pipelineColors; count: number }[]>([]);
  const [range, setRange] = useState<"day" | "week" | "month" | "year">("month");
  const [user, setUser] = useState<any>(null);

  const formatShort = (num: number) => {
    if (!num) return "0";
    const format = (val: number, suffix: string) =>
      (val % 1 === 0 ? val : val.toFixed(1)) + suffix;
    if (num >= 1_000_000_000) return format(num / 1_000_000_000, "B");
    if (num >= 1_000_000) return format(num / 1_000_000, "M");
    if (num >= 100_000) return format(num / 100_000, "L");
    if (num >= 1_000) return format(num / 1_000, "K");
    return num.toString();
  };

  useEffect(() => {
    if (!ready || !companyId) return;

    apiFetch("/users/me")
      .then((res) => res.json())
      .then(setUser);

    if (caps.leads || caps.customers || caps.revenue || caps.invoices) {
      apiFetch("/dashboard/stats")
        .then((res) => res.json())
        .then(setStats);
    }

    if (caps.leads) {
      apiFetch("/leads")
        .then((res) => res.json())
        .then((data) =>
          setRecentLeads(Array.isArray(data) ? data.slice(0, 5) : [])
        );
    } else {
      setRecentLeads([]);
    }

    if (caps.invoices) {
      apiFetch("/invoices")
        .then((res) => res.json())
        .then((data) =>
          setRecentInvoices(Array.isArray(data) ? data.slice(0, 5) : [])
        );
    } else {
      setRecentInvoices([]);
    }

    if (caps.revenue) {
      apiFetch(`/dashboard/revenue?range=${range}`)
        .then((res) => res.json())
        .then(setRevenueData);
    } else {
      setRevenueData([]);
    }

    if (caps.reminders) {
      apiFetch("/reminders/today")
        .then((res) => res.json())
        .then((data) => setReminders(Array.isArray(data) ? data : []));
    } else {
      setReminders([]);
    }

    if (caps.pipeline) {
      apiFetch("/dashboard/pipeline")
        .then((res) => res.json())
        .then(setPipelineData);
    } else {
      setPipelineData([]);
    }
  }, [ready, companyId, range, caps]);

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "Call":
        return { icon: Phone, color: "bg-blue-100 text-blue-600", bgColor: "bg-blue-50" };
      case "Email":
        return { icon: Mail, color: "bg-red-100 text-red-600", bgColor: "bg-red-50" };
      case "WhatsApp":
        return { icon: MessageCircle, color: "bg-green-100 text-green-600", bgColor: "bg-green-50" };
      case "Meeting":
        return { icon: Users, color: "bg-purple-100 text-purple-600", bgColor: "bg-purple-50" };
      case "Lead":
        return { icon: UserPlus, color: "bg-orange-100 text-orange-600", bgColor: "bg-orange-50" };
      case "Task":
        return { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600", bgColor: "bg-emerald-50" };
      default:
        return { icon: CalendarDays, color: "bg-gray-100 text-gray-600", bgColor: "bg-gray-50" };
    }
  };

  const kpiCards = useMemo(() => {
    const all = [
      {
        id: "leads",
        show: caps.leads,
        title: "Leads",
        value: stats.leads,
        icon: UserPlus,
        color: "from-blue-500 to-blue-600",
      },
      {
        id: "customers",
        show: caps.customers,
        title: "Customers",
        value: stats.customers,
        icon: Users,
        color: "from-purple-500 to-purple-600",
      },
      {
        id: "revenue",
        show: caps.revenue,
        title: "Revenue",
        value: `₹ ${formatShort(stats.revenue)}`,
        icon: IndianRupee,
        color: "from-green-500 to-emerald-600",
      },
      {
        id: "invoices",
        show: caps.invoices,
        title: "Invoices",
        value: stats.invoices,
        icon: FileText,
        color: "from-orange-500 to-orange-600",
      },
    ];
    return all.filter((c) => c.show);
  }, [caps, stats]);

  const quickLinks = useMemo(() => {
    const links: { href: string; label: string }[] = [];
    const add = (href: string, label: string) => {
      if (canAccessPath(role, href)) links.push({ href, label });
    };
    add("/leads", "Leads");
    add("/customers", "Customers");
    add("/deals", "Deals");
    add("/invoices", "Invoices");
    add("/projects", "Projects");
    add("/chat", "Team chat");
    add("/reports", "Reports");
    add("/users", "Team members");
    add("/agency", "Company profile");
    add("/billing", "Billing & plan");
    return links.slice(0, 6);
  }, [role]);

  const pipelineColors = {
    New: "#9ca3af",
    Contacted: "#3b82f6",
    Negotiation: "#f59e0b",
    Qualified: "#22c55e",
    Converted: "#8b5cf6",
    Lost: "#ef4444",
  } as const;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'partial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'PAID';
      case 'pending':
        return 'PENDING';
      case 'overdue':
        return 'OVERDUE';
      case 'partial':
        return 'PARTIAL';
      default:
        return 'DRAFT';
    }
  };

  const statusColor = {
    New: "bg-gray-100 text-gray-700",
    Contacted: "bg-blue-100 text-blue-700",
    Negotiation: "bg-yellow-100 text-yellow-700",
    Qualified: "bg-green-100 text-green-700",
    Converted: "bg-purple-100 text-purple-700",
    Lost: "bg-red-100 text-red-700",
  } as const;

  const leadStatusChipClass = (status: unknown) => {
    if (typeof status !== "string" || !(status in statusColor)) {
      return "bg-gray-100 text-gray-700";
    }
    return statusColor[status as keyof typeof statusColor];
  };

  return (
    <div className="mx-auto flex-1 min-h-0 overflow-y-auto">
      {/* BACKGROUND EFFECTS */}
      <style>{`
        .kpi-card-gradient {
          background:#dbdad6;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .kpi-card-gradient:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .premium-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(10px);
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.85);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-val {
          font-size: 2rem;
          font-weight: 700;
          color: black;
          margin-top: 0.5rem;
        }

        .trend-up {
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
        }
      `}</style>

      <div className="p-6 space-y-8">
        {/* HEADER WITH PROFILE */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">
              Hello {user?.name || workspaceUser?.name || "User"} 👋
            </h1>
            <p className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <ChevronRight size={14} />
                {workspaceUser?.companyName || PRODUCT_NAME}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                {(role || "member").replace(/_/g, " ")}
              </span>
              {workspaceUser?.planKey ? (
                <span className="rounded-full bg-[#7c5cff]/10 px-2 py-0.5 text-xs font-medium text-[#5b4bdb]">
                  {workspaceUser.planKey} plan
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <Search size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {kpiCards.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${kpiCards.length >= 4 ? "lg:grid-cols-4" : kpiCards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="kpi-card-gradient rounded-2xl p-6 text-white transition-all duration-300 cursor-pointer"
                style={{
                  '--gradient-start': `var(--${card.color.split('-')[1]}-500)`,
                  '--gradient-end': `var(--${card.color.split('-')[1]}-600)`,
                } as any}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1">
                    <p className="stat-label">{card.title}</p>
                    <p className="stat-val">{card.value}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/15 backdrop-blur-md">
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Profile + quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PROFILE CARD */}
          <div className="flex justify-center mb-6 w-90 h-90">
            <div className="relative premium-card rounded-[30px]  overflow-hidden bg-gray-100 shadow-lg">

              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || "Profile"}
                  className="w-50 h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] flex items-center justify-center text-white text-6xl font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
              )}

              {/* Bottom Glass Card */}
              <div className="absolute bottom-4 left-4 right-4 backdrop-blur-xl bg-white/60 rounded-[24px] px-5 py-4 border border-white/30 shadow-md">
                <h2 className="text-xl font-bold text-black leading-none">
                  {user?.name || "Unknown User"}
                </h2>

                <p className="text-xs uppercase tracking-wider text-gray-700 mt-1">
                  {user?.role?.replaceAll("_", " ") || "Member"}
                </p>
              </div>

            </div>
          </div>

          <div className="premium-card rounded-3xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick access</h3>
            <p className="text-sm text-gray-500 mb-4">
              Shortcuts for your role in {workspaceUser?.companyName || "this workspace"}.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 transition"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {role === "super_admin" && caps.manageUsers ? (
              <p className="mt-4 text-xs text-gray-500">
                Invite teammates from{" "}
                <Link href="/users" className="font-medium text-[#5b4bdb] underline">
                  Users
                </Link>
                . They join this organization only—no new workspace is created.
              </p>
            ) : null}
          </div>
        </div>

        {/* KPI CARDS */}


        {/* CHARTS SECTION */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

       
          <div className="premium-card rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
              <div className="flex gap-2 text-xs">
                {["day", "week", "month", "year"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${range === r
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#d1d5db" fontSize={12} />
                <YAxis stroke="#d1d5db" fontSize={12} />
                <Tooltip 
                  formatter={(val: any) => `₹ ${val}`}
                  contentStyle={{ borderRadius: 12, border: 'none', background: '#f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          
          <div className="premium-card rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Leads Pipeline</h2>
              <span className="text-xs text-gray-500">Overview</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipelineData}>
                <XAxis dataKey="stage" stroke="#d1d5db" fontSize={12} />
                <YAxis stroke="#d1d5db" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', background: '#f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pipelineColors[entry.stage] || "#d1d5db"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div> */}

        {/* TABLES SECTION */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

         
          <div className="premium-card rounded-3xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Leads</h2>
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs font-semibold border-b border-gray-200">
                <tr>
                  <th className="text-left pb-4">Name</th>
                  <th className="text-left pb-4">Company</th>
                  <th className="text-left pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="py-4 text-gray-900 font-medium">{lead.fullName}</td>
                    <td className="text-gray-600">{lead.companyName}</td>
                    <td>
                      <span className={`inline-block text-xs px-3 py-1.5 rounded-lg font-semibold ${leadStatusChipClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        
          <div className="premium-card rounded-3xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Invoices</h2>
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs font-semibold border-b border-gray-200">
                <tr>
                  <th className="text-left pb-4">Invoice ID</th>
                  <th className="text-left pb-4">Paid</th>
                  <th className="text-left pb-4">Total</th>
                  <th className="text-left pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="py-4 text-gray-900 font-medium">{inv.invoiceNumber}</td>
                    <td className="text-gray-600">₹{inv.paidAmount}</td>
                    <td className="text-gray-600">₹{inv.totalAmount}</td>
                    <td>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(inv.paymentStatus?.toLowerCase())}`}>
                        {getStatusLabel(inv.paymentStatus?.toLowerCase())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div> */}

        {caps.reminders && (
        <div className="premium-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Tasks & Reminders</h2>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1.5 rounded-full">
              {reminders.length} Pending
            </span>
          </div>

          {reminders.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tasks for today</p>
              <p className="text-sm text-gray-400">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto flex flex-col-reverse">
              {reminders.map((item, idx) => {
                const reminderType = item.type || item.title || "Task";
                const { icon: Icon, color, bgColor } = getReminderIcon(reminderType);

                return (
                  <div
                    key={item._id}
                    className="group p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                    style={{
                      animation: `slideUp 0.5s ease-out ${idx * 0.05}s both`
                    }}
                  >
                    <style>{`
                      @keyframes slideUp {
                        from {
                          opacity: 0;
                          transform: translateY(20px);
                        }
                        to {
                          opacity: 1;
                          transform: translateY(0);
                        }
                      }
                    `}</style>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${color}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.leadName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="font-semibold text-gray-700">{reminderType}</span>
                            {" • "}
                            {new Date(item.reminderAt || item.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all group-hover:scale-110">
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

      </div>
    </div>
  );
}