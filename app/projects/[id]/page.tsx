"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ArrowLeft,
  LayoutGrid,
  Layers,
  List,
  Plus,
  Trash2,
  IndianRupee,
  Briefcase,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import {
  formatCurrency,
  formatCroreLabel,
  labelDelivery,
  labelEngagement,
  labelHealth,
  labelProjectStage,
} from "@/lib/formatMoney";

const BOARD_COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
] as const;

const ISSUE_TYPES = ["task", "story", "bug", "epic", "subtask"] as const;
const PRIORITIES = ["lowest", "low", "medium", "high", "highest"] as const;

type TaskDoc = {
  _id: string;
  issueKey?: string;
  issueNumber?: number;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  issueType?: string;
  status: string;
  priority?: string;
  assignee?: { _id: string; name?: string; email?: string } | null;
  reporter?: { _id: string; name?: string; email?: string } | null;
  labels?: string[];
  timeSpent?: number;
  dueDate?: string | null;
  updatedAt?: string;
};

type AssignableUser = { id: string; name: string; email?: string };

type ProjectDoc = {
  _id: string;
  name?: string;
  description?: string;
  issueKeyPrefix?: string;
  projectCode?: string;
  customer?: { _id?: string; companyName?: string; name?: string } | string | null;
  projectStage?: string;
  health?: string;
  priority?: string;
  engagementType?: string;
  deliveryModel?: string;
  contractValue?: number;
  currency?: string;
  contractReference?: string;
  clientPoNumber?: string;
  invoicedToDate?: number;
  estimatedInternalCost?: number;
  blendedHourlyRate?: number;
  accountManager?: { _id: string; name?: string; email?: string } | null;
  techStack?: string[];
  successCriteria?: string;
  risksAndDependencies?: string;
  startDate?: string | null;
  deadline?: string | null;
  createdAt?: string;
};

type SummaryDoc = {
  taskCount: number;
  tasksDone: number;
  progressPercent: number;
  totalTimeMinutes: number;
  estimatedSellFromLoggedTime: number;
  milestoneCount: number;
  milestonesDone: number;
  contractValue: number;
  invoicedToDate: number;
  estimatedInternalCost: number;
  unbilledContractValue: number;
  marginVsContract: number;
  currency: string;
};

type MilestoneDoc = {
  _id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  status: string;
  billingAmount?: number;
  billingPercent?: number;
  sortOrder?: number;
};

type CustomerOpt = { _id: string; companyName?: string; name?: string };

function typeStyle(t: string | undefined) {
  const x = (t || "task").toLowerCase();
  const map: Record<string, string> = {
    bug: "bg-rose-100 text-rose-800",
    story: "bg-indigo-100 text-indigo-800",
    epic: "bg-violet-100 text-violet-800",
    subtask: "bg-slate-100 text-slate-700",
    task: "bg-blue-100 text-blue-800",
  };
  return map[x] || map.task;
}

function priorityStyle(p: string | undefined) {
  const x = (p || "medium").toLowerCase();
  if (x === "highest" || x === "high") return "text-amber-700 font-medium";
  if (x === "lowest" || x === "low") return "text-gray-500";
  return "text-gray-700";
}

