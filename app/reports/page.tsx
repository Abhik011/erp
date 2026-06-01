"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

export default function FinanceDashboard() {
  const { ready, companyId } = useCompany();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!ready || !companyId) return;

    apiFetch(`/reports/finance-overview?year=${new Date().getFullYear()}`)
      .then((res) => res.json())
      .then(setData);
  }, [ready, companyId]);

  if (!data) return <div className="p-6">Loading...</div>;

  const chartData = Object.entries(data.monthlyTrend || {}).map(
    ([month, value]) => ({ month, revenue: value })
  );

  const cashFlow = [
    { name: "Paid", value: data.paid },
    { name: "Expected", value: data.expected },
    { name: "Overdue", value: data.overdue }
  ];

  const paymentTrend = [
    { name: "On Time", value: data.paymentTrend.onTime },
    { name: "Late", value: data.paymentTrend.late }
  ];

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN").format(n || 0);

  return (
    <div className="p-6 space-y-6 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
        <Button onClick={() => window.print()}>Export PDF</Button>
      </div>

      {/* ALERT */}
      {data.overdue > 0 && (
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm">
          ⚠️ ₹{fmt(data.overdue)} overdue. Follow up with clients.
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: "Revenue", value: data.total, color: "bg-green-500" },
          { title: "Collected", value: data.paid, color: "bg-blue-500" },
          { title: "Outstanding", value: data.expected, color: "bg-yellow-500" },
          { title: "Overdue", value: data.overdue, color: "bg-red-500" },
          { title: "DSO", value: data.dso + " days", color: "bg-purple-500" }
        ].map((item, i) => (
          <motion.div key={i} whileHover={{ scale: 1.03 }}>
            <Card className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-xl transition-all">
              <div className={`h-1 w-full ${item.color} rounded-t-xl`} />
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">{item.title}</p>
                <p className="text-xl font-semibold">
                  {typeof item.value === "number" ? (
                    <>₹<CountUp end={item.value} duration={1.2} separator="," /></>
                  ) : (
                    item.value
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Trend */}
        <Card className="lg:col-span-2 rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-3">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(val) => `₹ ${val}`} />
                <Line type="monotone" dataKey="revenue" stroke="url(#colorRev)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-3">Cash Flow</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cashFlow}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(val) => `₹ ${val}`} />

                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {cashFlow.map((entry, index) => {
                    let color = "#8884d8";

                    if (entry.name === "Paid") color = "#22c55e";       // green
                    if (entry.name === "Expected") color = "#3b82f6";   // blue
                    if (entry.name === "Overdue") color = "#ef4444";    // red

                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Trend */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-3">Payment Discipline</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={paymentTrend}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(val) => `₹ ${val}`} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-3">Top Customers</h2>
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs">
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50 cursor-pointer">
                    <td>{c.name}</td>
                    <td>₹{fmt(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>

      {/* PROGRESS */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm mb-2">Collection Progress</p>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${data.total ? (data.paid / data.total) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
