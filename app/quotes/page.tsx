"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function QuotesPage() {
  const { ready, companyId } = useCompany();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !companyId) return;
    setLoading(true);
    apiFetch("/quotes")
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...(Array.isArray(data) ? data : [])].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setQuotes(sorted);
        setFiltered(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ready, companyId]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      quotes.filter(
        (x) =>
          (x.quoteNumber || "").toLowerCase().includes(q) ||
          (x.customerSnapshot?.companyName || "")
            .toLowerCase()
            .includes(q) ||
          (x.title || "").toLowerCase().includes(q)
      )
    );
  }, [search, quotes]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0);

  const downloadPdf = async (id: string) => {
    const res = await apiFetch(`/quotes/${id}/pdf`);
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Quote-${id}.pdf`; // 🔥 forces download
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading)
    return <div className="p-6 text-gray-500">Loading quotes…</div>;

  return (
    <div className="mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="text-sm text-gray-500">{quotes.length} total</p>
        </div>
        <Link
          href="/quotes/new"
          className="bg-[#111] text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 text-center"
        >
          + New quote
        </Link>
      </div>

      <input
        placeholder="Search quotes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm"
      />

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No quotes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#fafafa] text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Quote</th>
                  <th className="text-left px-4">Client</th>
                  <th className="text-left px-4">Total</th>
                  <th className="text-left px-4">Status</th>
                  <th className="text-left px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{q.quoteNumber}</td>
                    <td className="px-4 text-gray-600">
                      {q.customerSnapshot?.companyName ||
                        q.customerSnapshot?.name ||
                        "—"}
                    </td>
                    <td className="px-4 font-mono">
                      ₹{fmt(q.totalAmount ?? q.amount)}
                    </td>
                    <td className="px-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4">
                      <div className="flex gap-2 flex-wrap">

                        {/* VIEW TEMPLATE 🔥 */}
                        <Link
                          href={`/quotes/${q._id}/view`}
                          className="text-xs bg-violet-100 text-violet-700 px-3 py-1 rounded-lg"
                        >
                          View
                        </Link>

                        {/* EDIT */}
                        <Link
                          href={`/quotes/${q._id}`}
                          className="text-xs bg-gray-100 px-3 py-1 rounded-lg"
                        >
                          Edit
                        </Link>

                        {/* PDF DOWNLOAD */}
                        <button
                          type="button"
                          onClick={() => downloadPdf(q._id)}
                          className="text-xs bg-gray-100 px-3 py-1 rounded-lg"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
