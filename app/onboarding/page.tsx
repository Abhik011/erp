"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/components/CompanyProvider";
import { apiFetch } from "@/lib/api";
import { PRODUCT_NAME } from "@/lib/brand";

export default function OnboardingPage() {
  const router = useRouter();
  const { workspaceReady, workspaceUser, refreshCompanies } = useCompany();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceReady || !workspaceUser) return;
    if (workspaceUser.role === "super_admin") {
      if (workspaceUser.workspaceOnboardingCompleted === false) {
        router.replace("/onboarding/workspace");
      } else {
        router.replace("/dashboard");
      }
      return;
    }
    if (workspaceUser.onboardingCompleted !== false) {
      router.replace("/dashboard");
    }
  }, [workspaceReady, workspaceUser, router]);

  const finish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch("/users/me/onboarding/complete", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Could not complete onboarding."
        );
        return;
      }
      await refreshCompanies();
      router.replace("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  if (!workspaceReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1] text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  if (!workspaceUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1] p-6">
        <p className="max-w-md text-center text-sm text-gray-600">
          We could not load your workspace profile. Try signing out and back in, or
          contact your administrator if this keeps happening.
        </p>
      </div>
    );
  }

  if (workspaceUser.role === "super_admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome to {PRODUCT_NAME}
        </h1>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          You are signed in as{" "}
          <span className="font-medium text-gray-900">
            {workspaceUser.email || workspaceUser.name || "your account"}
          </span>
          {workspaceUser.companyName ? (
            <>
              {" "}
              in workspace{" "}
              <span className="font-medium text-gray-900">
                {workspaceUser.companyName}
              </span>
            </>
          ) : null}
          . Your role is{" "}
          <span className="font-medium text-gray-900">
            {(workspaceUser.role || "member").replace(/_/g, " ")}
          </span>
          .
        </p>
        <ul className="mt-6 space-y-3 text-sm text-gray-700 list-disc pl-5">
          <li>Use the sidebar after onboarding to open leads, invoices, and projects.</li>
          <li>
            If something looks empty, your admin may still be setting up data or
            permissions.
          </li>
        </ul>
        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={finish}
          disabled={submitting}
          className="mt-8 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Finish and go to dashboard"}
        </button>
      </div>
    </div>
  );
}
