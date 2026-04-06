"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function QuotePage() {
  const router = useRouter();
  const params = useParams();

  const id = params?.id;
  const isNew = id === "new";

  const [quote, setQuote] = useState<any>(null);
  const [results, setResults] = useState<any>({ customers: [], leads: [] });
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Normalize
  const normalize = (q: any) => ({
    ...q,
    items: Array.isArray(q?.items) ? q.items : [],
    customerSnapshot: q?.customerSnapshot || {},
    agencySnapshot: q?.agencySnapshot || {},
  });

  useEffect(() => {
    if (!isNew) {
      apiFetch(`/quotes/${id}`)
        .then((r) => r.json())
        .then((data) => setQuote(normalize(data)))
        .finally(() => setLoading(false));
    } else {
      apiFetch("/agencies/default")
        .then((r) => r.json())
        .then((agency) => {
          setQuote(
            normalize({
              title: "Quotation",
              items: [{ name: "Service", quantity: 1, rate: 0, total: 0 }],
              gstType: "CGST_SGST",
              discount: 0,
              status: "Draft",
              customerSnapshot: {},
              agencySnapshot: agency || {},
            })
          );
          setLoading(false);
        });
    }
  }, [id]);

  // Keyboard save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveQuote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quote]);

  const searchCustomer = async (q: string) => {
    setQuery(q);
    if (!q) return setResults({ customers: [], leads: [] });

    const res = await apiFetch(`quotes/search?q=${q}`);
    const data = await res.json();
    setResults(data);
  };

  const list = [...results.customers, ...results.leads];

  const handleKeyDown = (e: any) => {
    if (e.key === "ArrowDown") setActiveIndex((p) => Math.min(p + 1, list.length - 1));
    if (e.key === "ArrowUp") setActiveIndex((p) => Math.max(p - 1, 0));
    if (e.key === "Enter" && list[activeIndex]) selectCustomer(list[activeIndex]);
  };

  const selectCustomer = (c: any) => {
    setQuote((prev: any) => ({
      ...prev,
      customer: c._id,
      customerSnapshot: {
        name: c.name,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        address: c.address,
      },
    }));
    setResults({ customers: [], leads: [] });
    setQuery(c.companyName || c.name);
  };

  const updateItem = (i: number, field: string, val: any) => {
    const items = [...(quote.items || [])];
    items[i][field] = val;
    items[i].total = items[i].quantity * items[i].rate;
    setQuote({ ...quote, items });
  };

  const addItem = () => {
    setQuote({
      ...quote,
      items: [...(quote.items || []), { name: "", quantity: 1, rate: 0, total: 0 }],
    });
  };

  const saveQuote = async () => {
    if (!quote.customer && !quote.customerSnapshot?.name) {
      return alert("Enter customer details");
    }

    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/quotes" : `/quotes/${id}`;

    const res = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });

    const data = await res.json();

    if (isNew) router.push(`/quotes/${data._id}`);
    else alert("Saved");
  };

  const downloadPdf = async () => {
    const res = await apiFetch(`/quotes/${quote._id}/pdf`);
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob));
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const items = quote?.items || [];

  const subtotal = items.reduce((t: number, i: any) => t + i.total, 0);
  const discountAmt = (subtotal * (quote.discount || 0)) / 100;
  const taxable = subtotal - discountAmt;
  const cgst = quote.gstType === "IGST" ? 0 : taxable * 0.09;
  const sgst = quote.gstType === "IGST" ? 0 : taxable * 0.09;
  const igst = quote.gstType === "IGST" ? taxable * 0.18 : 0;
  const total = taxable + cgst + sgst + igst;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">
          {isNew ? "New Quote" : quote.quoteNumber}
        </h1>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={downloadPdf} className="border px-3 py-1 rounded">PDF</button>
          )}
          <button onClick={saveQuote} className="bg-black text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>

      {/* SEARCH */}
      <input
        value={query}
        onChange={(e) => searchCustomer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search customer or lead..."
        className="w-full border px-3 py-2 rounded"
      />

      {list.length > 0 && (
        <div className="border rounded bg-white">
          {list.map((c: any, i: number) => (
            <div
              key={c._id}
              onClick={() => selectCustomer(c)}
              className={`p-2 cursor-pointer ${i === activeIndex ? "bg-violet-100" : "hover:bg-gray-100"}`}
            >
              {c.companyName || c.name}
            </div>
          ))}
        </div>
      )}

      {/* ITEMS */}
      <div className="border p-4 rounded">
        {items.map((item: any, i: number) => (
          <div key={i} className="grid grid-cols-4 gap-2 mb-2">
            <input value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} className="border p-2" />
            <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", +e.target.value)} className="border p-2" />
            <input type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", +e.target.value)} className="border p-2" />
            <div className="p-2">₹{item.total}</div>
          </div>
        ))}
        <button onClick={addItem} className="bg-gray-100 px-2 py-1 rounded">+ Add</button>
      </div>

      {/* TOTAL */}
      <div className="text-right space-y-1">
        <div>Subtotal ₹{subtotal}</div>
        <div>Discount ₹{discountAmt}</div>
        {quote.gstType === "IGST" ? (
          <div>IGST ₹{igst}</div>
        ) : (
          <>
            <div>CGST ₹{cgst}</div>
            <div>SGST ₹{sgst}</div>
          </>
        )}
        <div className="font-bold text-lg">Total ₹{total}</div>
      </div>

      {/* PREVIEW */}
      <div className="bg-white border p-6 rounded">
        <div className="flex justify-between">
          <div>
            <h2 className="font-bold">{quote.agencySnapshot?.name}</h2>
            <p>{quote.agencySnapshot?.address}</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold">QUOTATION</h2>
            <p>{quote.quoteNumber}</p>
          </div>
        </div>

        <div className="mt-4">
          <p>{quote.customerSnapshot?.companyName}</p>
          <p>{quote.customerSnapshot?.phone}</p>
        </div>

        <table className="w-full mt-4 text-sm">
          <tbody>
            {items.map((i: any, idx: number) => (
              <tr key={idx}>
                <td>{i.name}</td>
                <td>{i.quantity}</td>
                <td>₹{i.rate}</td>
                <td className="text-right">₹{i.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right font-bold mt-4">Total ₹{total}</div>
      </div>
    </div>
  );
}