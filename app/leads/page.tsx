"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import LeadsTable from "./LeadsTable";
import LeadsPipeline from "./LeadsPipeline";
import LeadFormModal from "./LeadFormModal";
import LeadImportModal from "./LeadImportModal";
import FollowUpModal from "./FollowUpModal";

import { UploadCloud } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

const socket = io(
  process.env.NEXT_PUBLIC_API_URL!,
  {
    transports: ["websocket"]
  }
);

export default function LeadsPage() {

  const { ready, companyId } =
    useCompany();

  const [selectedLead, setSelectedLead] =
    useState<any>(null);

  const [editModalOpen, setEditModalOpen] =
    useState(false);

  const [leads, setLeads] =
    useState<any[]>([]);

  const [view, setView] =
    useState("table");

  const [showForm, setShowForm] =
    useState(false);

  const [showImport, setShowImport] =
    useState(false);

  const [followLead, setFollowLead] =
    useState<any>(null);

  const fetchLeads =
    async () => {

      const res =
        await apiFetch(
          "/leads"
        );

      const data =
        await res.json();

      setLeads(
        Array.isArray(data)
          ? data
          : []
      );

    };

  const addFollowUp =
    (lead: any) => {

      setEditModalOpen(
        false
      );

      setSelectedLead(
        null
      );

      setFollowLead(
        lead
      );

    };

  /* INITIAL LOAD */

  useEffect(() => {

    if (
      !ready ||
      !companyId
    ) return;

    fetchLeads();

  }, [
    ready,
    companyId
  ]);



  /* LIVE SOCKET */

  useEffect(() => {

    socket.on(
      "lead_updated",
      (
        updatedLead
      ) => {

        setLeads(
          prev =>
            prev.map(
              lead =>
                lead._id ===
                  updatedLead._id
                  ? updatedLead
                  : lead
            )
        );

      });

    socket.on(
      "lead_created",
      (
        newLead
      ) => {

        setLeads(
          prev => [
            newLead,
            ...prev
          ]
        );

      });

    socket.on(
      "lead_deleted",
      (
        deletedId
      ) => {

        setLeads(
          prev =>
            prev.filter(
              lead =>
                lead._id !==
                deletedId
            )
        );

      });

    return () => {

      socket.off(
        "lead_updated"
      );

      socket.off(
        "lead_created"
      );

      socket.off(
        "lead_deleted"
      );

    };

  }, []);



  return (

    <div className="h-full flex flex-col overflow-hidden">

      {/* HEADER */}

      <div className=" flex justify-between items-center mb-10">

        <h1 className="text-2xl font-semibold">

          Leads

        </h1>

        <div className="flex gap-3">

          <button
            onClick={() =>
              setShowImport(
                true
              )
            }
            className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 rounded-xl"
          >

            <UploadCloud
              size={16}
            />

            Import Leads

          </button>

          <button
            onClick={() =>
              setShowForm(
                true
              )
            }
            className="bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] text-white px-4 py-2 rounded-xl"
          >

            + New Lead

          </button>

        </div>

      </div>

      {/* CONTENT */}
      {/* TABS */}

      <div className="flex gap-2 p-4  shrink-0">

        <button
          onClick={() =>
            setView("table")
          }
          className={`px-4 py-1.5 text-sm rounded-lg transition ${view === "table"
            ? "bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100"
            }`}
        >
          Table
        </button>

        <button
          onClick={() =>
            setView("pipeline")
          }
          className={`px-4 py-1.5 text-sm rounded-lg transition ${view === "pipeline"
            ? "bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100"
            }`}
        >
          Pipeline
        </button>

      </div>
      <div className="flex-1 overflow-hidden">

        {view === "table" && (

          <div className="h-[calc(100vh-145px)] overflow-auto rounded-2xl ">

            <LeadsTable
              leads={leads}
              refresh={fetchLeads}
              openEdit={(lead) => {

                setSelectedLead(
                  lead
                );

                setEditModalOpen(
                  true
                );

              }}
              addFollowUp={
                addFollowUp
              }
            />

          </div>

        )}

        {view === "pipeline" && (

          <LeadsPipeline
            leads={leads}
            refresh={fetchLeads}
            onAddLead={() =>
              setShowForm(
                true
              )}
          />

        )}

      </div>

      {/* MODALS */}

      {showForm && (

        <LeadFormModal
          close={() =>
            setShowForm(
              false
            )
          }
          refresh={
            fetchLeads
          }
        />

      )}

      {showImport && (

        <LeadImportModal
          open={
            showImport
          }
          close={() =>
            setShowImport(
              false
            )}
        />

      )}

      {editModalOpen &&
        selectedLead && (

          <LeadFormModal
            lead={
              selectedLead
            }
            close={() => {
              setEditModalOpen(
                false
              );

              setSelectedLead(
                null
              );
            }}
            refresh={
              fetchLeads
            }
          />

        )}

      {followLead && (

        <FollowUpModal
          lead={
            followLead
          }
          close={() =>
            setFollowLead(
              null
            )
          }
          refresh={
            fetchLeads
          }
        />

      )}

    </div>

  );

}