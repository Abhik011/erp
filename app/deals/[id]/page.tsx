"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DealView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch deal ───────────────────────────────
  useEffect(() => {
    if (!API || !id) return;

    fetch(`${API}/deals/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setDeal(data);
        setLoading(false);
      });
  }, [id]);

  // ── Save deal ───────────────────────────────
  const handleSave = async () => {
    try {
      await fetch(`${API}/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deal),
      });

      alert("Deal updated");
    } catch {
      alert("Failed to save");
    }
  };

  // ── Update status ───────────────────────────
  const updateStatus = async (status: string) => {
    const res = await fetch(`${API}/deals/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const updated = await res.json();
    setDeal(updated);
  };

  const set = (field: string, value: any) =>
    setDeal((prev: any) => ({ ...prev, [field]: value }));

  if (loading) return <div style={{ padding: 40 }}>Loading deal...</div>;
  if (!deal) return null;

  return (
    <div style={{ padding: 30, fontFamily: "IBM Plex Sans", maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>
          {deal.title}
        </h2>

        <button
          onClick={() => router.push("/deals")}
          style={{
            border: "1px solid #ddd",
            padding: "6px 12px",
            borderRadius: 8,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      {/* Status */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["New", "Proposal Sent", "In Progress", "Completed", "Won", "Lost"].map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              background: deal.status === s ? "#1a1a1a" : "#eee",
              color: deal.status === s ? "#fff" : "#555",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Title */}
        <input
          value={deal.title || ""}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Deal Title"
          style={inputStyle}
        />

        {/* Service */}
        <input
          value={deal.service || ""}
          onChange={(e) => set("service", e.target.value)}
          placeholder="Service"
          style={inputStyle}
        />

        {/* Value */}
        <input
          type="number"
          value={deal.value || 0}
          onChange={(e) => set("value", Number(e.target.value))}
          placeholder="Deal Value"
          style={inputStyle}
        />

        {/* Deadline */}
        <input
          type="date"
          value={deal.deadline ? deal.deadline.slice(0, 10) : ""}
          onChange={(e) => set("deadline", e.target.value)}
          style={inputStyle}
        />

        {/* Priority */}
        <select
          value={deal.priority || ""}
          onChange={(e) => set("priority", e.target.value)}
          style={inputStyle}
        >
          <option value="">Select Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Notes */}
        <textarea
          value={deal.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Notes"
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />

      </div>

      {/* Actions */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button
          onClick={handleSave}
          style={{
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Save Deal
        </button>

        <button
          onClick={() => router.push(`/invoices/new?deal=${deal._id}`)}
          style={{
            background: "#111",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Create Invoice
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  border: "1px solid #e5e5e5",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  width: "100%",
};