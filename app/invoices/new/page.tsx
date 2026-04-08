"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";



import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

const GST_RATE = 0.18;

// Merge API data with safe defaults for fields your DB might not have yet
function normalizeInvoice(raw: any) {
    return {
        // --- core fields from DB ---
        ...raw,

        // --- safe defaults for optional / new fields ---
        paymentStatus: raw.paymentStatus || "Pending",
        paymentTerms: raw.paymentTerms || "Net 15",
        projectName: raw.projectName || raw?.deal?.title || "",
        projectDescription: raw.projectDescription || "",
        gstType: raw.gstType || "CGST_SGST",
        customerGSTIN: raw.customerGSTIN || "",
        agencyGSTIN: raw.agencyGSTIN || "",
        placeOfSupply: raw.placeOfSupply || "",
        hsn: raw.hsn || "998314",
        discount: raw.discount || 0,
        notes: raw.notes || "",
        dueDate: raw.dueDate || new Date(Date.now() + 15 * 864e5).toISOString(),
        issueDate:
            raw.issueDate ||
            raw.createdAt ||
            new Date().toISOString(),
        // items: ensure each has all fields
        items: (raw.items || []).map((item: any) => ({
            name: item.name || "",
            description: item.description || "",
            quantity: item.quantity ?? 1,
            rate: item.rate ?? item.price ?? 0,
            total:
                item.total ??
                (Number(item.quantity || 1) * Number(item.rate ?? item.price ?? 0)),
        })),

        // milestones: default to 3-part split if not in DB
        milestones:
            raw.milestones && raw.milestones.length > 0
                ? raw.milestones
                : [
                    { label: "UI/UX Design", percent: 30, paid: false },
                    { label: "Development", percent: 50, paid: false },
                    { label: "Deployment", percent: 20, paid: false },
                ],

        // bankDetails: default if not in DB
        bankDetails: raw.bankDetails || {
            accountName: raw?.agency?.bankDetails?.accountName || "",
            accountNumber: raw?.agency?.bankDetails?.accountNumber || "",
            ifsc: raw?.agency?.bankDetails?.ifsc || "",
            bank: raw?.agency?.bankDetails?.bank || "",
        },

        // customer: can be embedded in invoice or a nested object
        customer: {
            name: raw.customer?.name || raw.customerSnapshot?.name || "",
            companyName: raw.customer?.companyName || raw.customerSnapshot?.companyName || "",
            contactPerson: raw.customer?.contactPerson || raw.customerSnapshot?.contactPerson || "",
            email: raw.customer?.email || raw.customerSnapshot?.email || "",
            phone: raw.customer?.phone || raw.customerSnapshot?.phone || "",
            address: raw.customer?.address || raw.customerSnapshot?.address || "",
            gstNumber: raw.customer?.gstNumber || raw.customerSnapshot?.gstNumber || "",
        },

        agency: {

        },
    };

}

