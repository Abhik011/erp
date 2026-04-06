"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

const stages = [
  "New",
  "Contacted",
  "Negotiation",
  "Qualified",
  "Converted",
];

export default function LeadsPipeline({
  leads,
  refresh,
  onAddLead,
}: any) {
  const [data, setData] = useState(leads);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    setData(leads);
  }, [leads]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;

    const updated = data.map((l: any) =>
      l._id === draggableId
        ? { ...l, status: destination.droppableId }
        : l
    );

    setData(updated);

    await apiFetch(`/leads/${draggableId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destination.droppableId }),
    });

    refresh();
  };

  return (
    <>
      {/* PIPELINE */}
     <div className="h-full overflow-scroll">

        <DragDropContext onDragEnd={onDragEnd}>
         <div className="w-full flex gap-5 min-w-max w-fit px-2 pb-4 items-start">

            {stages.map((stage) => {
              const stageLeads = data.filter(
                (l: any) => l.status === stage
              );

              return (
                <Droppable droppableId={stage} key={stage}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-[240px] max-h-full flex-shrink-0 bg-[#f9f9f7] border border-gray-200 rounded-2xl flex flex-col"
                    >

                      {/* HEADER */}
                      <div className="px-3 py-3 border-b bg-[#f9f9f7] rounded-t-2xl z-10 backdrop-blur">

                        <div className="flex justify-between items-center">
                          <h2 className="text-sm font-semibold text-gray-700">
                            {stage}
                          </h2>

                          <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full">
                            {stageLeads.length}
                          </span>
                        </div>

                        <button
                          onClick={() => onAddLead?.(stage)}
                          className="text-xs text-violet-600 mt-2 hover:underline"
                        >
                          + Add Lead
                        </button>

                      </div>

                      {/* CARDS */}
                      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">

                        {stageLeads.map((lead: any, index: number) => (
                          <Draggable
                            draggableId={lead._id}
                            index={index}
                            key={lead._id}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedLead(lead)}
                                className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-150 cursor-grab active:cursor-grabbing"
                              >
                                <p className="text-sm font-medium text-gray-900">
                                  {lead.name}
                                </p>

                                <p className="text-xs text-gray-500 truncate">
                                  {lead.companyName || "-"}
                                </p>

                                <p className="text-xs text-gray-400">
                                  {lead.phone}
                                </p>
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {stageLeads.length === 0 && (
                          <div className="text-xs text-gray-400 text-center py-6 border border-dashed rounded-xl">
                            No leads
                          </div>
                        )}

                      </div>

                    </div>
                  )}
                </Droppable>
              );
            })}

          </div>
        </DragDropContext>

      </div>

      {/* OVERLAY */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSelectedLead(null)}
        />
      )}

      {/* RIGHT PANEL */}
      <div
        className={`fixed top-0 right-0 h-full w-[360px] bg-white border-l shadow-2xl p-5 z-50 transition-transform duration-300 ${
          selectedLead ? "translate-x-0" : "translate-x-full"
        }`}
      >

        {selectedLead && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Lead Details</h2>
              <button onClick={() => setSelectedLead(null)}>✕</button>
            </div>

            <div className="space-y-4 text-sm">

              <div>
                <p className="text-gray-400 text-xs">Name</p>
                <p>{selectedLead.name}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Company</p>
                <p>{selectedLead.companyName}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p>{selectedLead.email}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Phone</p>
                <p>{selectedLead.phone}</p>
              </div>

            </div>
          </>
        )}

      </div>
    </>
  );
}