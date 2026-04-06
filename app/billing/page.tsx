"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

type Status = {
  planKey: string;
  subscriptionStatus: string;
  limits: Record<string, number>;
  usage: Record<string, number>;
  hasStripeCustomer: boolean;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
};

export default function BillingPage() {
  const { ready, companyId } = useCompany();
  const [data, setData] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const load = () => {
    if (!ready || !companyId) return;
    setLoading(true);
    apiFetch("/billing/status")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [ready, companyId]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await apiFetch("/billing/portal", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        alert(j.message || "Could not open billing portal");
        return;
      }
      if (j.url) window.location.href = j.url;
    } finally {
      setPortalLoading(false);
    }
  };

  const upgrade = async (planKey: string) => {
    setCheckoutLoading(planKey);
    try {
      const res = await apiFetch("/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.message || j.error || "Checkout failed");
        return;
      }
      if (j.url) window.location.href = j.url;
    } finally {
      setCheckoutLoading(null);
    }
  };

  const pct = (used: number, max: number) => {
    if (max === -1) return 0;
    if (max === 0) return 100;
    return Math.min(100, Math.round((used / max) * 100));
  };

  if (loading || !data) {
    return (
      <div className="text-gray-500 p-6">Loading billing…</div>
    );
  }

  const resources = ["leads", "customers", "deals", "invoices", "quotes"] as const;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Usage is per company. Upgrade for higher limits or unlimited Pro.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap justify-between gap-4 items-start">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Current plan
            </p>
            <p className="text-xl font-semibold capitalize">{data.planKey}</p>
            <p className="text-sm text-gray-600 mt-1">
              Status:{" "}
              <span className="font-medium">{data.subscriptionStatus}</span>
              {data.cancelAtPeriodEnd && (
                <span className="text-amber-700"> (cancels at period end)</span>
              )}
            </p>
            {data.currentPeriodEnd && (
              <p className="text-xs text-gray-500 mt-1">
                Period ends:{" "}
                {new Date(data.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="text-sm border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50"
            >
              View all plans
            </Link>
            {data.hasStripeCustomer && (
              <button
                type="button"
                onClick={openPortal}
                disabled={portalLoading}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:opacity-90"
              >
                {portalLoading ? "Opening…" : "Manage in Stripe"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-medium text-gray-800">Usage this company</h2>
        {resources.map((key) => {
          const max = data.limits[key] ?? 0;
          const used = data.usage[key] ?? 0;
          const p = pct(used, max);
          return (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span className="capitalize">{key}</span>
                <span>
                  {used} / {max === -1 ? "∞" : max}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    p >= 90 ? "bg-amber-500" : "bg-gray-800"
                  }`}
                  style={{ width: max === -1 ? "0%" : `${p}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-800 mb-4">Upgrade</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => upgrade("starter")}
            disabled={checkoutLoading !== null || data.planKey === "starter"}
            className="text-sm bg-amber-500 text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 disabled:opacity-40"
          >
            {checkoutLoading === "starter" ? "…" : "Upgrade to Starter"}
          </button>
          <button
            type="button"
            onClick={() => upgrade("pro")}
            disabled={checkoutLoading !== null || data.planKey === "pro"}
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40"
          >
            {checkoutLoading === "pro" ? "…" : "Upgrade to Pro"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Requires Stripe env vars and price IDs on the server. Free tier stays
          active without Stripe.
        </p>
      </div>
    </div>
  );
}
