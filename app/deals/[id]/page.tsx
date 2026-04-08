"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function DealView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { ready, companyId } = useCompany();

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !companyId || !id) return;

    apiFetch(`/deals/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setDeal(data);
        setLoading(false);
      });
  }, [id, ready, companyId]);

  // ── Save deal ───────────────────────────────
  const handleSave = async () => {
    try {
      await apiFetch(`/deals/${id}`, {
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
    const res = await apiFetch(`/deals/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });


    setDeal((prev: any) => ({
      ...prev,
      status, // only update status
    }));
  };

  const set = (field: string, value: any) =>
    setDeal((prev: any) => ({ ...prev, [field]: value }));

  if (loading) return <div style={{ padding: 40 }}>Loading deal...</div>;
  if (!deal) return null;

return (
  <div className="max-w-4xl mx-auto p-6">

    {/* CARD */}
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {deal.title || "Untitled Deal"}
          </h2>
          <p className="text-sm text-gray-500">
            Manage deal details & progress
          </p>
        </div>

        <button
          onClick={() => router.push("/deals")}
          className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>

      {/* STATUS */}
      <div className="flex flex-wrap gap-2">

        {["New", "Proposal Sent", "In Progress", "Completed", "Won", "Lost"].map((s) => {

          const isActive = deal.status === s;

          const colors: any = {
            New: "bg-blue-100 text-blue-700",
            "Proposal Sent": "bg-purple-100 text-purple-700",
            "In Progress": "bg-yellow-100 text-yellow-700",
            Completed: "bg-indigo-100 text-indigo-700",
            Won: "bg-green-100 text-green-700",
            Lost: "bg-red-100 text-red-600",
          };

          return (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition
                ${isActive
                  ? "bg-black text-white"
                  : `${colors[s]} hover:opacity-80`
                }
              `}
            >
              {s}
            </button>
          );
        })}

      </div>

      {/* FORM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input
          value={deal.title || ""}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Deal Title"
          className="input"
        />

        <input
          value={deal.service || ""}
          onChange={(e) => set("service", e.target.value)}
          placeholder="Service"
          className="input"
        />

        <input
          type="number"
          value={deal.value || 0}
          onChange={(e) => set("value", Number(e.target.value))}
          placeholder="Deal Value"
          className="input"
        />

        <input
          type="date"
          value={deal.deadline ? deal.deadline.slice(0, 10) : ""}
          onChange={(e) => set("deadline", e.target.value)}
          className="input"
        />

        {/* PRIORITY */}
        <select
          value={deal.priority || ""}
          onChange={(e) => set("priority", e.target.value)}
          className="input"
        >
          <option value="">Select Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* EMPTY SPACE FOR ALIGNMENT */}
        <div />

        {/* NOTES FULL WIDTH */}
        <textarea
          value={deal.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Notes"
          rows={4}
          className="input md:col-span-2 resize-none"
        />

      </div>

      {/* ACTIONS */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 ">

        <button
          onClick={handleSave}
          className="bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          Save Deal
        </button>

        <button
          onClick={() => router.push(`/invoices/new?deal=${deal._id}`)}
          className="bg-black text-white px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          Create Invoice
        </button>

      </div>

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