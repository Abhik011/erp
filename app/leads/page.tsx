"use client";

import { useEffect, useState } from "react";
import LeadsTable from "./LeadsTable";
import LeadsPipeline from "./LeadsPipeline";
import LeadFormModal from "./LeadFormModal";

import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function LeadsPage() {
  const { ready, companyId } = useCompany();

  const [leads, setLeads] = useState<any[]>([]);
  const [view, setView] = useState("table");
  const [showForm, setShowForm] = useState(false);

  const fetchLeads = async () => {
    const res = await apiFetch("/leads");
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!ready || !companyId) return;
    fetchLeads();
  }, [ready, companyId]);

  return (
    <div className="h-screen flex flex-col px-6 py-5 overflow-hidden">

      {/* HEADER (FIXED) */}
      <div className="max-w-7xl flex justify-between items-center mb-4 shrink-0">

        <h1 className="text-2xl font-semibold tracking-tight">
          Leads
        </h1>

        <button
          onClick={() => setShowForm(true)}
          className="bg-[#f7e414] text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          + New Lead
        </button>

      </div>

      {/* CARD */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

        {/* TABS (FIXED) */}
        <div className="flex gap-2 p-4 border-b shrink-0">

          <button
            onClick={() => setView("table")}
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              view === "table"
                ? "bg-[#f7e414] text-black shadow-sm"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Table
          </button>

          <button
            onClick={() => setView("pipeline")}
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              view === "pipeline"
                ? "bg-[#f7e414] text-black shadow-sm"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Pipeline
          </button>

        </div>

        {/* SCROLLABLE CONTENT ONLY */}
        <div className="flex-1 overflow-hidden">

          {/* TABLE */}
          {view === "table" && (
            <div className="h-full overflow-hidden p-4">
              <LeadsTable leads={leads} refresh={fetchLeads} />
            </div>
          )}

          {/* PIPELINE */}
          {view === "pipeline" && (
            <div className="max-w-6xl h-full overflow-hidden p-4">
              <LeadsPipeline
                leads={leads}
                refresh={fetchLeads}
                onAddLead={() => setShowForm(true)}
              />
            </div>
          )}

        </div>

      </div>

      {/* MODAL */}
      {showForm && (
        <LeadFormModal
          close={() => setShowForm(false)}
          refresh={fetchLeads}
        />
      )}

    </div>
  );
}