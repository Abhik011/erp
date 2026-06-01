"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import {
  formatCroreLabel,
  formatCurrency,
  labelEngagement,
  labelHealth,
  labelProjectStage,
} from "@/lib/formatMoney";

const ENGAGEMENT_OPTIONS = [
  ["fixed_price", "Fixed price"],
  ["time_materials", "Time & materials"],
  ["retainer", "Retainer"],
  ["hybrid", "Hybrid"],
] as const;

const DELIVERY_OPTIONS = [
  ["fixed_scope", "Fixed scope"],
  ["dedicated_team", "Dedicated team"],
  ["sprint_based", "Sprint-based"],
  ["staff_augmentation", "Staff augmentation"],
] as const;

const STAGE_OPTIONS = [
  ["discovery", "Discovery"],
  ["proposal", "Proposal"],
  ["signed", "Signed"],
  ["kickoff", "Kickoff"],
  ["build", "Build"],
  ["uat", "UAT"],
  ["launch", "Launch"],
  ["warranty", "Warranty"],
  ["closed", "Closed"],
] as const;

export default function ProjectsPage() {
  const router = useRouter();
  const { workspaceReady, companyId } = useCompany();

  type ProjectRow = {
    _id: string;
    name?: string;
    projectCode?: string;
    issueKeyPrefix?: string;
    projectStage?: string;
    health?: string;
    engagementType?: string;
    contractValue?: number;
    currency?: string;
    customer?: { _id?: string; companyName?: string; name?: string };
    progress?: number;
  };

  type CustomerOpt = { _id: string; companyName?: string; name?: string };

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newContractValue, setNewContractValue] = useState("");
  const [newCurrency, setNewCurrency] = useState("INR");
  const [newEngagement, setNewEngagement] = useState<string>("fixed_price");
  const [newDelivery, setNewDelivery] = useState<string>("fixed_scope");
  const [newStage, setNewStage] = useState<string>("discovery");
  const [newDescription, setNewDescription] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      const client = (p.customer?.companyName || p.customer?.name || "").toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.projectCode || "").toLowerCase().includes(q) ||
        client.includes(q)
      );
    });
  }, [search, projects]);

  useEffect(() => {
    if (!workspaceReady) return;
    if (!companyId) {
      queueMicrotask(() => {
        setProjects([]);
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => setLoading(true));
    Promise.all([
      apiFetch("/projects").then((r) => r.json()),
      apiFetch("/customers").then((r) => r.json()).catch(() => []),
    ])
      .then(async ([data, custList]) => {
        const list = Array.isArray(data) ? data : [];
        const customersArr = Array.isArray(custList) ? custList : [];
        setCustomers(
          customersArr.map((c: { _id: string; companyName?: string; name?: string }) => ({
            _id: String(c._id),
            companyName: c.companyName,
            name: c.name,
          }))
        );
        const withProgress = await Promise.all(
          list.map(async (p: ProjectRow) => {
            try {
              const res = await apiFetch(`/projects/${p._id}/progress`);
              const prog = await res.json();
              return { ...p, progress: prog.progress };
            } catch {
              return { ...p, progress: 0 };
            }
          })
        );

        setProjects(withProgress);
        setLoading(false);
      })
      .catch(() => {
        setProjects([]);
        setLoading(false);
      });
  }, [workspaceReady, companyId]);

  function healthBadgeClass(h?: string) {
    switch (h) {
      case "on_track":
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
      case "at_risk":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "blocked":
        return "border-red-200 bg-red-50 text-red-800";
      case "completed":
        return "border-slate-200 bg-slate-100 text-slate-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  }

  // SEARCH

  if (!workspaceReady) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  if (loading)
    return <div className="p-6 text-gray-500">Loading projects...</div>;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500">
            {projects.length} project{projects.length === 1 ? "" : "s"} · portfolio view
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewName("");
            setNewPrefix("");
            setNewCode("");
            setNewCustomerId("");
            setNewContractValue("");
            setNewCurrency("INR");
            setNewEngagement("fixed_price");
            setNewDelivery("fixed_scope");
            setNewStage("discovery");
            setNewDescription("");
            setCreateOpen(true);
          }}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          New project
        </button>

      </div>

      {/* SEARCH */}
      <input
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
      />

      {/* PORTFOLIO TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No projects found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/90 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3 text-right">Contract</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3 w-40">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const cur = p.currency || "INR";
                  const cv = p.contractValue ?? 0;
                  const crHint = formatCroreLabel(cv, cur);
                  return (
                    <tr
                      key={p._id}
                      onClick={() => router.push(`/projects/${p._id}`)}
                      className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {p.projectCode ? (
                            <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
                              {p.projectCode}
                            </span>
                          ) : null}
                          {p.issueKeyPrefix ? (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
                              {p.issueKeyPrefix}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 align-top">
                        {p.customer?.companyName || p.customer?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 align-top whitespace-nowrap">
                        {labelProjectStage(p.projectStage)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${healthBadgeClass(
                            p.health
                          )}`}
                        >
                          {labelHealth(p.health)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="font-mono text-xs font-medium text-gray-900">
                          {formatCurrency(cv, cur)}
                        </div>
                        {crHint ? (
                          <div className="mt-0.5 text-[10px] text-gray-500">{crHint}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600 align-top text-xs max-w-[140px]">
                        {labelEngagement(p.engagementType)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-1">
                          <span>{p.progress ?? 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gray-900 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, p.progress ?? 0)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">New project</h2>
            <p className="mt-1 text-sm text-gray-500">
              Capture commercial context up front; you can refine delivery, milestones, and
              billing on the project record.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-gray-600">
                Name <span className="text-red-500">*</span>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Acme — platform rebuild"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-gray-600">
                  Project code
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="ACM-P1"
                    maxLength={40}
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Issue prefix
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono uppercase"
                    value={newPrefix}
                    onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                    placeholder="ACM"
                    maxLength={8}
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-gray-600">
                Client
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                >
                  <option value="">— None —</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName || c.name || c._id}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-gray-600">
                  Contract value
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={newContractValue}
                    onChange={(e) => setNewContractValue(e.target.value)}
                    placeholder="10000000"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Currency
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
                    placeholder="INR"
                    maxLength={8}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block text-xs font-medium text-gray-600">
                  Stage
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                  >
                    {STAGE_OPTIONS.map(([v, lab]) => (
                      <option key={v} value={v}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Engagement
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={newEngagement}
                    onChange={(e) => setNewEngagement(e.target.value)}
                  >
                    {ENGAGEMENT_OPTIONS.map(([v, lab]) => (
                      <option key={v} value={v}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Delivery model
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={newDelivery}
                    onChange={(e) => setNewDelivery(e.target.value)}
                  >
                    {DELIVERY_OPTIONS.map(([v, lab]) => (
                      <option key={v} value={v}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-medium text-gray-600">
                Scope summary
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="High-level scope, exclusions, and success notes…"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                onClick={async () => {
                  const name = newName.trim();
                  if (!name) {
                    alert("Project name is required");
                    return;
                  }
                  const contractValue = Number(newContractValue);
                  const body: Record<string, unknown> = {
                    name,
                    issueKeyPrefix: newPrefix.trim() || undefined,
                    projectCode: newCode.trim() || undefined,
                    customer: newCustomerId || undefined,
                    contractValue: Number.isFinite(contractValue) ? contractValue : 0,
                    currency: (newCurrency.trim() || "INR").toUpperCase(),
                    engagementType: newEngagement,
                    deliveryModel: newDelivery,
                    projectStage: newStage,
                    description: newDescription.trim() || undefined,
                  };
                  const res = await apiFetch("/projects", {
                    method: "POST",
                    body: JSON.stringify(body),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    alert(
                      (data as { error?: string; message?: string }).error ||
                        (data as { message?: string }).message ||
                        "Create failed"
                    );
                    return;
                  }
                  setCreateOpen(false);
                  router.push(`/projects/${(data as { _id: string })._id}`);
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}