export default function ProjectManagementPage() {
  const params = useParams();
  const projectId = String(params?.id || "");
  const { workspaceReady, companyId, workspaceUser } = useCompany();

  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [summary, setSummary] = useState<SummaryDoc | null>(null);
  const [milestones, setMilestones] = useState<MilestoneDoc[]>([]);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [progress, setProgress] = useState(0);
  const [assignable, setAssignable] = useState<AssignableUser[]>([]);
  const [mainTab, setMainTab] = useState<
    "overview" | "commercial" | "delivery" | "milestones" | "work"
  >("overview");
  const [view, setView] = useState<"board" | "backlog" | "list">("board");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    issueType: "task",
    priority: "medium",
    status: "backlog",
    assignee: "",
  });

  const [newMilestone, setNewMilestone] = useState({
    title: "",
    targetDate: "",
    billingAmount: "",
    billingPercent: "",
  });

  const loadAll = useCallback(async () => {
    if (!workspaceReady || !companyId || !projectId) return;
    setLoadError(null);
    try {
      const [pr, ts, prog, asg, sum, ms, cust] = await Promise.all([
        apiFetch(`/projects/${projectId}`),
        apiFetch(`/tasks/project/${projectId}`),
        apiFetch(`/projects/${projectId}/progress`),
        apiFetch("/users/assignable"),
        apiFetch(`/projects/${projectId}/summary`),
        apiFetch(`/projects/${projectId}/milestones`),
        apiFetch("/customers"),
      ]);
      if (!pr.ok) {
        setLoadError("Project not found or inaccessible.");
        setProject(null);
        return;
      }
      const pj = (await pr.json()) as ProjectDoc;
      setProject(pj);
      const taskData = ts.ok ? await ts.json() : [];
      setTasks(Array.isArray(taskData) ? taskData : []);
      const pdata = prog.ok ? await prog.json() : {};
      setProgress(typeof pdata.progress === "number" ? pdata.progress : 0);
      const ad = asg.ok ? await asg.json() : [];
      setAssignable(Array.isArray(ad) ? ad : []);
      if (sum.ok) {
        setSummary((await sum.json()) as SummaryDoc);
      } else setSummary(null);
      if (ms.ok) {
        const ml = await ms.json();
        setMilestones(Array.isArray(ml) ? ml : []);
      } else setMilestones([]);
      if (cust.ok) {
        const cl = await cust.json();
        setCustomers(Array.isArray(cl) ? cl : []);
      } else setCustomers([]);
    } catch {
      setLoadError("Failed to load project.");
    }
  }, [workspaceReady, companyId, projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selected = useMemo(
    () => tasks.find((t) => t._id === selectedId) || null,
    [tasks, selectedId]
  );

  const backlogOnly = useMemo(
    () => tasks.filter((t) => t.status === "backlog"),
    [tasks]
  );

  const sortedForList = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const na = a.issueNumber ?? 0;
      const nb = b.issueNumber ?? 0;
      if (na !== nb) return na - nb;
      return String(a._id).localeCompare(String(b._id));
    });
  }, [tasks]);

  const updateTask = async (id: string, body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || err.message || "Update failed");
        return;
      }
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const task = tasks.find((t) => t._id === draggableId);
    if (!task || task.status === newStatus) return;
    await updateTask(draggableId, { status: newStatus });
  };

  const createIssue = async () => {
    const title = createForm.title.trim();
    if (!title) {
      alert("Title is required");
      return;
    }
    const res = await apiFetch(`/tasks/project/${projectId}`, {
      method: "POST",
      body: JSON.stringify({
        title,
        description: createForm.description,
        issueType: createForm.issueType,
        priority: createForm.priority,
        status: createForm.status,
        assignee: createForm.assignee || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || err.message || "Create failed");
      return;
    }
    setCreateOpen(false);
    setCreateForm({
      title: "",
      description: "",
      issueType: "task",
      priority: "medium",
      status: "backlog",
      assignee: "",
    });
    await loadAll();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this issue? This cannot be undone.")) return;
    const res = await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || err.message || "Delete failed");
      return;
    }
    if (selectedId === id) setSelectedId(null);
    await loadAll();
  };

  const patchProject = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || err.message || "Save failed");
        return;
      }
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const customerIdValue = (c: ProjectDoc["customer"]) => {
    if (!c) return "";
    if (typeof c === "object" && "_id" in c && c._id) return String(c._id);
    return String(c);
  };

  const addMilestone = async () => {
    const title = newMilestone.title.trim();
    if (!title) {
      alert("Milestone title required");
      return;
    }
    const res = await apiFetch(`/projects/${projectId}/milestones`, {
      method: "POST",
      body: JSON.stringify({
        title,
        targetDate: newMilestone.targetDate || undefined,
        billingAmount: newMilestone.billingAmount
          ? Number(newMilestone.billingAmount)
          : 0,
        billingPercent: newMilestone.billingPercent
          ? Number(newMilestone.billingPercent)
          : 0,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || err.message || "Failed");
      return;
    }
    setNewMilestone({ title: "", targetDate: "", billingAmount: "", billingPercent: "" });
    await loadAll();
  };

  const updateMilestone = async (mid: string, body: Record<string, unknown>) => {
    const res = await apiFetch(`/projects/${projectId}/milestones/${mid}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || err.message || "Update failed");
      return;
    }
    await loadAll();
  };

  const deleteMilestone = async (mid: string) => {
    if (!confirm("Remove this milestone?")) return;
    const res = await apiFetch(`/projects/${projectId}/milestones/${mid}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    await loadAll();
  };

  const cur = project?.currency || "INR";

  if (!workspaceReady) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  if (loadError || !project) {
    return (
      <div className="max-w-lg space-y-4 p-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <p className="text-sm text-red-600">{loadError || "Project not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              All projects
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {project.name}
              </h1>
              {project.projectCode ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                  {project.projectCode}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Issues <span className="font-mono font-medium">{project.issueKeyPrefix}</span>
              {" · "}
              {typeof project.customer === "object" && project.customer
                ? project.customer.companyName || project.customer.name
                : "No client"}
              {" · "}
              <span className="text-gray-700">{labelProjectStage(project.projectStage)}</span>
              {" · "}
              <span
                className={
                  project.health === "at_risk"
                    ? "text-amber-700 font-medium"
                    : project.health === "blocked"
                      ? "text-red-600 font-medium"
                      : ""
                }
              >
                {labelHealth(project.health)}
              </span>
            </p>
            <div className="mt-3 max-w-xl">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-gray-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress}% issues done ·{" "}
                {summary
                  ? `${summary.tasksDone}/${summary.taskCount} closed`
                  : "—"}
              </p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Contract</p>
            <p className="text-lg font-semibold text-gray-900 flex items-center justify-end gap-1">
              <IndianRupee className="h-4 w-4 opacity-60" aria-hidden />
              {formatCurrency(project.contractValue, cur)}
            </p>
            {formatCroreLabel(Number(project.contractValue || 0), cur) ? (
              <p className="text-xs text-indigo-700 font-medium">
                {formatCroreLabel(Number(project.contractValue || 0), cur)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1 border-t border-gray-100 pt-4">
          {(
            [
              ["overview", BarChart3, "Overview"],
              ["commercial", IndianRupee, "Commercial"],
              ["delivery", Target, "Delivery"],
              ["milestones", Calendar, "Milestones"],
              ["work", Briefcase, "Issues & board"],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMainTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                mainTab === key
                  ? "bg-gray-900 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mainTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!summary ? (
            <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              Financial KPIs could not be loaded. Check your connection and refresh; commercial
              fields on the Commercial tab are still saved on the project.
            </div>
          ) : null}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Contract value
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(
                summary?.contractValue ?? project.contractValue,
                summary?.currency ?? project.currency
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">SOW / order value</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Invoiced
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(
                summary?.invoicedToDate ?? project.invoicedToDate,
                summary?.currency ?? project.currency
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Unbilled{" "}
              {formatCurrency(
                summary?.unbilledContractValue ??
                  Math.max(
                    0,
                    Number(project.contractValue ?? 0) - Number(project.invoicedToDate ?? 0)
                  ),
                summary?.currency ?? project.currency
              )}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Est. margin
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(
                summary?.marginVsContract ??
                  Number(project.contractValue ?? 0) -
                    Number(project.estimatedInternalCost ?? 0),
                summary?.currency ?? project.currency
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">Contract − internal cost</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Logged time value
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(
                summary?.estimatedSellFromLoggedTime,
                summary?.currency ?? project.currency
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary
                ? `${Math.round(summary.totalTimeMinutes / 60)}h × blended rate`
                : "Open Work tab to log time on issues"}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Engagement
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {labelEngagement(project.engagementType)} · {labelDelivery(project.deliveryModel)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Account manager:{" "}
              <span className="font-medium text-gray-800">
                {project.accountManager?.name ||
                  project.accountManager?.email ||
                  "—"}
              </span>
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Milestones
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {summary
                ? `${summary.milestonesDone}/${summary.milestoneCount}`
                : "—"}
            </p>
            <p className="text-xs text-gray-500">completed</p>
          </div>
          {project.description ? (
            <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                Scope summary
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </div>
          ) : null}
        </div>
      )}

      {mainTab === "commercial" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-3xl">
          <h2 className="text-sm font-semibold text-gray-900">Commercial & billing</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-gray-600">
              Contract value ({cur})
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.contractValue ?? 0}
                key={`cv-${project._id}-${project.contractValue}`}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== Number(project.contractValue))
                    void patchProject({ contractValue: v });
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Invoiced to date
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.invoicedToDate ?? 0}
                key={`inv-${project._id}-${project.invoicedToDate}`}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== Number(project.invoicedToDate))
                    void patchProject({ invoicedToDate: v });
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Est. internal cost
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.estimatedInternalCost ?? 0}
                key={`ic-${project._id}-${project.estimatedInternalCost}`}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== Number(project.estimatedInternalCost))
                    void patchProject({ estimatedInternalCost: v });
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Blended hourly rate (sell)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.blendedHourlyRate ?? 0}
                key={`br-${project._id}-${project.blendedHourlyRate}`}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== Number(project.blendedHourlyRate))
                    void patchProject({ blendedHourlyRate: v });
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
              Contract / SOW reference
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.contractReference || ""}
                key={`cr-${project._id}`}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (project.contractReference || ""))
                    void patchProject({ contractReference: v });
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
              Client PO number
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.clientPoNumber || ""}
                key={`po-${project._id}`}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (project.clientPoNumber || ""))
                    void patchProject({ clientPoNumber: v });
                }}
              />
            </label>
          </div>
        </div>
      )}

      {mainTab === "delivery" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-3xl">
          <h2 className="text-sm font-semibold text-gray-900">Delivery & governance</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-gray-600">
              Stage
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={project.projectStage || "discovery"}
                onChange={(e) => void patchProject({ projectStage: e.target.value })}
              >
                {[
                  "discovery",
                  "proposal",
                  "signed",
                  "kickoff",
                  "build",
                  "uat",
                  "launch",
                  "warranty",
                  "closed",
                ].map((s) => (
                  <option key={s} value={s}>
                    {labelProjectStage(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Health
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={project.health || "on_track"}
                onChange={(e) => void patchProject({ health: e.target.value })}
              >
                {["on_track", "at_risk", "blocked", "completed"].map((h) => (
                  <option key={h} value={h}>
                    {labelHealth(h)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Engagement
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={project.engagementType || "fixed_price"}
                onChange={(e) => void patchProject({ engagementType: e.target.value })}
              >
                {["fixed_price", "time_materials", "retainer", "hybrid"].map((x) => (
                  <option key={x} value={x}>
                    {labelEngagement(x)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Delivery model
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={project.deliveryModel || "fixed_scope"}
                onChange={(e) => void patchProject({ deliveryModel: e.target.value })}
              >
                {[
                  "dedicated_team",
                  "sprint_based",
                  "staff_augmentation",
                  "fixed_scope",
                ].map((x) => (
                  <option key={x} value={x}>
                    {labelDelivery(x)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Start date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={
                  project.startDate
                    ? String(project.startDate).slice(0, 10)
                    : ""
                }
                key={`sd-${project._id}`}
                onBlur={(e) =>
                  void patchProject({
                    startDate: e.target.value || null,
                  })
                }
              />
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Go-live / deadline
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={
                  project.deadline ? String(project.deadline).slice(0, 10) : ""
                }
                key={`dl-${project._id}`}
                onBlur={(e) =>
                  void patchProject({
                    deadline: e.target.value || null,
                  })
                }
              />
            </label>
            <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
              Client
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={customerIdValue(project.customer)}
                onChange={(e) =>
                  void patchProject({
                    customer: e.target.value || null,
                  })
                }
              >
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName || c.name || c._id}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
              Account manager
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={project.accountManager?._id || ""}
                onChange={(e) =>
                  void patchProject({
                    accountManager: e.target.value || null,
                  })
                }
              >
                <option value="">—</option>
                {assignable.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
              Tech stack (comma-separated)
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={(project.techStack || []).join(", ")}
                key={`ts-${project._id}`}
                onBlur={(e) =>
                  void patchProject({
                    techStack: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
              Success criteria
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.successCriteria || ""}
                key={`sc-${project._id}`}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (project.successCriteria || ""))
                    void patchProject({ successCriteria: v });
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
              Risks & dependencies
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={project.risksAndDependencies || ""}
                key={`rd-${project._id}`}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (project.risksAndDependencies || ""))
                    void patchProject({ risksAndDependencies: v });
                }}
              />
            </label>
          </div>
        </div>
      )}

      {mainTab === "milestones" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 flex flex-wrap gap-3 items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">SOW milestones</h2>
              <p className="text-xs text-gray-500">
                Tie delivery gates to billing (amount or %).
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <input
                placeholder="Title"
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                value={newMilestone.title}
                onChange={(e) =>
                  setNewMilestone((m) => ({ ...m, title: e.target.value }))
                }
              />
              <input
                type="date"
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                value={newMilestone.targetDate}
                onChange={(e) =>
                  setNewMilestone((m) => ({ ...m, targetDate: e.target.value }))
                }
              />
              <input
                placeholder="Bill ₹"
                className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                value={newMilestone.billingAmount}
                onChange={(e) =>
                  setNewMilestone((m) => ({ ...m, billingAmount: e.target.value }))
                }
              />
              <input
                placeholder="%"
                className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                value={newMilestone.billingPercent}
                onChange={(e) =>
                  setNewMilestone((m) => ({ ...m, billingPercent: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => void addMilestone()}
                className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white"
              >
                Add
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-left">Milestone</th>
                <th className="p-3 text-left">Target</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Bill ₹</th>
                <th className="p-3 text-right">%</th>
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {milestones.map((m) => (
                <tr key={m._id}>
                  <td className="p-3 font-medium text-gray-900">{m.title}</td>
                  <td className="p-3 text-gray-600">
                    {m.targetDate
                      ? new Date(m.targetDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={m.status}
                      onChange={(e) =>
                        void updateMilestone(m._id, { status: e.target.value })
                      }
                    >
                      {["pending", "in_progress", "done", "skipped"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.billingAmount != null ? m.billingAmount : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.billingPercent != null ? m.billingPercent : "—"}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="text-red-500 text-xs"
                      onClick={() => void deleteMilestone(m._id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {milestones.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No milestones yet.</p>
          ) : null}
        </div>
      )}

      {mainTab === "work" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
              {(
                [
                  ["board", LayoutGrid, "Board"],
                  ["backlog", Layers, "Backlog"],
                  ["list", List, "List"],
                ] as const
              ).map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                    view === key
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Create issue
            </button>
          </div>

      {view === "board" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {BOARD_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="w-72 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {col.label}
                    </h2>
                    <span className="text-xs text-gray-400">{colTasks.length}</span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(dropProvided, snapshot) => (
                      <div
                        ref={dropProvided.innerRef}
                        {...dropProvided.droppableProps}
                        className={`min-h-[200px] rounded-xl border p-2 transition-colors ${
                          snapshot.isDraggingOver
                            ? "border-gray-400 bg-gray-100/80"
                            : "border-gray-200 bg-gray-50/80"
                        }`}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                          >
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedId(task._id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedId(task._id);
                                  }
                                }}
                                className="mb-2 cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing hover:border-gray-300"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-mono text-[11px] text-gray-400">
                                    {task.issueKey}
                                  </span>
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${typeStyle(
                                      task.issueType
                                    )}`}
                                  >
                                    {task.issueType || "task"}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-medium text-gray-900 line-clamp-2">
                                  {task.title}
                                </p>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                  <span className={priorityStyle(task.priority)}>
                                    {task.priority || "medium"}
                                  </span>
                                  <span className="truncate text-gray-500 max-w-[120px]">
                                    {task.assignee?.name ||
                                      task.assignee?.email ||
                                      "Unassigned"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {dropProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {view === "backlog" && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Backlog</h2>
            <p className="text-xs text-gray-500">
              Issues in Backlog status — open one to edit or drag it on the Board.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {backlogOnly.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-gray-400">
                No backlog issues. Create one or move cards to Backlog on the board.
              </li>
            ) : (
              backlogOnly.map((task) => (
                <li key={task._id} className="flex items-center gap-4 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(task._id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="font-mono text-xs text-gray-400">
                      {task.issueKey}
                    </span>
                    <p className="font-medium text-gray-900">{task.title}</p>
                  </button>
                  <span className={`text-xs ${priorityStyle(task.priority)}`}>
                    {task.priority}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {view === "list" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedForList.map((task) => (
                <tr
                  key={task._id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedId(task._id)}
                >
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {task.issueKey}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">{task.title}</td>
                  <td className="px-4 py-2 text-gray-600">{task.issueType}</td>
                  <td className="px-4 py-2 text-gray-600">{task.status.replace(/_/g, " ")}</td>
                  <td className={`px-4 py-2 ${priorityStyle(task.priority)}`}>
                    {task.priority}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {task.assignee?.name || task.assignee?.email || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        </>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Create issue</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-gray-600">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="What needs to be done?"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Description
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-gray-600">
                  Type
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={createForm.issueType}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, issueType: e.target.value }))
                    }
                  >
                    {ISSUE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Priority
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={createForm.priority}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, priority: e.target.value }))
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-medium text-gray-600">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  {BOARD_COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Assignee
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={createForm.assignee}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, assignee: e.target.value }))
                  }
                >
                  <option value="">Unassigned</option>
                  {assignable.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.email ? ` (${u.email})` : ""}
                    </option>
                  ))}
                </select>
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
                onClick={createIssue}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-gray-200 bg-white shadow-2xl flex flex-col">
          <div className="flex items-start justify-between border-b border-gray-100 p-4">
            <div>
              <p className="font-mono text-xs text-gray-400">{selected.issueKey}</p>
              <h2 className="text-lg font-semibold text-gray-900">Issue details</h2>
            </div>
            <button
              type="button"
              aria-label="Close"
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
              onClick={() => setSelectedId(null)}
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <label className="block text-xs font-medium text-gray-600">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                defaultValue={selected.title}
                key={`${selected._id}-t-${selected.updatedAt || ""}`}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== selected.title) updateTask(selected._id, { title: v });
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Description
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                rows={4}
                defaultValue={selected.description || ""}
                key={`${selected._id}-d-${selected.updatedAt || ""}`}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (selected.description || "")) {
                    updateTask(selected._id, { description: v });
                  }
                }}
              />
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Acceptance criteria
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                rows={3}
                defaultValue={selected.acceptanceCriteria || ""}
                key={`${selected._id}-ac-${selected.updatedAt || ""}`}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (selected.acceptanceCriteria || "")) {
                    updateTask(selected._id, { acceptanceCriteria: v });
                  }
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-gray-600">
                Type
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={selected.issueType || "task"}
                  onChange={(e) =>
                    updateTask(selected._id, { issueType: e.target.value })
                  }
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Priority
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={selected.priority || "medium"}
                  onChange={(e) =>
                    updateTask(selected._id, { priority: e.target.value })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-xs font-medium text-gray-600">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={selected.status}
                onChange={(e) =>
                  updateTask(selected._id, { status: e.target.value })
                }
              >
                {BOARD_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Assignee
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={selected.assignee?._id || ""}
                onChange={(e) =>
                  updateTask(selected._id, {
                    assignee: e.target.value || null,
                  })
                }
              >
                <option value="">Unassigned</option>
                {assignable.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
              <p>
                Reporter:{" "}
                <span className="font-medium text-gray-900">
                  {selected.reporter?.name ||
                    selected.reporter?.email ||
                    "—"}
                </span>
                {workspaceUser?.id === String(selected.reporter?._id ?? "") ? " (you)" : null}
              </p>
              <p className="mt-1">
                Time logged:{" "}
                <span className="font-mono">{selected.timeSpent || 0} min</span>
              </p>
              <button
                type="button"
                className="mt-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-100"
                onClick={() =>
                  updateTask(selected._id, {
                    timeSpent: (selected.timeSpent || 0) + 30,
                  })
                }
              >
                +30 min
              </button>
            </div>
          </div>
          <div className="border-t border-gray-100 p-4 flex gap-2">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
              onClick={() => deleteTask(selected._id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete issue
            </button>
          </div>
          {saving && (
            <p className="px-4 pb-2 text-center text-xs text-gray-400">Saving…</p>
          )}
        </div>
      )}
    </div>
  );
}
