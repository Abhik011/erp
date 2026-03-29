"use client";

import { useEffect, useState } from "react";
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

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ReportsPage() {
  const [yearData, setYearData] = useState<any>(null);
  const [monthData, setMonthData] = useState<any>(null);

  const year = new Date().getFullYear();

  useEffect(() => {
    fetch(`${API}/reports/financial-year?year=${year}`)
      .then((res) => res.json())
      .then(setYearData);

    fetch(
      `${API}/reports/monthly?year=${year}&month=${
        new Date().getMonth() + 1
      }`
    )
      .then((res) => res.json())
      .then(setMonthData);
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN").format(n || 0);

  if (!yearData || !monthData)
    return <div className="p-6 text-gray-500">Loading...</div>;

  // 🔥 CONVERT MONTH DATA → CHART FORMAT
  const chartData = Object.entries(yearData.months || {}).map(
    ([month, value]) => ({
      month,
      revenue: value,
    })
  );

  return (
    <div className=" mx-auto p-6 space-y-6">

      {/* HEADER */}
      <h1 className="text-2xl font-semibold tracking-tight">
        Reports
      </h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <Stat title="Revenue" value={`₹${fmt(yearData.total)}`} />
        <Stat title="Paid" value={`₹${fmt(yearData.paid)}`} />
        <Stat title="Pending" value={`₹${fmt(yearData.pending)}`} />
        <Stat title="Invoices" value={monthData.count} />

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* REVENUE TREND */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

          <div className="flex justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">
              Revenue Trend
            </h2>
            <span className="text-xs text-gray-400">
              FY {year}-{year + 1}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
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

        {/* PAYMENT BREAKDOWN */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

          <div className="flex justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">
              Payment Breakdown
            </h2>
            <span className="text-xs text-gray-400">
              This Month
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { name: "Paid", value: monthData.paid },
                { name: "Unpaid", value: monthData.unpaid },
              ]}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#fde047" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

/* 🔥 COMPONENTS */

function Stat({ title, value }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}