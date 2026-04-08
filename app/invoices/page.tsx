"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import InvoiceRenderer from "@/components/invoice/InvoiceRenderer";
export default function InvoicesPage() {
  const { ready, companyId } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [payModal, setPayModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNote, setPayNote] = useState("");
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

  const handlePay = (invoice: any) => {
    setPayModal(invoice);
  };

  const submitPayment = async () => {
    if (!payAmount) return alert("Enter amount");

    await apiFetch(`/invoices/${payModal._id}/pay`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(payAmount),
        method: payMethod,
        note: payNote,
      }),
    });

    setPayModal(null);
    setPayAmount("");
    setPayNote("");

    // refresh list
    window.location.reload();
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
      <div className="w-[30%]">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-black/5 transition">

          {/* ICON */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          {/* SEARCH */}
          <input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm placeholder:text-gray-400"
          />
        </div>
      </div>
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
                  <th className="text-left px-4">Paid Amount</th>
                  <th className="text-left px-4">Total Amount</th>
                  <th className="text-left px-4">Status</th>
                  <th className="text-left px-4">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((i) => (
                  <tr
                    key={i._id}
                    className="border-t border-gray-200  hover:bg-gray-50 transition"
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
                    <td className="px-4 font-mono">
                      ₹{fmt(i.paidAmount)}
                    </td>
                    {/* AMOUNT */}
                    <td className="px-4 font-mono">
                      ₹{fmt(i.totalAmount)}
                    </td>

                    {/* STATUS */}
                    <td className="px-4">
                      <span
                        className={`text-xs px-2 py-1 font-medium ${statusStyle(
                          i.paymentStatus
                        )}`}
                      >
                        {i.paymentStatus}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4">

                      <div className="flex gap-2">

                        <button
                          onClick={async () => {
                            const res = await apiFetch(`/invoices/${i._id}`);
                            const data = await res.json();

                            setPreviewInvoice(data);
                            setPreviewOpen(true);
                          }}
                          className="text-xs bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handlePay(i)}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = `/invoices/new?id=${i._id}`;
                          }}
                          className="text-xs bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            window.open(`/api/invoices/${i._id}/pdf`, "_blank")
                          }
                          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm"
                        >
                          PDF
                        </button>
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
      {previewOpen && previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

          {/* Modal container */}
          <div className="bg-white w-[90%] max-w-5xl h-[90vh] rounded-xl overflow-hidden shadow-xl flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-sm font-semibold">
                Invoice #{previewInvoice.invoiceNumber}
              </h2>

              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="p-6 rounded-lg">
                <InvoiceRenderer invoice={previewInvoice} />
              </div>
            </div>

          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4">

            <h2 className="text-lg font-semibold">
              Add Payment
            </h2>

            {/* Amount */}
            <input
              type="number"
              placeholder="Enter amount"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />

            {/* Method */}
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>UPI</option>
            </select>

            {/* Note */}
            <input
              placeholder="Note (optional)"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPayModal(null)}
                className="px-3 py-1 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={submitPayment}
                className="bg-violet-600 text-white px-4 py-2 rounded"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>


  );
}