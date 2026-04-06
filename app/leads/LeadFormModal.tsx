"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function LeadFormModal({
  close,
  refresh,
  lead,
}: any) {
  const isEdit = !!lead;

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    source: "",
    notes: "",
    businessType: "",
    priority: "",
    status: "New",
    tags: "",
  });

  // ✅ Pre-fill in edit mode
  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        companyName: lead.companyName || "",
        phone: lead.phone || "",
        email: lead.email || "",
        source: lead.source || "",
        notes: lead.notes || "",
        businessType: lead.businessType || "",
        priority: lead.priority || "",
        status: lead.status || "New",
        tags: (lead.tags || []).join(", "),
      });
    }
  }, [lead]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload = {
      ...form,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim())
        : [],
    };

    if (isEdit) {
      await apiFetch(`/leads/${lead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    refresh();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <form
        onSubmit={handleSubmit}
        className="bg-white w-[520px] rounded-2xl shadow-xl p-6 space-y-4"
      >

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Lead" : "Create Lead"}
          </h2>
          <button onClick={close} type="button">✕</button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-3">

          <input
            placeholder="Name"
            className="input"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <input
            placeholder="Company"
            className="input"
            value={form.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
          />

          <input
            placeholder="Phone"
            className="input"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />

          <input
            placeholder="Email"
            className="input"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          {/* BUSINESS TYPE */}
          <select
            className="input"
            value={form.businessType}
            onChange={(e) => handleChange("businessType", e.target.value)}
          >
            <option value="">Business Type</option>
            <option value="Software">Software</option>
            <option value="Export">Export</option>
          </select>

          {/* PRIORITY */}
          <select
            className="input"
            value={form.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
          >
            <option value="">Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* STATUS */}
          <select
            className="input"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option>New</option>
            <option>Contacted</option>
            <option>Negotiation</option>
            <option>Qualified</option>
            <option>Lost</option>
          </select>

          <input
            placeholder="Source (LinkedIn, Website...)"
            className="input"
            value={form.source}
            onChange={(e) => handleChange("source", e.target.value)}
          />

        </div>

        {/* TAGS */}
        <input
          placeholder="Tags (comma separated)"
          className="input"
          value={form.tags}
          onChange={(e) => handleChange("tags", e.target.value)}
        />

        {/* NOTES */}
        <textarea
          placeholder="Notes"
          className="input h-20 resize-none"
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2">

          <button
            type="button"
            onClick={close}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            Cancel
          </button>

          <button className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">
            {isEdit ? "Update" : "Create"}
          </button>

        </div>

      </form>
    </div>
  );
}