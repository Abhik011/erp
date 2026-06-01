"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCompany, isSuperAdmin } from "@/components/CompanyProvider";

function formatRole(role: string | undefined) {
  if (!role) return "—";
  return role.replace(/_/g, " ");
}

function formatDate(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ProfilePage() {
  const { ready, companyId, refreshCompanies, workspaceUser, workspaceReady } =
    useCompany();
  const canEditCompany = isSuperAdmin(workspaceUser?.role);

  const [agency, setAgency] = useState<any>(null);
  const [companyEdit, setCompanyEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canEditCompany) setCompanyEdit(false);
  }, [canEditCompany]);

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
    if (!canEditCompany) return;
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch("/agencies/logo", {
      method: "POST",
      body: formData,
    });

    if (res.status === 403) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "Only a super admin can upload the logo.");
      return;
    }

    const data = await res.json();
    if (data.url) {
      setField("logo", data.url);
    }
  };

  const setBank = (field: string, value: any) => {
    setAgency((prev: any) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }));
  };

  const handleSaveCompany = async () => {
    if (!canEditCompany || !agency?._id) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/agencies/${agency._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agency),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || "Failed to save company profile");
        return;
      }
      setAgency(data);
      setCompanyEdit(false);
      await refreshCompanies();
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!workspaceReady) {
    return <div className="p-6 text-gray-500 text-sm">Loading workspace…</div>;
  }

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading profile…</div>;
  }

  if (!agency) return null;

  const u = workspaceUser;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your account in this workspace and the workspace company details.
        </p>
      </div>

      {/* —— Company (super admin edit) —— */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Workspace company profile
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Logo, legal, and billing details for this workspace. Shown on invoices and documents
              where configured.
            </p>
          </div>
          {canEditCompany ? (
            !companyEdit ? (
              <button
                type="button"
                onClick={() => setCompanyEdit(true)}
                className="shrink-0 bg-[#111] text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Edit company
              </button>
            ) : (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCompanyEdit(false);
                    if (companyId) {
                      setLoading(true);
                      apiFetch("/agencies/default")
                        .then((res) => res.json())
                        .then((data) => {
                          setAgency({ ...data, bankDetails: data?.bankDetails || {} });
                          setLoading(false);
                        })
                        .catch(() => setLoading(false));
                    }
                  }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompany}
                  disabled={saving}
                  className="bg-[#111] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save company"}
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-md">
              Only a <strong>super admin</strong> can edit the workspace company profile. Ask your
              super admin to update these details or to grant you that role.
            </p>
          )}
        </div>

        <div className="space-y-8 pt-2 border-t border-gray-100">
          <Section title="Logo">
            <div className="flex items-center gap-4">
              {agency.logo ? (
                <img
                  src={agency.logo}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100 shadow-sm border border-gray-100"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border border-gray-100">
                  Logo
                </div>
              )}
              {companyEdit && canEditCompany && (
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <input
                    value={agency.logo || ""}
                    onChange={(e) => setField("logo", e.target.value)}
                    placeholder="Logo image URL (https://…)"
                    className={input}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void handleLogoUpload(file);
                      e.target.value = "";
                    }}
                    className="text-xs text-gray-600"
                  />
                </div>
              )}
            </div>
          </Section>

          <Section title="Company">
            <Grid>
              <Field label="Name" value={agency.name} edit={companyEdit && canEditCompany}>
                <input
                  value={agency.name || ""}
                  onChange={(e) => setField("name", e.target.value)}
                  className={input}
                />
              </Field>
              <Field label="Tagline" value={agency.tagline} edit={companyEdit && canEditCompany}>
                <input
                  value={agency.tagline || ""}
                  onChange={(e) => setField("tagline", e.target.value)}
                  className={input}
                />
              </Field>
            </Grid>
            <Field label="Address" value={agency.address} edit={companyEdit && canEditCompany}>
              <textarea
                value={agency.address || ""}
                onChange={(e) => setField("address", e.target.value)}
                className={input}
                rows={3}
              />
            </Field>
            <Grid>
              <Field label="Company email" value={agency.email} edit={companyEdit && canEditCompany}>
                <input
                  value={agency.email || ""}
                  onChange={(e) => setField("email", e.target.value)}
                  className={input}
                />
              </Field>
              <Field label="Phone" value={agency.phone} edit={companyEdit && canEditCompany}>
                <input
                  value={agency.phone || ""}
                  onChange={(e) => setField("phone", e.target.value)}
                  className={input}
                />
              </Field>
            </Grid>
            <Field label="Website" value={agency.website} edit={companyEdit && canEditCompany}>
              <input
                value={agency.website || ""}
                onChange={(e) => setField("website", e.target.value)}
                className={input}
              />
            </Field>
          </Section>

          <Section title="Tax">
            <Field label="GSTIN" value={agency.gstin} edit={companyEdit && canEditCompany}>
              <input
                value={agency.gstin || ""}
                onChange={(e) => setField("gstin", e.target.value)}
                className={input}
              />
            </Field>
            <Field
              label="Place of supply"
              value={agency.placeOfSupply}
              edit={companyEdit && canEditCompany}
            >
              <input
                value={agency.placeOfSupply || ""}
                onChange={(e) => setField("placeOfSupply", e.target.value)}
                placeholder="e.g. Maharashtra"
                className={input}
              />
            </Field>
          </Section>

          <Section title="Bank & payments">
            <Grid>
              <Field
                label="Account name"
                value={agency.bankDetails?.accountName}
                edit={companyEdit && canEditCompany}
              >
                <input
                  value={agency.bankDetails?.accountName || ""}
                  onChange={(e) => setBank("accountName", e.target.value)}
                  className={input}
                />
              </Field>
              <Field
                label="Account number"
                value={agency.bankDetails?.accountNumber}
                edit={companyEdit && canEditCompany}
              >
                <input
                  value={agency.bankDetails?.accountNumber || ""}
                  onChange={(e) => setBank("accountNumber", e.target.value)}
                  className={input}
                />
              </Field>
            </Grid>
            <Grid>
              <Field label="IFSC" value={agency.bankDetails?.ifsc} edit={companyEdit && canEditCompany}>
                <input
                  value={agency.bankDetails?.ifsc || ""}
                  onChange={(e) => setBank("ifsc", e.target.value)}
                  className={input}
                />
              </Field>
              <Field label="Bank" value={agency.bankDetails?.bank} edit={companyEdit && canEditCompany}>
                <input
                  value={agency.bankDetails?.bank || ""}
                  onChange={(e) => setBank("bank", e.target.value)}
                  className={input}
                />
              </Field>
            </Grid>
            <Field label="UPI ID" value={agency.upiId} edit={companyEdit && canEditCompany}>
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
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className={`text-gray-900 break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  edit,
  children,
}: {
  label: string;
  value: any;
  edit: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm text-gray-900">{edit ? children : value || "—"}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

const input =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10";
