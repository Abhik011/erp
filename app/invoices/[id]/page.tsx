"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;
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
                    { label: "Design", percent: 30, paid: false },
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
    const params = useParams();
    const id = params?.id;
    const isNew = id === "new";
    const [invoice, setInvoice] = useState<any>(null);
    const agency = invoice?.agency || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
        if (!id || !API) return;

        const loadData = async () => {
            try {
                setLoading(true);

                // ✅ PARALLEL FETCH
                const [agencyRes, invoiceRes] = await Promise.all([
                    fetch(`${API}/agencies`),
                    id === "new" ? null : fetch(`${API}/invoices/${id}`)
                ]);

                const agencyDataRaw = await agencyRes.json();
                const agencyData = Array.isArray(agencyDataRaw)
                    ? agencyDataRaw[0]
                    : agencyDataRaw;

                let invoiceData = {};

                if (id !== "new" && invoiceRes) {
                    if (!invoiceRes.ok) throw new Error(`HTTP ${invoiceRes.status}`);
                    const data = await invoiceRes.json();
                    invoiceData = data;
                }

                // ✅ NORMALIZE FIRST
                const normalized = normalizeInvoice(invoiceData);

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

    }, [id]);

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

            customer: c,

            customerGSTIN: c.gstNumber || "",

            projectName: c.companyName || c.name || "",

            placeOfSupply: c.state || "", // 🔥 ADD THIS

            projectDescription: `Project for ${c.companyName || c.name}`, // 🔥 ADD
        }));
    };

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

            const res = await fetch(`${API}/invoices/${invoice._id}`, {
                method: "PUT",
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
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f4f4f0" }}>
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
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#ffffff", minHeight: "100vh", padding: "2px 0px" }}>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

            <div style={{ maxWidth: 900, margin: "0 auto" }}>

                {/* ── Top action bar ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                        {["Pending", "Paid", "Overdue", "Draft"].map((s) => (
                            <button
                                key={s}
                                onClick={() => set("paymentStatus", s)}
                                style={{
                                    padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                                    background: invoice.paymentStatus === s ? "#1a1a1a" : "#e5e5e0",
                                    color: invoice.paymentStatus === s ? "#fff" : "#555",
                                }}
                            >{s}</button>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => handlePrint()}
                            style={{
                                padding: "8px 16px",
                                border: "1px solid #ccc",
                                borderRadius: 8,
                                background: "#fff",
                                fontSize: 13,
                                cursor: "pointer"
                            }}
                        >
                            Print
                        </button>
                        <button
                            onClick={handleSave}
                            style={{ padding: "8px 20px", borderRadius: 8, background: "#1a1a1a", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >{saving ? "Saving…" : "Save Invoice"}</button>
                    </div>
                </div>

                {/* ── Main card ── */}
                <div id="invoice-print" style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>

                    {/* Dark header */}
                    <div style={{ background: "#0f0f0e", padding: "36px 40px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 12,
                                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden",
                                }}
                            >

                                {agency.logo ? (
                                    <img
                                        src={agency.logo}
                                        alt="logo"
                                        style={{
                                            width: "70%",
                                            height: "70%",
                                            objectFit: "contain",
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <span
                                        style={{
                                            fontFamily: "'IBM Plex Mono'",
                                            fontWeight: 700,
                                            fontSize: 16,
                                            color: "#fff",
                                        }}
                                    >
                                        CT
                                    </span>
                                )}

                            </div>
                            <div>
                                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{agency.name || "CREONOX TECHNOLOGIES"}</div>
                                <div style={{ color: "#bbb", fontSize: 12, marginTop: 2 }}>{agency.tagline}</div>
                                <div style={{ color: "#bbb", fontSize: 11, marginTop: 6, lineHeight: 1.6 }}>
                                    {(agency?.address || "").split("\n").map((l:string, i:number) => (
                                        <div key={i}>{l}</div>
                                    ))}
                                    <div style={{ fontSize: 11, color: "#bbb" }}>
                                        {agency?.email && <div>{agency.email}</div>}
                                        {agency?.phone && <div>{agency.phone}</div>}
                                        {agency?.website && <div>{agency.website}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#bbb", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Invoice</div>
                            <div style={{ color: "#fff", fontFamily: "'IBM Plex Mono'", fontSize: 22, fontWeight: 600 }}>#{invoice.invoiceNumber}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, alignItems: "flex-end" }}>
                                {[
                                    ["Issued", new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
                                    ["Due", new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
                                    ["Terms", invoice.paymentTerms],
                                ].map(([label, val]) => (
                                    <div key={label} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <span style={{ color: "#bbb", fontSize: 11 }}>{label}</span>
                                        <span style={{ color: "#ccc", fontSize: 12, fontWeight: 500 }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Status + project bar */}
                    <div style={{ background: "#f9f9f7", borderBottom: "1px solid #eee", padding: "14px 40px", display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{
                            display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            background: invoice.paymentStatus === "Paid" ? "#ecfdf5" : invoice.paymentStatus === "Overdue" ? "#fef2f2" : "#fffbeb",
                            color: invoice.paymentStatus === "Paid" ? "#065f46" : invoice.paymentStatus === "Overdue" ? "#991b1b" : "#92400e",
                            border: `1px solid ${invoice.paymentStatus === "Paid" ? "#6ee7b7" : invoice.paymentStatus === "Overdue" ? "#fca5a5" : "#fcd34d"}`,
                        }}>{invoice.paymentStatus}</span>
                        <div style={{ flex: 1 }}>
                            <input
                                value={invoice.projectName || ""}
                                onChange={(e) => set("projectName", e.target.value)}
                                style={{ border: "none", background: "transparent", fontSize: 14, fontWeight: 600, color: "#1a1a1a", width: "100%", outline: "none" }}
                                placeholder="Project Name"
                            />
                        </div>
                        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>₹{fmt(total)}</div>
                    </div>

                    <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32 }}>

                        {/* ── Bill To + GST ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                            {/* Customer — all fields editable */}
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Bill To</div>
                                {[
                                    ["Company Name", "companyName", "text"], // ✅ FIX
                                    ["Contact Person", "name", "text"],
                                    ["Email", "email", "email"],
                                    ["Phone", "phone", "tel"],
                                ].map(([label, field, type]) => (
                                    <div key={field} style={{ marginBottom: 8 }}>
                                        <div style={{ fontSize: 10, color: "#bbb", marginBottom: 2 }}>{label}</div>
                                        <input
                                            type={type}
                                            value={customer[field] || ""}
                                            onChange={(e) => setCustomer(field, e.target.value)}
                                            placeholder={label as string}
                                            style={{ border: "1px solid #eee", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontWeight: field === "name" ? 600 : 400 }}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <div style={{ fontSize: 10, color: "#bbb", marginBottom: 2 }}>Address</div>
                                    <textarea
                                        value={customer.address || ""}
                                        onChange={(e) => setCustomer("address", e.target.value)}
                                        rows={2}
                                        placeholder="Full address"
                                        style={{ border: "1px solid #eee", borderRadius: 8, padding: "6px 10px", fontSize: 12, width: "100%", boxSizing: "border-box", fontFamily: "inherit", resize: "none", color: "#666" }}
                                    />
                                </div>
                            </div>

                            {/* GST Details */}
                            <div style={{ background: "#f9f9f7", borderRadius: 12, padding: "16px 20px" }}>
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>GST Details</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>GST Type</div>
                                        <select
                                            value={invoice.gstType}
                                            onChange={(e) => set("gstType", e.target.value)}
                                            style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: "100%", background: "#fff" }}
                                        >
                                            <option value="CGST_SGST">CGST + SGST (9% + 9%)</option>
                                            <option value="IGST">IGST (18%)</option>
                                        </select>
                                    </div>
                                    {([
                                        ["Customer GSTIN", "customerGSTIN", "29AAXCG1234D1ZK"],
                                        ["Agency GSTIN", "agencyGSTIN", "27AABCT1234C1Z5"],
                                        ["Place of Supply", "placeOfSupply", "Maharashtra"],
                                        ["HSN / SAC Code", "hsn", "998314"],
                                    ] as [string, string, string][]).map(([label, key, ph]) => (
                                        <div key={key}>
                                            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>{label}</div>
                                            <input
                                                value={invoice[key] || ""}
                                                onChange={(e) => set(key, e.target.value)}
                                                placeholder={ph}
                                                style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", background: "#fff" }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Project Scope ── */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#616161", textTransform: "uppercase", marginBottom: 8 }}>Project Scope</div>
                            <textarea
                                value={invoice.projectDescription}
                                onChange={(e) => set("projectDescription", e.target.value)}
                                rows={2}
                                style={{ width: "100%", border: "1px solid #e8e8e8", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#444", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                            />
                        </div>

                        {/* ── Line Items ── */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#616161", textTransform: "uppercase" }}>Services / Line Items</div>
                                <button onClick={addItem} className="no-print" style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>+ Add Item</button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 36px", gap: 8, padding: "8px 12px", background: "#f9f9f7", borderRadius: 8, marginBottom: 6 }}>
                                {["Description", "Qty", "Rate (₹)", "Amount (₹)", ""].map((h, i) => (
                                    <div key={i} style={{ fontSize: 11, fontWeight: 600, color: "#616161", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
                                ))}
                            </div>

                            {invoice.items.map((item: any, idx: number) => (
                                <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 36px", gap: 8, marginBottom: 6, alignItems: "start" }}>
                                    <div>
                                        <input
                                            value={item.name}
                                            onChange={(e) => updateItem(idx, "name", e.target.value)}
                                            placeholder="Service name"
                                            style={{ width: "100%", border: "1px solid #e8e8e8", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 500, boxSizing: "border-box" }}
                                        />
                                        <input
                                            value={item.description || ""}
                                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                                            placeholder="Brief description…"
                                            style={{ width: "100%", border: "none", padding: "4px 10px 0", fontSize: 11, color: "#999", boxSizing: "border-box", background: "transparent" }}
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                        style={{ border: "1px solid #e8e8e8", borderRadius: 8, padding: "8px 10px", fontSize: 13, textAlign: "center" }}
                                    />
                                    <input
                                        type="number"
                                        value={item.rate}
                                        onChange={(e) => updateItem(idx, "rate", e.target.value)}
                                        style={{ border: "1px solid #e8e8e8", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}
                                    />
                                    <div style={{ padding: "8px 10px", background: "#f9f9f7", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#1a1a1a", textAlign: "right" }}>
                                        {fmt(item.total || 0)}
                                    </div>
                                    <button onClick={() => removeItem(idx)} className="no-print" style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16, padding: "6px" }}>×</button>
                                </div>
                            ))}
                        </div>

                        {/* ── Milestones + Totals ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                            {/* Milestones */}
                            <div>
                                {/* Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase" }}>
                                        Payment Milestones
                                    </div>

                                    <button
                                        onClick={() => {
                                            set("milestones", [
                                                ...invoice.milestones,
                                                { label: "", percent: 0, paid: false }
                                            ]);
                                        }}
                                        className="no-print"
                                        style={{
                                            fontSize: 12,
                                            color: "#7c3aed",
                                            border: "none",
                                            background: "none",
                                            cursor: "pointer",
                                            fontWeight: 600
                                        }}
                                    >
                                        + Add
                                    </button>
                                </div>

                                {/* List */}
                                {invoice.milestones.map((m: any, i: number) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>

                                        {/* Paid toggle */}
                                        <button
                                            onClick={() => {
                                                const milestones = invoice.milestones.map((ms: any, j: number) =>
                                                    j === i ? { ...ms, paid: !ms.paid } : ms
                                                );
                                                set("milestones", milestones);
                                            }}
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 6,
                                                border: "2px solid",
                                                cursor: "pointer",
                                                borderColor: m.paid ? "#7c3aed" : "#ddd",
                                                background: m.paid ? "#7c3aed" : "transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fff",
                                                fontSize: 11,
                                            }}
                                        >
                                            {m.paid ? "✓" : ""}
                                        </button>

                                        {/* Label */}
                                        <input
                                            value={m.label}
                                            onChange={(e) => {
                                                const milestones = invoice.milestones.map((ms: any, j: number) =>
                                                    j === i ? { ...ms, label: e.target.value } : ms
                                                );
                                                set("milestones", milestones);
                                            }}
                                            placeholder="Milestone name"
                                            style={{
                                                flex: 1,
                                                border: "none",
                                                background: "transparent",
                                                fontSize: 13,
                                                outline: "none"
                                            }}
                                        />

                                        {/* Percent (NEW ✨) */}
                                        <input
                                            type="number"
                                            value={m.percent}
                                            onChange={(e) => {
                                                const milestones = invoice.milestones.map((ms: any, j: number) =>
                                                    j === i ? { ...ms, percent: Number(e.target.value) } : ms
                                                );
                                                set("milestones", milestones);
                                            }}
                                            style={{
                                                width: 60,
                                                border: "1px solid #eee",
                                                borderRadius: 6,
                                                padding: "4px 6px",
                                                fontSize: 12,
                                                textAlign: "center"
                                            }}
                                        />

                                        {/* Amount */}
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                fontFamily: "'IBM Plex Mono'",
                                                color: m.paid ? "#7c3aed" : "#aaa",
                                                width: 90,
                                                textAlign: "right"
                                            }}
                                        >
                                            ₹{fmt(Math.round(total * (m.percent || 0) / 100))}
                                        </div>

                                        {/* Remove */}
                                        <button
                                            onClick={() => {
                                                const milestones = invoice.milestones.filter((_: any, j: number) => j !== i);
                                                set("milestones", milestones);
                                            }}
                                            className="no-print"
                                            style={{
                                                border: "none",
                                                background: "none",
                                                cursor: "pointer",
                                                color: "#ccc",
                                                fontSize: 14
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                {/* TOTAL CHECK */}
                                <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                                    Total:{" "}
                                    <b>
                                        {invoice.milestones.reduce((sum: number, m: any) => sum + Number(m.percent || 0), 0)}%
                                    </b>
                                </div>

                                {/* ⚠️ Warning */}
                                {invoice.milestones.reduce((sum: number, m: any) => sum + Number(m.percent || 0), 0) !== 100 && (
                                    <div style={{ color: "red", fontSize: 11 }}>
                                        Total must be 100%
                                    </div>
                                )}

                                {/* Bank Details (unchanged) */}
                                <div style={{ marginTop: 20, background: "#f9f9f7", borderRadius: 10, padding: "14px 16px" }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
                                        Bank Details
                                    </div>

                                    {[
                                        ["Account Name", "accountName"],
                                        ["Account Number", "accountNumber"],
                                        ["IFSC Code", "ifsc"],
                                        ["Bank", "bank"],
                                    ].map(([label, key]) => (
                                        <div key={key} style={{ marginBottom: 8 }}>
                                            <div style={{ fontSize: 10, color: "#bbb", marginBottom: 2 }}>{label}</div>
                                            <input
                                                value={
                                                    invoice.bankDetails?.[key] ||
                                                    invoice?.agency?.bankDetails?.[key] ||
                                                    ""
                                                }
                                                readOnly
                                                placeholder={label}
                                                style={{
                                                    border: "1px solid #e8e8e8",
                                                    borderRadius: 6,
                                                    padding: "5px 8px",
                                                    fontSize: 12,
                                                    width: "100%",
                                                    background: "#fff",
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary totals */}
                            <div style={{ background: "#f9f9f7", borderRadius: 12, padding: "20px 24px" }}>
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginBottom: 16 }}>Summary</div>

                                {[
                                    ["Subtotal", fmt(subtotal)],
                                    ...(invoice.discount > 0 ? [[`Discount (${invoice.discount}%)`, `−₹${fmt(discountAmt)}`]] : []),
                                    ["Taxable Amount", fmt(taxable)],
                                    ...(invoice.gstType === "CGST_SGST"
                                        ? [["CGST (9%)", fmt(cgst)], ["SGST (9%)", fmt(sgst)]]
                                        : [["IGST (18%)", fmt(gst)]]),
                                ].map(([label, val]) => (
                                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 10 }}>
                                        <span>{label}</span>
                                        <span style={{ fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>₹{val}</span>
                                    </div>
                                ))}

                                <div style={{ borderTop: "2px solid #e0e0e0", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                                    <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>₹{fmt(total)}</span>
                                </div>

                                {/* Discount */}
                                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #e8e8e8" }}>
                                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>Discount (%)</div>
                                    <input
                                        type="number" min={0} max={100}
                                        value={invoice.discount}
                                        onChange={(e) => set("discount", Number(e.target.value))}
                                        style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                                    />
                                </div>

                                {/* Due Date */}
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>Due Date</div>
                                    <input
                                        type="date"
                                        value={invoice.dueDate ? invoice.dueDate.slice(0, 10) : ""}
                                        onChange={(e) => set("dueDate", new Date(e.target.value).toISOString())}
                                        style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                                    />
                                </div>

                                {/* Payment Terms */}
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>Payment Terms</div>
                                    <select
                                        value={invoice.paymentTerms}
                                        onChange={(e) => set("paymentTerms", e.target.value)}
                                        style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px", fontSize: 13, width: "100%", background: "#fff" }}
                                    >
                                        {["Net 7", "Net 15", "Net 30", "Due on Receipt", "50% Advance"].map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── Notes ── */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginBottom: 8 }}>Notes</div>
                            <textarea
                                value={invoice.notes}
                                onChange={(e) => set("notes", e.target.value)}
                                rows={2}
                                style={{ width: "100%", border: "1px solid #e8e8e8", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#666", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                            />
                        </div>

                        {/* ── Footer ── */}
                        <div style={{ borderTop: "1px solid #f0f0ee", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 11, color: "#bbb" }}>
                                {[agency?.email, agency?.phone, agency?.website]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 11, color: "#bbb", marginBottom: 24 }}>Authorised Signatory</div>
                                <div style={{ borderTop: "1px solid #ccc", paddingTop: 6, fontSize: 12, fontWeight: 600, color: "#555" }}>{agency.name || "CREONOX TECHNOLOGIES"}</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Save CTA */}
                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={handleSave}
                        style={{ padding: "12px 32px", borderRadius: 10, background: "#0f0f0e", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em" }}
                    >{saving ? "Saving…" : "Save Invoice"}</button>
                </div>
            </div>

            <style>{`
        @media print {
          body { background: #fff !important; }
          button { display: none !important; }
          input, select, textarea { border: none !important; background: transparent !important; }
        }
        input:focus, select:focus, textarea:focus { outline: 2px solid #7c3aed; outline-offset: 1px; border-radius: 8px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
      `}</style>
        </div>
    );
}