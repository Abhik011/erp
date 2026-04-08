"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  IndianRupee,
  FileText
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function Dashboard() {
  const { ready, companyId } = useCompany();

  const [stats, setStats] = useState({
    leads: 0,
    customers: 0,
    revenue: 0,
    invoices: 0
  });

  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [range, setRange] = useState<"day" | "week" | "month" | "year">("month");
  const formatShort = (num: number) => {
    if (!num) return "0";

    const format = (val: number, suffix: string) =>
      (val % 1 === 0 ? val : val.toFixed(1)) + suffix;

    // Billion
    if (num >= 1_000_000_000) return format(num / 1_000_000_000, "B");

    // Million
    if (num >= 1_000_000) return format(num / 1_000_000, "M");

    // Lakh (Indian)
    if (num >= 100_000) return format(num / 100_000, "L");

    // Thousand
    if (num >= 1_000) return format(num / 1_000, "K");

    return num.toString();
  };

  useEffect(() => {
    if (!ready || !companyId) return;

    apiFetch("/dashboard/stats")
      .then((res) => res.json())
      .then(setStats);

    apiFetch("/leads")
      .then((res) => res.json())
      .then((data) =>
        setRecentLeads(Array.isArray(data) ? data.slice(0, 5) : [])
      );

    apiFetch("/invoices")
      .then((res) => res.json())
      .then((data) =>
        setRecentInvoices(Array.isArray(data) ? data.slice(0, 5) : [])
      );

    apiFetch(`/dashboard/revenue?range=${range}`)
      .then((res) => res.json())
      .then(setRevenueData);

    apiFetch("/dashboard/pipeline")
      .then((res) => res.json())
      .then(setPipelineData);
  }, [ready, companyId, range]);

  const cards = [
    { title: "Leads", value: stats.leads, icon: UserPlus, color: "bg-blue-100 text-blue-600" },
    { title: "Customers", value: stats.customers, icon: Users, color: "bg-purple-100 text-purple-600" },
    { title: "Revenue", value: `₹ ${formatShort(stats.revenue)}`, icon: IndianRupee, color: "bg-green-100 text-green-600" },
    { title: "Invoices", value: stats.invoices, icon: FileText, color: "bg-orange-100 text-orange-600" }
  ];
  const getStatusColor = (status) => {
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
  const getStatusLabel = (status) => {
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
  return (
    <div className=" mx-auto p-6 space-y-8 bg-[#f2f2f2]space-y-8">
      {/* HEADER */}
      <h1 className="text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {cards.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={i}
              className="bg-white stat-card rounded-2xl border border-gray-200 p-5 flex justify-between items-center shadow-sm"
            >

              <div>
                <p className="stat-label">
                  {card.title}
                </p>
                <p className="stat-val">
                  {card.value}
                </p>

              </div>

              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}

      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <div className="flex justify-between mb-4">
            <h2 className="font-medium text-sm text-gray-700">
              Revenue Trend
            </h2>
            <div className="flex gap-2 text-xs">

              {["day", "week", "month", "year"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r as any)}
                  className={`px-2 py-1 rounded-md transition ${range === r
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-100"
                    }`}
                >
                  {r}
                </button>
              ))}

            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" stroke="#aaa" fontSize={12} />
              <YAxis stroke="#aaa" fontSize={12} />

              <Tooltip
                formatter={(val: any) => `₹ ${val}`}
                contentStyle={{ borderRadius: 8 }}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#64eb96"   // 🔥 green revenue line
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <div className="flex justify-between mb-4">
            <h2 className="font-medium text-sm text-gray-700">
              Leads Pipeline
            </h2>
            <span className="text-xs text-gray-400">
              Overview
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipelineData}>
              <XAxis dataKey="stage" stroke="#aaa" fontSize={12} />
              <YAxis stroke="#aaa" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#fde047" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Leads */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <h2 className="text-sm font-medium mb-4 text-gray-700">
            Recent Leads
          </h2>

          <table className="w-full text-sm">

            <thead className="text-gray-400 text-xs">
              <tr>
                <th className="text-left pb-2">Name</th>
                <th className="text-left pb-2">Company</th>
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead._id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-2">{lead.name}</td>
                  <td>{lead.company}</td>
                  <td className="text-gray-500">{lead.status}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <h2 className="text-sm font-medium mb-4 text-gray-700">
            Recent Invoices
          </h2>

          <table className="w-full text-sm">

            <thead className="text-gray-400 text-xs">
              <tr>
                <th className="text-left pb-2">Invoice ID</th>
                <th className="text-left pb-2">Paid Amount</th>
                <th className="text-left pb-2">Total Amount</th>
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv._id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-2">{inv.invoiceNumber}</td>
                  <td>₹{inv.paidAmount}</td>
                  <td>₹{inv.totalAmount}</td>

                  <td>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-none text-xs  border ${getStatusColor(
                        inv.paymentStatus?.toLowerCase()
                      )}`}
                    >
                      {getStatusLabel(inv.paymentStatus?.toLowerCase())}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
}