"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";
import { Check } from "lucide-react";

type Plan = {
  key: string;
  name: string;
  description: string;
  limits: Record<string, number>;
  features: string[];
  isPaid: boolean;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/billing/plans")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load plans");
        setLoading(false);
      });
  }, []);

  const startCheckout = async (planKey: string) => {
    if (planKey === "free") {
      window.location.href = "/dashboard";
      return;
    }
    setCheckoutLoading(planKey);
    try {
      const res = await apiFetch("/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || "Checkout unavailable");
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setCheckoutLoading(null);
    }
  };

  const fmtLimit = (n: number) => (n === -1 ? "Unlimited" : n.toLocaleString());

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center text-gray-500">
        Loading plans…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Subscription
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mt-2">
          Simple plans that scale with you
        </h1>
        <p className="text-gray-600 mt-3 text-sm sm:text-base">
          Sell Creonox CRM as a hosted SaaS: each company is isolated, with
          usage limits by tier. Connect Stripe to charge monthly subscriptions.
        </p>
        {!API_BASE && (
          <p className="text-amber-800 text-sm mt-4">
            Set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_API_URL</code>{" "}
            in the client environment.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl border p-6 flex flex-col bg-white shadow-sm ${
              plan.key === "starter"
                ? "border-amber-400 ring-2 ring-amber-200/60 scale-[1.02]"
                : "border-gray-200"
            }`}
          >
            <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
            <p className="text-sm text-gray-500 mt-1 flex-1">{plan.description}</p>

            <ul className="mt-6 space-y-2 text-sm text-gray-700">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
              <p>
                Leads / customers: {fmtLimit(plan.limits.leads)} /{" "}
                {fmtLimit(plan.limits.customers)}
              </p>
              <p>
                Deals / invoices / quotes: {fmtLimit(plan.limits.deals)} /{" "}
                {fmtLimit(plan.limits.invoices)} / {fmtLimit(plan.limits.quotes)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => startCheckout(plan.key)}
              disabled={checkoutLoading !== null}
              className={`mt-6 w-full py-2.5 rounded-xl text-sm font-medium transition ${
                plan.key === "free"
                  ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {checkoutLoading === plan.key
                ? "Redirecting…"
                : plan.key === "free"
                  ? "Continue with Free"
                  : "Subscribe via Stripe"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-500 mt-12 max-w-xl mx-auto">
        Configure <code className="bg-gray-100 px-1 rounded">STRIPE_SECRET_KEY</code>{" "}
        and price IDs on the server. Use the Stripe CLI or Dashboard to forward
        webhooks to <code className="bg-gray-100 px-1 rounded">/api/billing/webhook</code>.
      </p>
    </div>
  );
}
