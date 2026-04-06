"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";

export default function LeadsTable({ leads, refresh }: any) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const deleteLead = async (id: string) => {
    await apiFetch(`/leads/${id}`, { method: "DELETE" });
    refresh();
  };
  const changeStatus = async (id: string, status: string) => {
    await apiFetch(`/leads/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  return (
    <div className="w-full h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* TABLE SCROLL */}
      <div className="h-full overflow-auto">

        <table className="w-full min-w-[1100px] text-sm">

          {/* HEADER */}
          <thead className="bg-gray-50 border-b sticky top-0 z-10">
            <tr className="text-left text-xs text-gray-500 uppercase">

              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>

            </tr>
          </thead>

          {/* BODY */}
          <tbody>

            {leads.map((lead: any) => (

              <tr
                key={lead._id}
                className="border-b hover:bg-gray-50 transition"
              >

                {/* COMPANY */}
                <td className="px-4 py-3 font-medium text-gray-900">
                  {lead.companyName || "-"}
                </td>

                {/* CONTACT */}
                <td className="px-4 py-3">
                  {lead.name || "-"}
                </td>

                {/* PHONE */}
                <td className="px-4 py-3 text-gray-600">
                  {lead.phone || "-"}
                </td>

                {/* EMAIL */}
                <td className="px-4 py-3 text-gray-600">
                  {lead.email || "-"}
                </td>

                {/* SOURCE */}
                <td className="px-4 py-3 text-gray-600">
                  {lead.source || "-"}
                </td>

                {/* STATUS */}
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                    {lead.status}
                  </span>
                </td>

                {/* NOTES */}
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {lead.notes || "-"}
                  </p>
                </td>

                {/* DATE */}
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 text-right">

                  <div className="relative flex justify-end">

                    {/* 3 DOT BUTTON */}
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === lead._id ? null : lead._id)
                      }
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      ⋯
                    </button>

                    {/* DROPDOWN */}
                    {openMenu === lead._id && (
                      <div className="absolute right-0 top-7 w-40 bg-white border rounded-lg shadow-lg z-20">

                        {/* CHANGE STATUS */}
                        <div className="px-3 py-2 text-xs text-gray-500 border-b">
                          Change Status
                        </div>

                        {["New", "Contacted", "Negotiation", "Qualified", "Converted", "Lost"].map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() => {
                                changeStatus(lead._id, status);
                                setOpenMenu(null);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              {status}
                            </button>
                          )
                        )}

                        <div className="border-t my-1" />

                        {/* EDIT */}
                        <button
                          onClick={() => {
                            openEdit(lead);
                            setOpenMenu(null);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          ✏️ Edit
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => {
                            deleteLead(lead._id);
                            setOpenMenu(null);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          🗑 Delete
                        </button>

                      </div>
                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
    </div>
  );
}