export default function InvoiceView() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id"); // 🔥 from query
    const isNew = !id;
    const router = useRouter();
    const { ready, companyId } = useCompany();
    const [invoice, setInvoice] = useState<any>(null);
    const agency = invoice?.agency || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const handlePrint = () => {
        const printContents = document.getElementById("invoice-print")?.innerHTML;

        const win = window.open("", "", "width=900,height=650");

        if (!win || !printContents) return;

        win.document.write(`
    <html>
      <head>
        <title>Invoice</title>

  <style>
@media print {
  .grid-items {
    display: table;
    width: 100%;
  }
}

  .no-print {
    display: none !important;
  }

  /* ✅ KEEP INPUTS BUT MAKE THEM LOOK LIKE TEXT */
  input, textarea, select {
    border: none !important;
    background: transparent !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    font-size: 12px;
    color: #000;
  }

  /* ❌ REMOVE DROPDOWN ICON */
  select::-ms-expand {
    display: none;
  }

  /* ✅ ADD CLEAN BORDER TO SECTIONS */
  #invoice-print {
    box-shadow: none !important;
    border: 1px solid #ddd;
  }

  /* ✅ FORCE TABLE BORDERS */
  table, th, td {
    border: 1px solid #ddd !important;
    border-collapse: collapse;
  }

  /* ✅ FIX GRID ITEM BORDERS (YOUR LINE ITEMS) */
  div[style*="grid"] > div {
    border-bottom: 1px solid #eee;
    padding-bottom: 6px;
  }


}
</style>
      </head>

      <body>
        <div class="invoice-container">
          ${printContents}
        </div>
      </body>
    </html>
  `);

        win.document.close();
        win.focus();

        setTimeout(() => {
            win.print();
            win.close();
        }, 500);
    };
    // ── Fetch invoice ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!ready || !companyId) return;

        const loadData = async () => {
            try {
                setLoading(true);

                const agencyRes = await apiFetch("/agencies/default");

                let invoiceRes = null;

                if (id) {
                    invoiceRes = await apiFetch(`/invoices/${id}`);
                }

                const agencyData = await agencyRes.json();

                let invoiceData = {};

                if (id && invoiceRes) {
                    if (!invoiceRes.ok) throw new Error(`HTTP ${invoiceRes.status}`);
                    invoiceData = await invoiceRes.json();
                }

                // ✅ NORMALIZE FIRST
                const normalized = normalizeInvoice(invoiceData);
                if (id === "new") {
                    normalized.invoiceNumber =
                        normalized.invoiceNumber ||
                        `INV-${Date.now().toString().slice(-6)}`;
                }
                // ✅ FORCE AGENCY (ALWAYS FROM API)
                const finalInvoice = {
                    ...normalized,

                    agency: agencyData,
                    agencyGSTIN: agencyData?.gstin || "",
                    bankDetails: agencyData?.bankDetails || {},
                };

                setInvoice(finalInvoice);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();

    }, [id, ready, companyId]);

    const autoFillCustomer = (c: any) => {
        setInvoice((prev: any) => ({
            ...prev,

            customer: c,

            customerGSTIN: c.gstNumber || "",

            projectName: c.companyName || c.name || "",

            // OPTIONAL
            projectDescription: `Project for ${c.companyName || c.name}`,
        }));
    };
    useEffect(() => {
        if (!invoice?.deal) return;

        setInvoice((prev: any) => ({
            ...prev,

            projectName: prev.projectName || invoice.deal.title || "",

            items: prev.items?.length
                ? prev.items
                : [
                    {
                        name: invoice.deal.service || "Development",
                        description: invoice.deal.description || "", // 🔥 ADD
                        quantity: 1,
                        rate: invoice.deal.value || 0,
                        total: invoice.deal.value || 0,
                    },
                ],
        }));
    }, [invoice?.deal]);

    useEffect(() => {
        if (!invoice) return;

        setInvoice((prev: any) => {
            if (!prev) return prev;

            const updated = { ...prev };

            // ✅ AGENCY AUTO (ONLY IF EMPTY)
            if (!prev.agencyGSTIN && prev.agency?.gstin) {
                updated.agencyGSTIN = prev.agency.gstin;
            }

            if (!prev.bankDetails?.accountNumber && prev.agency?.bankDetails) {
                updated.bankDetails = prev.agency.bankDetails;
            }

            // ✅ CUSTOMER AUTO (ONLY IF EMPTY)
            if (!prev.customerGSTIN && prev.customer?.gstNumber) {
                updated.customerGSTIN = prev.customer.gstNumber;
            }

            if (!prev.placeOfSupply && prev.customer?.state) {
                updated.placeOfSupply = prev.customer.state;
            }

            // ✅ PROJECT NAME AUTO (ONLY IF EMPTY)
            if (!prev.projectName) {
                updated.projectName =
                    prev.customer?.companyName ||
                    prev.customer?.name ||
                    prev.deal?.title ||
                    "";
            }

            return updated;
        });

    }, [invoice?.agency, invoice?.customer, invoice?.deal]);

    const selectCustomer = (c: any) => {
        setInvoice((prev: any) => ({
            ...prev,

            customer: {
                name: c.name || "",
                companyName: c.companyName || "",
                email: c.email || "",
                phone: c.phone || "",
                address: c.address || "",
                gstNumber: c.gstNumber || "",
            },

            customerGSTIN: c.gstNumber || "",
            placeOfSupply: c.state || "",

            projectName: c.companyName || c.name || "",
            projectDescription: `Project for ${c.companyName || c.name}`,
        }));
    };

    useEffect(() => {
        if (!customerSearch) return;

        const t = setTimeout(async () => {
            try {
                const res = await apiFetch(`/customers/search?q=${customerSearch}`);
                const data = await res.json();
                setSuggestions(data || []);
            } catch { }
        }, 300);

        return () => clearTimeout(t);
    }, [customerSearch]);

    useEffect(() => {
        if (!invoice?.deal) return;

        const deal = invoice.deal;

        setInvoice((prev: any) => ({
            ...prev,

            customer: {
                name: deal.customer?.name || "",
                companyName: deal.customer?.companyName || "",
                email: deal.customer?.email || "",
                phone: deal.customer?.phone || "",
                address: deal.customer?.address || "",
            },

            projectName: deal.title || prev.projectName,

            items: prev.items?.length
                ? prev.items
                : [
                    {
                        name: deal.service || "Service",
                        description: deal.description || "",
                        quantity: 1,
                        rate: deal.value || 0,
                        total: deal.value || 0,
                    },
                ],
        }));
    }, [invoice?.deal]);

    // ── Derived totals ─────────────────────────────────────────────────────────
    const subtotal = invoice?.items?.reduce((t: number, i: any) => t + (i.total || 0), 0) || 0;
    const discountAmt = Math.round((subtotal * (invoice?.discount || 0)) / 100);
    const taxable = subtotal - discountAmt;
    const gst = Math.round(taxable * GST_RATE);
    const cgst = Math.round(taxable * 0.09);
    const sgst = Math.round(taxable * 0.09);
    const total = taxable + gst;

    // ── Item helpers ───────────────────────────────────────────────────────────
    const updateItem = (idx: number, field: string, value: any) => {
        const items = invoice.items.map((item: any, i: number) => {
            if (i !== idx) return item;
            const updated = { ...item, [field]: value };
            if (field === "rate" || field === "quantity") {
                updated.total =
                    (field === "rate" ? Number(value) : updated.rate) *
                    (field === "quantity" ? Number(value) : updated.quantity);
            }
            return updated;
        });
        setInvoice({ ...invoice, items });
    };
    const handleDownloadPDF = async (id: string, invoiceNumber?: string) => {
        try {
            const res = await apiFetch(`/invoices/${id}/pdf`);

            if (!res.ok) throw new Error("Failed to download PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${invoiceNumber || id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Error downloading PDF");
            console.error(err);
        }
    };
    const addItem = () =>
        setInvoice({
            ...invoice,
            items: [...invoice.items, { name: "", description: "", quantity: 1, rate: 0, total: 0 }],
        });

    const removeItem = (idx: number) =>
        setInvoice({ ...invoice, items: invoice.items.filter((_: any, i: number) => i !== idx) });

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);

        try {
            const payload = {
                ...invoice,
                notes: invoice.notes || "",
                issueDate: invoice.issueDate || new Date().toISOString(),

                // ✅ REMOVE VERSION FIELD
                __v: undefined,

                customer:
                    typeof invoice.customer === "object"
                        ? invoice.customer._id
                        : invoice.customer,

                agency:
                    typeof invoice.agency === "object"
                        ? invoice.agency._id
                        : invoice.agency,
            };

            delete payload.__v; // 🔥 IMPORTANT

            const url = invoice._id
                ? `/invoices/${invoice._id}`
                : `/invoices`;

            const method = invoice._id ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Save failed: HTTP ${res.status}`);

            alert("Invoice saved successfully.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };
    // ── Field updater ──────────────────────────────────────────────────────────
    const set = (field: string, value: any) =>
        setInvoice((prev: any) => ({ ...prev, [field]: value }));

    const setCustomer = (field: string, value: string) =>
        setInvoice((prev: any) => ({ ...prev, customer: { ...prev.customer, [field]: value } }));

    const setBank = (field: string, value: string) =>
        setInvoice((prev: any) => ({ ...prev, bankDetails: { ...prev.bankDetails, [field]: value } }));

    const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

    // ── States ─────────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", }}>
            <div style={{ textAlign: "center", color: "#888" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}></div>
                <div style={{ fontSize: 14 }}>Loading invoice…</div>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f4f4f0" }}>
            <div style={{ textAlign: "center", color: "#c00" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 14 }}>Failed to load invoice: {error}</div>
            </div>
        </div>
    );

    if (!invoice) return null;

    const customer = invoice.customer;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 ">
            <div className="bg-white w-[900px] p-6 space-y-6 shadow-xl overflow-auto max-h-[90vh] pt-0">

                <div className="flex justify-between items-center p-5 sticky border-b top-0 bg-white z-10">
                    <h2 className="text-2xl font-semibold">
                        {invoice._id ? "Edit Invoice" : "Create Invoice"}
                    </h2>

                    <button onClick={() => router.push("/invoices")} className="text-black-700 bg-gray-200  hover:bg-red-700 pt-3 pb-3 pl-3 pr-3 hover:text-white">✕</button>
                </div>

                <div className="grid grid-cols-3 gap-4">

                    <input
                        value={invoice.invoiceNumber || ""}
                        onChange={(e) => set("invoiceNumber", e.target.value)}
                        placeholder="Invoice Number"
                        readOnly
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                    <input
                        type="date"
                        value={invoice.issueDate?.slice(0, 10)}
                        onChange={(e) => set("issueDate", e.target.value)}
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                    <input
                        type="date"
                        value={invoice.dueDate?.slice(0, 10)}
                        onChange={(e) => set("dueDate", e.target.value)}
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                </div>


                <div className="grid grid-cols-3 gap-4">

                    <select
                        value={invoice.gstType}
                        onChange={(e) => set("gstType", e.target.value)}
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="CGST_SGST">CGST + SGST</option>
                        <option value="IGST">IGST</option>
                    </select>

                    <input
                        value={invoice.placeOfSupply}
                        onChange={(e) => set("placeOfSupply", e.target.value)}
                        placeholder="Place of Supply"
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                    <input
                        value={invoice.hsn}
                        onChange={(e) => set("hsn", e.target.value)}
                        placeholder="HSN/SAC Code"
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                </div>
                {/* Customer */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Customer</label>

                    <input
                        value={invoice.customer?.companyName || ""}
                        onChange={(e) => {
                            setCustomer("companyName", e.target.value);
                            setCustomerSearch(e.target.value);
                        }}
                        placeholder="Search customer..."
                        className="border p-2 rounded w-full"
                    />

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="border rounded bg-white shadow">
                            {suggestions.map((c: any) => (
                                <div
                                    key={c._id}
                                    onClick={() => {
                                        selectCustomer(c);
                                        setSuggestions([]);
                                    }}
                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                >
                                    {c.companyName || c.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Project */}
                <input
                    value={invoice.projectName || ""}
                    onChange={(e) => set("projectName", e.target.value)}
                    placeholder="Project Name"
                    className="border p-2 rounded w-full"
                />

                {/* Items */}
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="font-medium">Items</span>
                        <button onClick={addItem} className="text-blue-600 text-sm">
                            + Add
                        </button>
                    </div>

                    {invoice.items.map((item: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-4 gap-2">
                            <input
                                value={item.name}
                                onChange={(e) => updateItem(idx, "name", e.target.value)}
                                placeholder="Item"
                                className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateItem(idx, "rate", e.target.value)}
                                className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <div className="p-2 text-right font-medium">
                                ₹{fmt(item.total || 0)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="border rounded p-4 space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{fmt(subtotal)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span>Discount %</span>
                        <input
                            type="number"
                            value={invoice.discount || 0}
                            onChange={(e) => set("discount", Number(e.target.value))}
                            className="border p-2 rounded w-24"
                        />
                    </div>
                    <div className="flex justify-between">
                        <span>GST (18%)</span>
                        <span>₹{fmt(gst)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{fmt(total)}</span>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="font-medium">Milestones</span>
                        <button
                            onClick={() =>
                                set("milestones", [
                                    ...invoice.milestones,
                                    { label: "", percent: 0, paid: false },
                                ])
                            }
                            className="text-blue-600 text-sm"
                        >
                            + Add
                        </button>
                    </div>

                    {invoice.milestones.map((m: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-3 gap-2">

                            <input
                                value={m.label}
                                onChange={(e) => {
                                    const updated = [...invoice.milestones];
                                    updated[idx].label = e.target.value;
                                    set("milestones", updated);
                                }}
                                placeholder="Milestone"
                                className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />

                            <input
                                type="number"
                                value={m.percent}
                                onChange={(e) => {
                                    const updated = [...invoice.milestones];
                                    updated[idx].percent = Number(e.target.value);
                                    set("milestones", updated);
                                }}
                                className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />

                            <input
                                type="checkbox"
                                checked={m.paid}
                                onChange={(e) => {
                                    const updated = [...invoice.milestones];
                                    updated[idx].paid = e.target.checked;
                                    set("milestones", updated);
                                }}
                            />

                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">

                    <input
                        value={invoice.bankDetails?.accountName || ""}
                        onChange={(e) => setBank("accountName", e.target.value)}
                        placeholder="Account Name"
                        readOnly
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                    <input
                        value={invoice.bankDetails?.accountNumber || ""}
                        onChange={(e) => setBank("accountNumber", e.target.value)}
                        placeholder="Account Number"
                        readOnly
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                    <input
                        value={invoice.bankDetails?.ifsc || ""}
                        onChange={(e) => setBank("ifsc", e.target.value)}
                        placeholder="IFSC"
                        readOnly
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                    <input
                        value={invoice.bankDetails?.bank || ""}
                        onChange={(e) => setBank("bank", e.target.value)}
                        placeholder="Bank Name"
                        readOnly
                        className="border rounded-xl px-4 py-3 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />

                </div>


                {/* Notes */}
                <textarea
                    value={invoice.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Notes"
                    className="border p-2 rounded w-full"
                />

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleSave}
                        className="bg-black text-white px-6 py-2 rounded"
                    >
                        {saving ? "Saving..." : "Save Invoice"}
                    </button>
                </div>
            </div>
        </div>
    );
}