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

    apiFetch("/dashboard/revenue")
      .then((res) => res.json())
      .then(setRevenueData);

    apiFetch("/dashboard/pipeline")
      .then((res) => res.json())
      .then(setPipelineData);
  }, [ready, companyId]);

  const cards = [
    { title: "Leads", value: stats.leads, icon: UserPlus, color: "bg-blue-100 text-blue-600" },
    { title: "Customers", value: stats.customers, icon: Users, color: "bg-purple-100 text-purple-600" },
    { title: "Revenue", value: `₹${stats.revenue}`, icon: IndianRupee, color: "bg-green-100 text-green-600" },
    { title: "Invoices", value: stats.invoices, icon: FileText, color: "bg-orange-100 text-orange-600" }
  ];

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
            <span className="text-xs text-gray-400">
              This Month
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" stroke="#aaa" fontSize={12} />
              <YAxis stroke="#aaa" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#111"
                strokeWidth={2}
                dot={false}
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
                <tr key={lead._id} className="border-t hover:bg-gray-50">
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
                <th className="text-left pb-2">Amount</th>
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv._id} className="border-t hover:bg-gray-50">
                  <td className="py-2">{inv.invoiceNumber}</td>
                  <td>₹{inv.totalAmount}</td>
                  <td className="text-gray-500">{inv.paymentStatus}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
}