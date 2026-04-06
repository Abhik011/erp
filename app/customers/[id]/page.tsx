"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function CustomerProfile() {
  const params = useParams();
  const customerId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const { ready, companyId } = useCompany();
  const [customer, setCustomer] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [tab, setTab] = useState("overview");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [form, setForm] = useState<any>({
    title: "",
    service: "",
    value: "",
    deadline: "",
    priority: "medium",
    notes: ""
  });

  const [loadingDeal, setLoadingDeal] = useState(false);

  useEffect(() => {
    if (!customerId || !ready || !companyId) return;

    const loadData = async () => {
      const [c, d, i, q] = await Promise.all([
        apiFetch(`/customers/${customerId}`),
        apiFetch(`/deals/customer/${customerId}`),
        apiFetch(`/invoices/customer/${customerId}`),
        apiFetch(`/quotes/customer/${customerId}`),
      ]);

      setCustomer(await c.json());
      setDeals(d.ok ? await d.json() : []);
      setInvoices(i.ok ? await i.json() : []);
      setQuotes(q.ok ? await q.json() : []);
    };

    loadData();
  }, [customerId, ready, companyId]);

  // CREATE DEAL
  const createDeal = async () => {
    try {
      setLoadingDeal(true);

      const res = await apiFetch("/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerId,
          ...form,
          value: Number(form.value),
        }),
      });

      const newDeal = await res.json();
      setDeals((prev) => [newDeal, ...prev]);

      setForm({
        title: "",
        service: "",
        value: "",
        deadline: "",
        priority: "medium",
        notes: ""
      });

      setTab("deals");
    } finally {
      setLoadingDeal(false);
    }
  };

  // UPDATE STATUS
  const updateStatus = async (id: string, status: string) => {
    await apiFetch(`/deals/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setDeals((prev) =>
      prev.map((d) => (d._id === id ? { ...d, status } : d))
    );
  };

  if (!customer) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white border rounded-2xl p-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-lg">
            {customer.name?.charAt(0) || "C"}
          </div>

          <div>
            <h1 className="text-xl font-semibold">{customer.name}</h1>
            <p className="text-sm text-gray-500">{customer.email}</p>
            <p className="text-sm text-gray-400">{customer.phone}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const query = new URLSearchParams({
                customerId: customer._id,
                name: customer.name || "",
                companyName: customer.companyName || "",
                email: customer.email || "",
                phone: customer.phone || "",
                address: customer.address || "",
                gstNumber: customer.gstNumber || "",
              }).toString();

              router.push(`/invoices/new?${query}`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            + Create Invoice
          </button>
          <button
            onClick={() =>
              router.push(`/quotes/new?customerId=${customer._id}`)
            }
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
          >
            + New Quote
          </button>
          <button
            onClick={() => setTab("createDeal")}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg"
          >
            + New Deal
          </button>
        </div>

      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b text-sm">
        {["overview", "deals", "quotes", "invoices", "createDeal"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 ${tab === t
              ? "border-b-2 border-violet-600 font-semibold"
              : "text-gray-500"
              }`}
          >
            {t === "createDeal" ? "Create Deal" : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Deals" value={deals.length} />
          <Card title="Quotes" value={quotes.length} />
          <Card title="Invoices" value={invoices.length} />
          <Card
            title="Revenue"
            value={`₹${invoices.reduce((t, i) => t + (i.totalAmount || i.amount || 0), 0)}`}
          />
        </div>
      )}

      {/* DEALS */}
      {tab === "deals" && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 text-left">Project</th>
                <th>Service</th>
                <th>Value</th>
                <th>Status</th>
                <th>Deadline</th>
              </tr>
            </thead>

            <tbody>
              {deals.map((d) => (
                <tr key={d._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{d.title}</td>
                  <td>{d.service}</td>
                  <td>₹{d.value}</td>

                  <td>
                    <select
                      value={d.status}
                      onChange={(e) =>
                        updateStatus(d._id, e.target.value)
                      }
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option>New</option>
                      <option>Discussion</option>
                      <option>Proposal Sent</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </td>

                  <td>
                    {d.deadline
                      ? new Date(d.deadline).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QUOTES */}
      {tab === "quotes" && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Quote</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr
                  key={q._id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/quotes/${q._id}`)}
                >
                  <td className="p-4 font-medium">{q.quoteNumber}</td>
                  <td>₹{q.totalAmount ?? q.amount}</td>
                  <td>
                    <span className="px-2 py-1 rounded bg-violet-50 text-violet-700 text-xs">
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quotes.length === 0 && (
            <p className="p-6 text-center text-gray-400 text-sm">No quotes</p>
          )}
        </div>
      )}

      {/* CREATE DEAL */}
      {tab === "createDeal" && (
        <div className="bg-white border rounded-xl p-6 space-y-4 max-w-xl">

          <Input placeholder="Project Name" value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} />

          <Input placeholder="Service" value={form.service} onChange={(v: string) => setForm({ ...form, service: v })} />

          <Input type="number" placeholder="Budget ₹" value={form.value} onChange={(v: string) => setForm({ ...form, value: v })} />

          <Input type="date" value={form.deadline} onChange={(v: string) => setForm({ ...form, deadline: v })} />

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Notes"
            value={form.notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
          />

          <button
            onClick={createDeal}
            className="bg-violet-600 text-white w-full py-2 rounded"
          >
            {loadingDeal ? "Creating..." : "Create Deal"}
          </button>

        </div>
      )}

      {/* INVOICES */}
      {tab === "invoices" && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Invoice</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((i) => (
                <tr
                  key={i._id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/invoices/${i._id}`)}
                >
                  <td className="p-4 font-medium">{i.invoiceNumber}</td>
                  <td>₹{i.totalAmount || i.amount}</td>
                  <td>
                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">
                      {i.paymentStatus || i.status}
                    </span>
                  </td>
                </tr>


              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

// 🔥 SMALL UI COMPONENTS

function Card({ title, value }: any) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function Input({ value, onChange, ...props }: any) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border p-2 rounded"
    />
  );
}