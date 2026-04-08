"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function AgencyPage() {
  const { ready, companyId, refreshCompanies, selectCompany } = useCompany();
  const [agency, setAgency] = useState<any>(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!ready || !companyId) return;
    setLoading(true);
    apiFetch("/agencies/default")
      .then((res) => res.json())
      .then((data) => {
        setAgency({
          ...data,
          bankDetails: data?.bankDetails || {},
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ready, companyId]);

  const setField = (field: string, value: any) => {
    setAgency((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch("/agencies/logo", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.url) {
      setField("logo", data.url); // ✅ save S3 URL
    }
  };
  const setBank = (field: string, value: any) => {
    setAgency((prev: any) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }));
  };

  // 🔥 LOGO UPLOAD (preview only)
  const handleLogo = (file: File) => {
    const url = URL.createObjectURL(file);
    setField("logo", url);
  };

  // SAVE
  const handleSave = async () => {
    setSaving(true);

    try {
      const method = agency._id ? "PUT" : "POST";
      const path = agency._id
        ? `/agencies/${agency._id}`
        : "/agencies";

      const res = await apiFetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agency),
      });

      const data = await res.json();
      setAgency(data);
      setEdit(false);
      if (method === "POST" && data._id) {
        await refreshCompanies();
        selectCompany(data._id);
      }

    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="p-6 text-gray-500">Loading...</div>;

  if (!agency) return null;

  return (
    <div className=" mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Agency Profile
          </h1>
          <p className="text-sm text-gray-500">
            Manage your company details
          </p>
        </div>

        {!edit ? (
          <button
            onClick={() => setEdit(true)}
            className="bg-[#111] text-white px-4 py-2 rounded-xl text-sm"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEdit(false)}
              className="px-4 py-2 text-sm border rounded-xl"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="bg-[#111] text-white px-4 py-2 rounded-xl text-sm"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-8">

        {/* LOGO */}
        <Section title="Logo">

          <div className="flex items-center gap-4 " >

            {/* PREVIEW */}
            {agency.logo ? (
              <img
                src={agency.logo}
                className="w-14 h-14 rounded-lg object-cover bg-grey-600  shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                Logo
              </div>
            )}

            {/* INPUT (ONLY IN EDIT MODE) */}
            {edit && (
              <div className="flex flex-col gap-2 w-full">

                {/* 🔗 URL INPUT */}
                <input
                  value={agency.logo || ""}
                  onChange={(e) => setField("logo", e.target.value)}
                  placeholder="Paste logo URL (https://...)"
                  className={input}
                />

                {/* 📁 FILE UPLOAD */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setPreview(URL.createObjectURL(file)); // 👀 instant preview
                    handleLogoUpload(file);
                    e.target.value = ""; 
                  }}

                  className="text-sm"
                />

              </div>
            )}

          </div>

        </Section>

        {/* COMPANY */}
        <Section title="Company Info">

          <Grid>
            <Field label="Name" value={agency.name} edit={edit}>
              <input value={agency.name || ""} onChange={(e) => setField("name", e.target.value)} className={input} />
            </Field>

            <Field label="Tagline" value={agency.tagline} edit={edit}>
              <input value={agency.tagline || ""} onChange={(e) => setField("tagline", e.target.value)} className={input} />
            </Field>
          </Grid>

          <Field label="Address" value={agency.address} edit={edit}>
            <textarea value={agency.address || ""} onChange={(e) => setField("address", e.target.value)} className={input} />
          </Field>

          <Grid>
            <Field label="Email" value={agency.email} edit={edit}>
              <input value={agency.email || ""} onChange={(e) => setField("email", e.target.value)} className={input} />
            </Field>

            <Field label="Phone" value={agency.phone} edit={edit}>
              <input value={agency.phone || ""} onChange={(e) => setField("phone", e.target.value)} className={input} />
            </Field>
          </Grid>

          <Field label="Website" value={agency.website} edit={edit}>
            <input value={agency.website || ""} onChange={(e) => setField("website", e.target.value)} className={input} />
          </Field>

        </Section>

        {/* GST */}
        <Section title="GST" >
          <Field label="GSTIN" value={agency.gstin} edit={edit}>
            <input value={agency.gstin || ""} onChange={(e) => setField("gstin", e.target.value)} className={input} />
          </Field>


          <Field label="Place of Supply" value={agency.placeOfSupply} edit={edit}>
            <input
              value={agency.placeOfSupply || ""}
              onChange={(e) => setField("placeOfSupply", e.target.value)}
              placeholder="e.g. Maharashtra"
              className={input}
            />
          </Field>

        </Section>

        {/* BANK */}
        <Section title="Bank Details">

          <Grid>
            <Field label="Account Name" value={agency.bankDetails?.accountName} edit={edit}>
              <input value={agency.bankDetails?.accountName || ""} onChange={(e) => setBank("accountName", e.target.value)} className={input} />
            </Field>

            <Field label="Account Number" value={agency.bankDetails?.accountNumber} edit={edit}>
              <input value={agency.bankDetails?.accountNumber || ""} onChange={(e) => setBank("accountNumber", e.target.value)} className={input} />
            </Field>
          </Grid>

          <Grid>
            <Field label="IFSC" value={agency.bankDetails?.ifsc} edit={edit}>
              <input value={agency.bankDetails?.ifsc || ""} onChange={(e) => setBank("ifsc", e.target.value)} className={input} />
            </Field>

            <Field label="Bank" value={agency.bankDetails?.bank} edit={edit}>
              <input value={agency.bankDetails?.bank || ""} onChange={(e) => setBank("bank", e.target.value)} className={input} />
            </Field>
          </Grid>


          <Field label="UPI ID" value={agency.upiId} edit={edit}>
            <input
              value={agency.upiId || ""}
              onChange={(e) => setField("upiId", e.target.value)}
              placeholder="yourcompany@upi"
              className={input}
            />
          </Field>

        </Section>

      </div>
    </div>
  );
}

/* 🔥 COMPONENTS */
function Section({ title, children }: any) {
  return (
    <div className="pb-6 border-b border-gray-200 last:border-b-0">
      <h2 className="text-sm font-medium text-gray-700 mb-3">
        {title}
      </h2>

      <div className="space-y-4 uppercase">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, edit, children }: any) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm text-gray-900">
        {edit ? children : (value || "-")}
      </div>
    </div>
  );
}

function Grid({ children }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

const input =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5";