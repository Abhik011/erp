"use client";

import { useEffect, useState } from "react";
import LeadsTable from "./LeadsTable";
import LeadsPipeline from "./LeadsPipeline";
import LeadFormModal from "./LeadFormModal";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [view, setView] = useState("table");
  const [showForm, setShowForm] = useState(false);

  const fetchLeads = async () => {
    const res = await fetch(`${API}/leads`);
    const data = await res.json();
    setLeads(data);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className=" mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

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

      {/* MAIN CARD */}
      <div className="bg-white rounded-2xl p-5 ">

        {/* TABS */}
        <div className="flex gap-2 mb-4 ">

          <button
            onClick={() => setView("table")}
            className={`px-4 py-1.5 shadow-sm text-sm rounded-lg transition ${
              view === "table"
                ? "bg-[#f7e414] text-black"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Table
          </button>

          <button
            onClick={() => setView("pipeline")}
            className={`px-4 py-1.5 shadow-sm text-sm rounded-lg transition ${
              view === "pipeline"
                ? "bg-[#f7e414] text-black"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Pipeline
          </button>

        </div>

        {/* CONTENT */}
        <div className="min-h-[300px]">

          {view === "table" && (
            <LeadsTable leads={leads} refresh={fetchLeads} />
          )}

          {view === "pipeline" && (
            <LeadsPipeline leads={leads} />
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