"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function InvoicesPage() {
  const { ready, companyId } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !companyId) return;

    apiFetch("/invoices")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const sorted = list.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        setInvoices(sorted);
        setFiltered(sorted);
        setLoading(false);
      });
  }, [ready, companyId]);

  // SEARCH
  useEffect(() => {
    const q = search.toLowerCase();

    const result = invoices.filter((i) =>
      (i.invoiceNumber || "").toLowerCase().includes(q) ||
      (i.customerSnapshot?.companyName || "")
        .toLowerCase()
        .includes(q)
    );

    setFiltered(result);
  }, [search, invoices]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;

    await apiFetch(`/invoices/${id}`, {
      method: "DELETE",
    });

    setInvoices((prev) => prev.filter((i) => i._id !== id));
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN").format(n || 0);

  const statusStyle = (status: string) => {
    if (status === "Paid") return "bg-green-100 text-green-700";
    if (status === "Partial") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  if (loading)
    return <div className="p-6 text-gray-500">Loading invoices...</div>;

  return (
    <div className=" mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Invoices
          </h1>
          <p className="text-sm text-gray-500">
            {invoices.length} total invoices
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="bg-[#f7e414] text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          + New Invoice
        </Link>

      </div>

      {/* SEARCH */}
      <input
        placeholder="Search invoices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
      />

      {/* CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No invoices found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-[#fafafa] text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-left px-4">Client</th>
                  <th className="text-left px-4">Date</th>
                  <th className="text-left px-4">Amount</th>
                  <th className="text-left px-4">Status</th>
                  <th className="text-left px-4">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((i) => (
                  <tr
                    key={i._id}
                    className="border-t hover:bg-gray-50 transition"
                  >

                    {/* INVOICE */}
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {i.invoiceNumber}
                    </td>

                    {/* CLIENT */}
                    <td className="px-4 text-gray-600 min-w-[180px]">
                      {i.customerSnapshot?.companyName ||
                        i.customer?.companyName ||
                        i.customer?.name ||
                        "—"}
                    </td>

                    {/* DATE */}
                    <td className="px-4 text-gray-500">
                      {new Date(i.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 font-mono">
                      ₹{fmt(i.totalAmount)}
                    </td>

                    {/* STATUS */}
                    <td className="px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle(
                          i.paymentStatus
                        )}`}
                      >
                        {i.paymentStatus}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4">

                      <div className="flex gap-2">

                        <Link
                          href={`/invoices/${i._id}`}
                          className="text-xs bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200"
                        >
                          View
                        </Link>

                        <Link
                          href={`/invoices/${i._id}`}
                          className="text-xs bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleDelete(i._id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100"
                        >
                          Delete
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