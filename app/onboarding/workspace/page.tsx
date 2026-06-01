"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/components/CompanyProvider";
import { apiFetch } from "@/lib/api";
import { apiUpload } from "@/lib/apiUpload";
import { PRODUCT_NAME } from "@/lib/brand";
import { Check } from "lucide-react";

type Plan = {
  key: string;
  name: string;
  description: string;
  features: string[];
  isPaid: boolean;
};

const STEPS = ["Organization", "Logo", "Plan"] as const;

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const { workspaceReady, workspaceUser, refreshCompanies } = useCompany();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logo, setLogo] = useState("");
  const [planKey, setPlanKey] = useState("free");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceReady || !workspaceUser) return;
    if (workspaceUser.role !== "super_admin") {
      router.replace("/onboarding");
      return;
    }
    if (workspaceUser.workspaceOnboardingCompleted !== false) {
      router.replace("/dashboard");
      return;
    }

    Promise.all([
      apiFetch("/agencies/onboarding/status").then((r) => r.json()),
      apiFetch("/billing/plans").then((r) => r.json()),
    ])
      .then(([status, billing]) => {
        if (status?.name) setName(status.name);
        if (status?.tagline) setTagline(status.tagline);
        if (status?.logo) setLogo(status.logo);
        if (status?.planKey) setPlanKey(status.planKey);
        setPlans(Array.isArray(billing?.plans) ? billing.plans : []);
      })
      .catch(() => setError("Could not load setup data"))
      .finally(() => setLoading(false));
  }, [workspaceReady, workspaceUser, router]);

  const saveStep = async (payload: Record<string, string>) => {
    const res = await apiFetch("/agencies/onboarding", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data.message === "string" ? data.message : "Could not save"
      );
    }
    return data;
  };

  const onLogoFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiUpload("/agencies/logo", form);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Logo upload failed");
      }
      const url = data.url as string;
      setLogo(url);
      await saveStep({ logo: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Logo upload failed");
    } finally {
      setSaving(false);
    }
  };

  const nextFromOrg = async () => {
    const n = name.trim();
    if (!n) {
      setError("Organization name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveStep({ name: n, tagline: tagline.trim() });
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const nextFromLogo = () => setStep(2);

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveStep({ planKey });
      const res = await apiFetch("/agencies/onboarding/complete", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.message === "string" ? data.message : "Could not finish"
        );
      }
      await refreshCompanies();
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish setup");
    } finally {
      setSaving(false);
    }
  };

  if (!workspaceReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1] text-sm text-gray-600">
        Loading setup…
      </div>
    );
  }

  if (!workspaceUser || workspaceUser.role !== "super_admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {PRODUCT_NAME} · New organization
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          Set up your workspace
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Name, logo, and plan sync to your Nexora workspace and Clerk profile.
          Invited teammates join this organization only—they do not create a new
          one.
        </p>

        <div className="mt-6 flex gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 rounded-lg border px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide ${
                i === step
                  ? "border-gray-900 bg-gray-900 text-white"
                  : i < step
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-gray-200 text-gray-400"
              }`}
            >
              {i < step ? <Check className="mx-auto h-3 w-3" /> : null}
              {label}
            </div>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {step === 0 && (
            <>
              <label className="block text-xs font-medium text-gray-600">
                Organization name
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  autoFocus
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Tagline (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Short description"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => void nextFromOrg()}
                className="w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-20 w-20 rounded-xl object-contain bg-white border border-gray-200"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] text-2xl font-bold text-white">
                    {name.trim().charAt(0) || "?"}
                  </div>
                )}
                <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {logo ? "Change logo" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void onLogoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-xs text-gray-500">Optional — you can skip and add later</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={nextFromLogo}
                  className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {plans.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlanKey(p.key)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      planKey === p.key
                        ? "border-[#7c5cff] bg-[#7c5cff]/5 ring-1 ring-[#7c5cff]/30"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      {planKey === p.key ? (
                        <Check className="h-4 w-4 text-[#7c5cff]" />
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Paid plans can be upgraded anytime from Billing. Starting on Free
                is fine.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void finish()}
                  className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Finishing…" : "Finish & open dashboard"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
