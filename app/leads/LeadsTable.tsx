"use client";

import { apiFetch } from "@/lib/api";
import {
  Calendar,
  Flame,
  Mail,
  Phone,
  MessageCircle,
  Linkedin,
  MoreHorizontal,
  Pencil,
  CalendarPlus,
  BarChart3,
  ArrowRightCircle,
  Trash2,
  Globe,
  FileSpreadsheet,
  Database,
  Users,
  Handshake,
  Building2,
  Presentation,
  MessageSquare,
} from "lucide-react";

import {
  FaLinkedin,
  FaGoogle,
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";

import {
  SiApollographql,
} from "react-icons/si";
import { useState } from "react";

interface FollowUp {
  date: string;
  type: string;
  note?: string;
  status?: string;
  reminderSent?: boolean;
}
interface Lead {
  _id: string;

  /** Legacy / API alias */
  name?: string;

  fullName: string;

  designation?: string;

  email?: string;

  phone?: string;

  mobile?: string;

  source?: string;

  priority?: "Low" | "Medium" | "High";

  temperature?: "Cold" | "Warm" | "Hot";

  leadScore?: number;

  nextFollowUp?: string;
   followUps?: FollowUp[];

  status:
  | "New"
  | "Attempting"
  | "Contacted"
  | "Interested"
  | "Negotiation"
  | "Qualified"
  | "Proposal Sent"
  | "Converted"
  | "Lost";

  company?: {
    name?: string;
    industry?: string;
  };

  notes?: string;

  createdAt: string;
}
const sourceIcons: any = {
  Website: (
    <Globe
      size={16}
      className="text-gray-500"
    />
  ),

  "Landing Page": (
    <Globe
      size={16}
      className="text-gray-500"
    />
  ),

  "Contact Form": (
    <Mail
      size={16}
      className="text-gray-500"
    />
  ),

  "Live Chat": (
    <MessageSquare
      size={16}
      className="text-gray-500"
    />
  ),

  Apollo: (
    <SiApollographql
      size={16}
      className="text-violet-500"
    />
  ),

  LinkedIn: (
    <FaLinkedin
      size={16}
      className="text-blue-600"
    />
  ),

  "Cold Email": (
    <Mail
      size={16}
      className="text-gray-500"
    />
  ),

  "Cold Call": (
    <Phone
      size={16}
      className="text-gray-500"
    />
  ),

  "WhatsApp Outreach": (
    <FaWhatsapp
      size={16}
      className="text-green-500"
    />
  ),

  "Google Ads": (
    <FaGoogle
      size={16}
      className="text-red-500"
    />
  ),

  "Facebook Ads": (
    <FaFacebook
      size={16}
      className="text-blue-600"
    />
  ),

  "Instagram Ads": (
    <FaInstagram
      size={16}
      className="text-pink-500"
    />
  ),

  "LinkedIn Ads": (
    <FaLinkedin
      size={16}
      className="text-blue-600"
    />
  ),

  Referral: (
    <Handshake
      size={16}
      className="text-gray-500"
    />
  ),

  Partner: (
    <Users
      size={16}
      className="text-gray-500"
    />
  ),

  "Existing Customer": (
    <Building2
      size={16}
      className="text-gray-500"
    />
  ),

  "Trade Show": (
    <Presentation
      size={16}
      className="text-gray-500"
    />
  ),

  Conference: (
    <Presentation
      size={16}
      className="text-gray-500"
    />
  ),

  Webinar: (
    <Presentation
      size={16}
      className="text-gray-500"
    />
  ),

  "Imported CSV": (
    <FileSpreadsheet
      size={16}
      className="text-green-600"
    />
  ),

  API: (
    <Database
      size={16}
      className="text-gray-500"
    />
  ),

  "Manual Entry": (
    <Users
      size={16}
      className="text-gray-500"
    />
  ),
};
export default function LeadsTable({
  leads,
  refresh,
  openEdit,
  addFollowUp,
}: {
  leads: Lead[];
  refresh: () => void;
  openEdit: (lead: Lead) => void;
  addFollowUp: (lead: Lead) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [sourceFilter, setSourceFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("Newest");
  const deleteLead = async (id: string) => {
    await apiFetch(`/leads/${id}`, {
      method: "DELETE",
    });

    refresh();
  };

  const changeStatus = async (
    id: string,
    status: string
  ) => {
    await apiFetch(`/leads/${id}/status`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ status }),
    });

    refresh();
  };

  const statusColor: any = {
    New: "bg-gray-100 text-gray-700",

    Attempting: "bg-orange-100 text-orange-700",

    Contacted: "bg-blue-100 text-blue-700",

    Interested: "bg-cyan-100 text-cyan-700",

    Negotiation: "bg-yellow-100 text-yellow-700",

    Qualified: "bg-green-100 text-green-700",

    "Proposal Sent":
      "bg-indigo-100 text-indigo-700",

    Converted:
      "bg-purple-100 text-purple-700",

    Lost: "bg-red-100 text-red-700",
  };

  const priorityColor: any = {
    Low: "bg-gray-100 text-gray-700",

    Medium: "bg-yellow-100 text-yellow-700",

    High: "bg-red-100 text-red-700",
  };

  const temperatureColor: any = {
    Cold: "text-blue-500",

    Warm: "text-orange-500",

    Hot: "text-red-500",
  };

  const filteredLeads =
    leads
      .filter((lead) => {

        const matchesSearch =

          lead.fullName
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||

          lead.company?.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||

          lead.email
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            );

        const matchesStatus =

          statusFilter === "All" ||

          lead.status ===
          statusFilter;

        const matchesSource =

          sourceFilter === "All" ||

          lead.source ===
          sourceFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesSource
        );
      })

      .sort((a, b) => {

        if (
          sortBy === "Newest"
        ) {

          return (
            new Date(
              b.createdAt
            ).getTime() -

            new Date(
              a.createdAt
            ).getTime()
          );

        }

        if (
          sortBy === "Oldest"
        ) {

          return (
            new Date(
              a.createdAt
            ).getTime() -

            new Date(
              b.createdAt
            ).getTime()
          );

        }

        if (
          sortBy === "Highest Score"
        ) {

          return (
            (b.leadScore || 0) -
            (a.leadScore || 0)
          );

        }

        return 0;
      });

  const sendEmail = (lead: Lead) => {
    if (!lead.email) {
      alert("No email found");
      return;
    }

    window.open(
      `mailto:${lead.email}?subject=Regarding our discussion`,
      "_blank"
    );
  };

  // const openWhatsApp = (lead: Lead) => {
  //   const number =
  //     lead.phone || lead.mobile;

  //   if (!number) {
  //     alert("No phone number found");
  //     return;
  //   }

  //   const cleaned = number.replace(
  //     /\D/g,
  //     ""
  //   );

  //   window.open(
  //     `https://wa.me/${cleaned}`,
  //     "_blank"
  //   );
  // };

  const viewTimeline = (lead: Lead) => {
    openEdit(lead);
  };



  const convertLead = async (
    leadId: string
  ) => {
    try {
      await apiFetch(
        `/leads/${leadId}/convert`,
        {
          method: "POST",
        }
      );

      refresh();

    } catch {
      alert(
        "Failed to convert lead"
      );
    }
  };

  const deleteLeadAction = async (
    id: string
  ) => {
    const confirmDelete =
      window.confirm(
        "Delete this lead?"
      );

    if (!confirmDelete)
      return;

    await deleteLead(id);
  };
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-white">
      {/* FILTER BAR */}

      {/* ENTERPRISE FILTER BAR */}

      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT */}

          <div className="flex flex-col md:flex-row gap-3 md:items-center">

            {/* SEARCH */}

            <div className="relative">

              <input
                type="text"
                placeholder="Search leads, companies, email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="
            h-11
            w-[320px]
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-violet-400
            focus:bg-white
          "
              />

              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                />
                <path d="m21 21-4.3-4.3" />
              </svg>

            </div>

            {/* QUICK STATS */}

            <div className="hidden xl:flex items-center gap-2">

              <div className="px-3 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center">

                <span className="text-sm font-medium text-violet-700">
                  {filteredLeads.length} Leads
                </span>

              </div>

              <div className="px-3 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center">

                <span className="text-sm font-medium text-orange-700">
                  {
                    filteredLeads.filter(
                      (l) => l.temperature === "Hot"
                    ).length
                  } Hot
                </span>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex flex-wrap items-center gap-2">

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="
          h-11
          min-w-[140px]
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          text-sm
          outline-none
          focus:border-violet-400
        "
            >

              <option value="All">
                All Status
              </option>

              <option value="New">
                New
              </option>

              <option value="Contacted">
                Contacted
              </option>

              <option value="Qualified">
                Qualified
              </option>

              <option value="Negotiation">
                Negotiation
              </option>

              <option value="Converted">
                Converted
              </option>

              <option value="Lost">
                Lost
              </option>

            </select>

            {/* SOURCE */}

            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value)
              }
              className="
          h-11
          min-w-[140px]
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          text-sm
          outline-none
          focus:border-violet-400
        "
            >

              <option value="All">
                All Sources
              </option>

              <option value="Apollo">
                Apollo
              </option>

              <option value="LinkedIn">
                LinkedIn
              </option>

              <option value="Cold Email">
                Cold Email
              </option>

              <option value="Referral">
                Referral
              </option>

              <option value="Imported CSV">
                Imported CSV
              </option>

            </select>

            {/* SORT */}

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="
          h-11
          min-w-[150px]
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          text-sm
          outline-none
          focus:border-violet-400
        "
            >

              <option value="Newest">
                Newest First
              </option>

              <option value="Oldest">
                Oldest First
              </option>

              <option value="Highest Score">
                Highest Score
              </option>

            </select>

          </div>

        </div>

      </div>

      <div className="overflow-auto h-full max-h-[calc(100vh-257px)]">

        <table className="w-full min-w-[1600px] text-sm">

          {/* HEADER */}

          <thead className="bg-gray-50 sticky top-0 z-20 border-b">

            <tr className="text-left text-xs uppercase text-gray-500">

              <th className="px-4 py-3">
                Lead
              </th>

              <th className="px-4 py-3">
                Company
              </th>

              <th className="px-4 py-3">
                Contact
              </th>

              <th className="px-4 py-3">
                Source
              </th>

              <th className="px-4 py-3">
                Status
              </th>

              <th className="px-4 py-3">
                Priority
              </th>

              <th className="px-4 py-3">
                Score
              </th>

              <th className="px-4 py-3">
                Follow Up
              </th>

              <th className="px-4 py-3">
                Notes
              </th>

              <th className="px-4 py-3 text-right">
                Actions
              </th>

            </tr>

          </thead>

          {/* BODY */}

          <tbody>

            {filteredLeads.map((lead) => {

              const overdue =
                lead.nextFollowUp &&
                new Date(lead.nextFollowUp) <
                new Date();

              return (
                <tr
                  key={lead._id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >

                  {/* LEAD */}

                  <td className="px-4 py-4">

                    <div className="flex flex-col">

                      <div className="flex items-center gap-2">

                        <p className="font-semibold text-gray-900">
                          {lead.fullName || lead.name || "-"}
                        </p>

                        <Flame
                          size={14}
                          className={
                            temperatureColor[
                            lead.temperature || "Cold"
                            ]
                          }
                        />

                      </div>

                      <p className="text-xs text-gray-500">
                        {lead.designation || "-"}
                      </p>

                    </div>

                  </td>

                  {/* COMPANY */}

                  <td className="px-4 py-4">

                    <div className="flex flex-col">

                      <p className="font-medium text-gray-800">
                        {lead.company?.name || "-"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {lead.company?.industry || "-"}
                      </p>

                    </div>

                  </td>

                  {/* CONTACT */}

                  <td className="px-4 py-4">

                    <div className="space-y-2">

                      <div className="flex items-center gap-2 text-gray-700">

                        <Mail size={14} />

                        <span className="text-xs">
                          {lead.email || "-"}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 text-gray-700">

                        <Phone size={14} />

                        <span className="text-xs">
                          {lead.phone || lead.mobile || "-"}
                        </span>

                      </div>

                    </div>

                  </td>

                  {/* SOURCE */}

                  <td className="px-4 py-4">

                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">

                      {sourceIcons[
                        lead.source || "Manual Entry"
                      ]}

                      <span>
                        {lead.source || "-"}
                      </span>

                    </div>

                  </td>

                  {/* STATUS */}

                  <td className="px-4 py-4">

                    <span
                      className={`px-2 py-1 rounded-full text-xs ${statusColor[lead.status]}`}
                    >
                      {lead.status}
                    </span>

                  </td>

                  {/* PRIORITY */}

                  <td className="px-4 py-4">

                    <span
                      className={`px-2 py-1 rounded-full text-xs ${priorityColor[lead.priority || "Medium"]}`}
                    >
                      {lead.priority || "Medium"}
                    </span>

                  </td>

                  {/* SCORE */}

                  <td className="px-4 py-4">

                    <div className="font-semibold text-gray-800">
                      {lead.leadScore || 0}
                    </div>

                  </td>



                  {/* FOLLOW UP */}

                  <td className="px-4 py-4 min-w-[220px]">

                    {lead.followUps?.length ? (

                      <div className="space-y-2">

                        {lead.followUps
                          .sort(
                            (a: any, b: any) =>
                              new Date(
                                b.date
                              ).getTime() -
                              new Date(
                                a.date
                              ).getTime()
                          )
                          .slice(0, 1)
                          .map(
                            (
                              follow: any,
                              index: number
                            ) => {

                              const overdue =
                                follow.date &&
                                new Date(
                                  follow.date
                                ) < new Date() &&
                                follow.status !==
                                "Completed";

                              return (

                                <div
                                  key={index}
                                  className="space-y-1"
                                >

                                  {/* DATE + STATUS */}

                                  <div className="flex items-center gap-2 flex-wrap">

                                    <div
                                      className={`flex items-center gap-1 text-xs ${overdue
                                        ? "text-red-600"
                                        : "text-gray-600"
                                        }`}
                                    >

                                      <Calendar size={13} />

                                      <span>
                                        {new Date(
                                          follow.date
                                        ).toLocaleDateString()}
                                      </span>

                                    </div>

                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${follow.status ===
                                        "Completed"
                                        ? "bg-green-100 text-green-700"
                                        : follow.status ===
                                          "Missed"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >

                                      {follow.status ||
                                        "Pending"}

                                    </span>

                                  </div>

                                  {/* TYPE */}

                                  <div className="flex items-center gap-1 text-xs text-gray-500">

                                    <span className="font-medium">
                                      Type:
                                    </span>

                                    <span>
                                      {follow.type}
                                    </span>

                                  </div>

                                  {/* REMINDER */}

                                  <div className="flex items-center gap-1 text-xs">

                                    <span className="text-gray-500 font-medium">
                                      Reminder:
                                    </span>

                                    <span
                                      className={
                                        follow.reminderSent
                                          ? "text-green-600"
                                          : "text-orange-500"
                                      }
                                    >

                                      {follow.reminderSent
                                        ? "Sent"
                                        : "Pending"}

                                    </span>

                                  </div>

                                  {/* NOTE */}

                                  {follow.note && (

                                    <div className="text-xs text-gray-400 truncate max-w-[180px]">

                                      {follow.note}

                                    </div>

                                  )}

                                </div>

                              );
                            }
                          )}

                      </div>

                    ) : (

                      <span className="text-xs text-gray-400">
                        No Follow Up
                      </span>

                    )}

                  </td>

                  {/* NOTES */}

                  <td className="px-4 py-4 max-w-[240px]">

                    <p className="text-xs text-gray-600 line-clamp-2">
                      {lead.notes || "-"}
                    </p>

                  </td>

                  {/* ACTIONS */}

                  <td className="px-4 py-4 text-right">

                    <div className="relative flex justify-end">

                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === lead._id
                              ? null
                              : lead._id
                          )
                        }
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >

                        <MoreHorizontal size={16} />

                      </button>

                      {openMenu === lead._id && (
                        <div className="absolute right-0 top-10 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">

                          {/* STATUS SECTION */}
                          <div className="px-4 py-2 bg-violet-50 border-b">
                            <p className="text-[11px] uppercase font-semibold text-violet-600">
                              Status Actions
                            </p>
                          </div>

                          <div className="p-2 space-y-1">

                            {[
                              "New",
                              "Attempting",
                              "Contacted",
                              "Interested",
                              "Negotiation",
                              "Qualified",
                              "Proposal Sent",
                              "Lost",
                            ].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  changeStatus(
                                    lead._id,
                                    status
                                  );
                                  setOpenMenu(null);
                                }}
                                className={`
            flex w-full items-center justify-between
            rounded-xl px-3 py-2 text-sm
            transition hover:bg-violet-50
            ${lead.status === status
                                    ? "bg-violet-100 text-violet-700 font-medium"
                                    : "text-gray-700"}
          `}
                              >
                                {status}

                                {lead.status === status && (
                                  <span className="text-xs">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}

                          </div>

                          {/* NORMAL ACTIONS */}
                          <div className="px-4 py-2 mt-1 bg-gray-50 border-y">
                            <p className="text-[11px] uppercase font-semibold text-gray-500">
                              Lead Actions
                            </p>
                          </div>

                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => {
                                openEdit(lead);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil size={16} />
                              Edit Lead
                            </button>

                            <button
                              onClick={() => {
                                addFollowUp(lead);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                              <CalendarPlus size={16} />
                              Add Follow Up
                            </button>

                            <button
                              onClick={() => {
                                sendEmail(lead);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                              <Mail size={16} />
                              Send Email
                            </button>

                            {/* <button
                              onClick={() => {
                                openWhatsApp(lead);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                            >
                              <MessageCircle size={16} />
                              WhatsApp
                            </button> */}

                            <button
                              onClick={() => {
                                viewTimeline(lead);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                            >
                              <BarChart3 size={16} />
                              View Timeline
                            </button>

                            {lead.status === "Qualified" && (
                              <button
                                onClick={() => {
                                  convertLead(lead._id);
                                  setOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
                              >
                                <ArrowRightCircle size={16} />
                                Convert to Customer
                              </button>
                            )}

                            <button
                              onClick={() => {
                                deleteLeadAction(lead._id);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                              Delete Lead
                            </button>

                          </div>

                        </div>
                      )}

                    </div>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}