"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  Globe,
  FileSpreadsheet,
  Database,
  Mail,
  Phone,
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

/* ================================
   SOURCE ICONS
================================ */

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
const FieldLabel = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <label className="text-xs font-medium text-gray-600 mb-1 block">
    {children}
  </label>
);

export default function LeadFormModal({
  close,
  refresh,
  lead,
}: any) {

  const isEdit = !!lead;

  const [form, setForm] = useState({

    // OLD SUPPORT
    name: "",

    companyName: "",

    // NEW STRUCTURE
    fullName: "",

    designation: "",

    email: "",

    phone: "",

    mobile: "",

    source: "Manual Entry",

    notes: "",

    businessType: "",

    priority: "Medium",

    temperature: "Cold",

    leadScore: 0,

    status: "New",

    tags: "",

    nextFollowUp: "",

    followUpType: "Call",

    communicationPreference: "Email",

    company: {
      name: "",
      industry: "",
      website: "",
    },

    socials: {
      linkedin: "",
      twitter: "",
    },
  });

  /* ================================
     EDIT PREFILL
  ================================ */

  useEffect(() => {

    if (lead) {

      setForm({

        name: lead.name || "",

        companyName:
          lead.companyName ||
          lead.company?.name ||
          "",

        fullName:
          lead.fullName ||
          lead.name ||
          "",

        designation:
          lead.designation || "",

        email: lead.email || "",

        phone: lead.phone || "",

        mobile: lead.mobile || "",

        source:
          lead.source || "Manual Entry",

        notes: lead.notes || "",

        businessType:
          lead.businessType || "",

        priority:
          lead.priority || "Medium",

        temperature:
          lead.temperature || "Cold",

        leadScore:
          lead.leadScore || 0,

        status:
          lead.status || "New",

        tags: (lead.tags || []).join(", "),

        nextFollowUp:
          lead.nextFollowUp
            ? new Date(
              lead.nextFollowUp
            )
              .toISOString()
              .slice(0, 16)
            : "",

        followUpType:
          lead.followUpType || "Call",

        communicationPreference:
          lead.communicationPreference ||
          "Email",

        company: {
          name:
            lead.company?.name ||
            lead.companyName ||
            "",

          industry:
            lead.company?.industry || "",

          website:
            lead.company?.website || "",
        },

        socials: {
          linkedin:
            lead.socials?.linkedin || "",

          twitter:
            lead.socials?.twitter || "",
        },
      });

    }

  }, [lead]);

  /* ================================
     HANDLE CHANGE
  ================================ */

  const handleChange = (
    key: string,
    value: any
  ) => {

    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));

  };

  const handleNestedChange = (
    parent: string,
    key: string,
    value: any
  ) => {

    setForm((prev: any) => ({
      ...prev,

      [parent]: {
        ...prev[parent],
        [key]: value,
      },
    }));

  };

  /* ================================
     SUBMIT
  ================================ */

  const handleSubmit = async (e: any) => {

    e.preventDefault();

    const payload = {

      ...form,

      tags: form.tags
        ? form.tags
          .split(",")
          .map((t: string) =>
            t.trim()
          )
        : [],

      followUps: form.nextFollowUp
        ? [
          {
            date: form.nextFollowUp,

            type:
              form.followUpType,

            note:
              "Auto created from lead form",
          },
        ]
        : [],
    };

    if (isEdit) {

      await apiFetch(
        `/leads/${lead._id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

    } else {

      await apiFetch("/leads", {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(payload),
      });

    }

    refresh();

    close();

  };

  return (

    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden"
      >

        {/* HEADER */}

        <div className="px-6 py-5 border-b flex justify-between items-center">

          <div>

            <h2 className="text-xl font-semibold">
              {isEdit
                ? "Edit Lead"
                : "Create Lead"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage lead details,
              followups, and engagement
            </p>

          </div>

          <button
            onClick={close}
            type="button"
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>

        </div>

        {/* BODY */}

        <div className="p-6 max-h-[80vh] overflow-y-auto">

          {/* CONTACT INFO */}

          <div className="mb-8">

            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <FieldLabel>
                  Full Name
                </FieldLabel>

                <input
                  placeholder="Enter full name"
                  className="input"
                  value={form.fullName}
                  onChange={(e) =>
                    handleChange(
                      "fullName",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Designation
                </FieldLabel>

                <input
                  placeholder="Operations Manager"
                  className="input"
                  value={form.designation}
                  onChange={(e) =>
                    handleChange(
                      "designation",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Email Address
                </FieldLabel>

                <input
                  placeholder="john@example.com"
                  className="input"
                  value={form.email}
                  onChange={(e) =>
                    handleChange(
                      "email",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Phone Number
                </FieldLabel>

                <input
                  placeholder="+1 000 000 0000"
                  className="input"
                  value={form.phone}
                  onChange={(e) =>
                    handleChange(
                      "phone",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Mobile Number
                </FieldLabel>

                <input
                  placeholder="+1 000 000 0000"
                  className="input"
                  value={form.mobile}
                  onChange={(e) =>
                    handleChange(
                      "mobile",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Communication Preference
                </FieldLabel>

                <select
                  className="input"
                  value={
                    form.communicationPreference
                  }
                  onChange={(e) =>
                    handleChange(
                      "communicationPreference",
                      e.target.value
                    )
                  }
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                  <option>LinkedIn</option>
                </select>
              </div>

            </div>

          </div>

          {/* COMPANY */}

          <div className="mb-8">

            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Company Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <FieldLabel>
                  Company Name
                </FieldLabel>

                <input
                  placeholder="Company name"
                  className="input"
                  value={form.company.name}
                  onChange={(e) =>
                    handleNestedChange(
                      "company",
                      "name",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Industry
                </FieldLabel>

                <input
                  placeholder="Logistics, SaaS..."
                  className="input"
                  value={form.company.industry}
                  onChange={(e) =>
                    handleNestedChange(
                      "company",
                      "industry",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Website
                </FieldLabel>

                <input
                  placeholder="https://company.com"
                  className="input"
                  value={form.company.website}
                  onChange={(e) =>
                    handleNestedChange(
                      "company",
                      "website",
                      e.target.value
                    )
                  }
                />
              </div>

            </div>

          </div>

          {/* SALES */}

          <div className="mb-8">

            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Sales & Pipeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div>
                <FieldLabel>
                  Lead Source
                </FieldLabel>

                <div className="relative">

                  {/* ICON */}



                  {/* SELECT */}

                  <select
                    className="
      input
      pl-11
      pl-10 
      text-sm
      appearance-none
    "
                    value={form.source}
                    onChange={(e) =>
                      handleChange(
                        "source",
                        e.target.value
                      )
                    }

                  >

                    <option>Website</option>
                    <option>Landing Page</option>
                    <option>Contact Form</option>
                    <option>Live Chat</option>

                    <option>Apollo</option>
                    <option>LinkedIn</option>
                    <option>Cold Email</option>
                    <option>Cold Call</option>
                    <option>WhatsApp Outreach</option>

                    <option>Google Ads</option>
                    <option>Facebook Ads</option>
                    <option>Instagram Ads</option>
                    <option>LinkedIn Ads</option>

                    <option>Referral</option>
                    <option>Partner</option>
                    <option>Existing Customer</option>

                    <option>Trade Show</option>
                    <option>Conference</option>
                    <option>Webinar</option>

                    <option>Imported CSV</option>
                    <option>API</option>
                    <option>Manual Entry</option>

                  </select>

                </div>

              </div>

              <div>
                <FieldLabel>
                  Lead Status
                </FieldLabel>

                <select
                  className="input"
                  value={form.status}
                  onChange={(e) =>
                    handleChange(
                      "status",
                      e.target.value
                    )
                  }
                >
                  <option>New</option>
                  <option>Attempting</option>
                  <option>Contacted</option>
                  <option>Interested</option>
                  <option>Negotiation</option>
                  <option>Qualified</option>
                  <option>Proposal Sent</option>
                  <option>Lost</option>
                </select>
              </div>

              <div>
                <FieldLabel>
                  Priority
                </FieldLabel>

                <select
                  className="input"
                  value={form.priority}
                  onChange={(e) =>
                    handleChange(
                      "priority",
                      e.target.value
                    )
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div>

                <FieldLabel>
                  Temperature
                </FieldLabel>

                <select
                  disabled
                  className="
      input
      bg-gray-100
      text-gray-500
      cursor-not-allowed
      opacity-80
    "
                  value={form.temperature}
                >

                  <option>
                    Cold
                  </option>

                  <option>
                    Warm
                  </option>

                  <option>
                    Hot
                  </option>

                </select>

                <p className="text-[11px] text-gray-400 mt-1">

                  Auto calculated from lead score

                </p>

              </div>

            </div>

          </div>

          {/* FOLLOW UP */}

          <div className="mb-8">

            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Follow Up
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <FieldLabel>
                  Next Follow Up
                </FieldLabel>

                <input
                  type="datetime-local"
                  className="input"
                  value={form.nextFollowUp}
                  onChange={(e) =>
                    handleChange(
                      "nextFollowUp",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Follow Up Type
                </FieldLabel>

                <select
                  className="input"
                  value={form.followUpType}
                  onChange={(e) =>
                    handleChange(
                      "followUpType",
                      e.target.value
                    )
                  }
                >
                  <option>Call</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>WhatsApp</option>
                  <option>LinkedIn</option>
                </select>
              </div>

            </div>

          </div>

          {/* SOCIALS */}

          <div className="mb-8">

            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Social Profiles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <FieldLabel>
                  LinkedIn Profile
                </FieldLabel>

                <input
                  placeholder="https://linkedin.com/in/..."
                  className="input"
                  value={
                    form.socials.linkedin
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "socials",
                      "linkedin",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Twitter Profile
                </FieldLabel>

                <input
                  placeholder="https://twitter.com/..."
                  className="input"
                  value={
                    form.socials.twitter
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "socials",
                      "twitter",
                      e.target.value
                    )
                  }
                />
              </div>

            </div>

          </div>

          {/* TAGS */}

          <div className="mb-6">

            <FieldLabel>
              Tags
            </FieldLabel>

            <input
              placeholder="logistics, enterprise, hot lead"
              className="input"
              value={form.tags}
              onChange={(e) =>
                handleChange(
                  "tags",
                  e.target.value
                )
              }
            />

          </div>

          {/* NOTES */}

          <div>

            <FieldLabel>
              Internal Notes
            </FieldLabel>

            <textarea
              placeholder="Add notes..."
              className="input h-28 resize-none"
              value={form.notes}
              onChange={(e) =>
                handleChange(
                  "notes",
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* FOOTER */}

        <div className="px-6 py-4 border-t flex justify-end gap-3">

          <button
            type="button"
            onClick={close}
            className="px-5 py-2 rounded-xl border text-sm"
          >
            Cancel
          </button>

          <button className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-medium">
            {isEdit
              ? "Update Lead"
              : "Create Lead"}
          </button>

        </div>

      </form>

    </div>
  );
}