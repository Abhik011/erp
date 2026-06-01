"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  useCompany,
  canManageUsers,
  isSuperAdmin,
} from "@/components/CompanyProvider";

const ASSIGNABLE_ROLES: { value: string; label: string }[] = [
  { value: "super_admin", label: "Super admin" },
  { value: "admin", label: "Admin" },
  { value: "sales", label: "Sales" },
  { value: "developer", label: "Developer" },
  { value: "finance", label: "Finance" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employee" },
  { value: "viewer", label: "Viewer" },
];

const INVITE_ROLE_OPTIONS = ASSIGNABLE_ROLES.filter(
  (r) => r.value !== "super_admin"
);

function formatRoleLabel(role: string | undefined) {
  if (!role) return "";
  return role.replace(/_/g, " ");
}

type WorkspaceUserRow = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function UsersPage() {
  const { workspaceUser, workspaceReady } = useCompany();

  const [users, setUsers] = useState<WorkspaceUserRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
  });

  const fetchUsers = useCallback(async () => {
    setLoadError(null);
    const res = await apiFetch("/users");
    if (res.status === 403) {
      setLoadError("You do not have permission to view this page.");
      setUsers([]);
      return;
    }
    if (!res.ok) {
      setLoadError("Could not load users.");
      setUsers([]);
      return;
    }
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!workspaceReady) return;
    if (!canManageUsers(workspaceUser?.role)) return;
    queueMicrotask(() => {
      void fetchUsers();
    });
  }, [workspaceReady, workspaceUser?.role, fetchUsers]);

  const createUser = async () => {
    const res = await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = [data.message, data.code].filter(Boolean).join(" — ");
      alert(msg || "Create failed");
      return;
    }
    if (data.emailWarning) {
      alert(
        `User was created but the invite email was not sent.\n\n${data.emailWarning}\n\nConfigure EMAIL_USER and EMAIL_PASS in the backend .env.`
      );
    }
    setShowModal(false);
    setForm({ name: "", email: "", role: "employee" });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (
      !confirm(
        "Permanently remove this person from the workspace and delete their Clerk account? This cannot be undone."
      )
    )
      return;
    const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "Delete failed");
      return;
    }
    fetchUsers();
  };

  const updateRole = async (id: string, role: string) => {
    const res = await apiFetch(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "Update failed");
      return;
    }
    fetchUsers();
  };

  if (!workspaceReady) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  if (!canManageUsers(workspaceUser?.role)) {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900">User management</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Only workspace admins can view and manage users. Ask a super admin to grant you admin access.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">User management</h1>

        {isSuperAdmin(workspaceUser?.role) && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Add user
          </button>
        )}
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-3 py-2">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Stat title="Total" value={users.length} />
        <Stat
          title="Super admins"
          value={users.filter((u) => u.role === "super_admin").length}
        />
        <Stat title="Admins" value={users.filter((u) => u.role === "admin").length} />
        <Stat title="Sales" value={users.filter((u) => u.role === "sales").length} />
        <Stat title="Developers" value={users.filter((u) => u.role === "developer").length} />
        <Stat title="Finance" value={users.filter((u) => u.role === "finance").length} />
        <Stat title="Managers" value={users.filter((u) => u.role === "manager").length} />
        <Stat title="Employees" value={users.filter((u) => u.role === "employee").length} />
        <Stat title="Viewers" value={users.filter((u) => u.role === "viewer").length} />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  {isSuperAdmin(workspaceUser?.role) ? (
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u._id, e.target.value)}
                      className="border rounded px-2 py-1 max-w-[11rem]"
                    >
                      {ASSIGNABLE_ROLES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="capitalize">{formatRoleLabel(u.role)}</span>
                  )}
                </td>
                <td className="p-3">
                  {isSuperAdmin(workspaceUser?.role) &&
                    u._id !== workspaceUser?.id && (
                      <button
                        type="button"
                        onClick={() => deleteUser(u._id)}
                        className="text-red-500"
                        title="Remove user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && isSuperAdmin(workspaceUser?.role) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
            <h2 className="font-semibold">Invite user</h2>
            <p className="text-xs text-gray-500">
              Generates a temporary password in Clerk, applies it to the account, and emails
              step-by-step sign-in instructions. Linked accounts may receive a new password when
              Clerk allows it. Requires EMAIL_USER / EMAIL_PASS and APP_URL in the backend .env.
              <span className="mt-2 block text-gray-600">
                Access is enforced by <strong>role in this app</strong> (MongoDB), not Clerk
                Organizations—invite the person&apos;s real work email and have them{" "}
                <strong>sign in</strong> after the invite so they join your existing workspace.
              </span>
            </p>

            <input
              placeholder="Name"
              className="w-full border p-2 rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Email"
              className="w-full border p-2 rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <select
              className="w-full border p-2 rounded"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {INVITE_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={createUser}
                className="bg-black text-white px-4 py-2 rounded"
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

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="min-w-[7.5rem] flex-1 bg-white border rounded-xl p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <h2 className="text-xl font-semibold">{value}</h2>
    </div>
  );
}
