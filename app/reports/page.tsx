"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold">Finance Dashboard</h1>

      <div className="flex justify-end">
        <Button onClick={exportPDF}>Export PDF</Button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: "Revenue", value: data.total },
          { title: "Collected", value: data.paid },
          { title: "Outstanding", value: data.expected },
          { title: "Overdue", value: data.overdue },
          { title: "DSO", value: data.dso + " days" }
        ].map((item, i) => (
          <motion.div key={i} whileHover={{ scale: 1.03 }}>
            <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-white to-gray-100">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">{item.title}</p>
                <p className="text-xl font-semibold">
                  {typeof item.value === "number"
                    ? `₹${fmt(item.value)}`
                    : item.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue Trend */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-2">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="revenue" stroke="#111" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-2">Cash Flow</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlow}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Trend */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-2">Payment Discipline</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={paymentTrend}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <h2 className="text-sm mb-2">Top Customers</h2>
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs">
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td>{c.name}</td>
                    <td>₹{fmt(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>

      {/* PROGRESS BAR */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm mb-2">Collection Progress</p>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${(data.paid / data.total) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
