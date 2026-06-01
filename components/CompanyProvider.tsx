"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  apiFetch,
  clearCompanyId,
  getCompanyId,
  setCompanyId as persistCompanyId,
} from "@/lib/api";

export type CompanyTenureDto = {
  days: number;
  hour: number;
  label: string;
  shortLabel: string;
};

export type WorkspaceUser = {
  id: string;
  role: string;
  name?: string;
  email?: string;
  image?: string;
  companyId?: string;
  companyName?: string | null;
  clerkId?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  presenceStatus?: "free" | "busy" | "working";
  chatWallpaper?: string;
  companyTenure?: CompanyTenureDto | null;
  /** false = owner must finish workspace setup wizard */
  workspaceOnboardingCompleted?: boolean;
  agencyLogo?: string;
  planKey?: string;
  /** From /users/me; false means redirect to onboarding for non–super_admin. */
  onboardingCompleted?: boolean;
} | null;

type CompanyCtx = {
  companies: { _id: string; name?: string }[];
  companyId: string | null;
  ready: boolean;
  workspaceUser: WorkspaceUser;
  workspaceReady: boolean;
  selectCompany: (id: string) => void;
  refreshCompanies: () => Promise<void>;
  clearWorkspace: () => void;
};

const CompanyContext = createContext<CompanyCtx>({
  companies: [],
  companyId: null,
  ready: false,
  workspaceUser: null,
  workspaceReady: false,
  selectCompany: () => {},
  refreshCompanies: async () => {},
  clearWorkspace: () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<{ _id: string; name?: string }[]>(
    []
  );
  const [companyId, setCompanyIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [workspaceUser, setWorkspaceUser] = useState<WorkspaceUser>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);

  const clearWorkspace = useCallback(() => {
    clearCompanyId();
    setCompanies([]);
    setCompanyIdState(null);
    setWorkspaceUser(null);
    setWorkspaceReady(false);
    setReady(true);
  }, []);

  const refreshCompanies = useCallback(async () => {
    setWorkspaceReady(false);
    const res = await apiFetch("/agencies");
    if (res.status === 401) {
      setCompanies([]);
      setCompanyIdState(null);
      setWorkspaceUser(null);
      setReady(true);
      setWorkspaceReady(true);
      return;
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      setCompanies([]);
      setReady(true);
      setWorkspaceUser(null);
      setWorkspaceReady(true);
      return;
    }
    setCompanies(data);

    let id = getCompanyId();
    if (!id && data[0]?._id) {
      id = String(data[0]._id);
      persistCompanyId(id);
    } else if (id && !data.some((a: { _id: string }) => a._id === id)) {
      id = data[0]?._id != null ? String(data[0]._id) : null;
      if (id) persistCompanyId(id);
    }
    setCompanyIdState(id);
    setReady(true);

    const meRes = await apiFetch("/users/me");
    if (meRes.ok) {
      const me = await meRes.json();
      setWorkspaceUser({
        id: me.id,
        role: me.role,
        name: me.name,
        email: me.email,
        image: me.image,
        companyId: me.companyId ? String(me.companyId) : undefined,
        companyName: me.companyName ?? undefined,
        clerkId: me.clerkId,
        createdAt: me.createdAt ?? undefined,
        updatedAt: me.updatedAt ?? undefined,
        presenceStatus: me.presenceStatus || "free",
        chatWallpaper: me.chatWallpaper || "default",
        companyTenure: me.companyTenure ?? undefined,
        workspaceOnboardingCompleted: me.workspaceOnboardingCompleted !== false,
        agencyLogo: me.agencyLogo || "",
        planKey: me.planKey || "free",
        onboardingCompleted:
          typeof me.onboardingCompleted === "boolean"
            ? me.onboardingCompleted
            : true,
      });
      if (me.companyId) {
        const serverCid = String(me.companyId);
        persistCompanyId(serverCid);
        setCompanyIdState(serverCid);
      }
    } else {
      setWorkspaceUser(null);
    }
    setWorkspaceReady(true);
  }, []);

  useEffect(() => {
    refreshCompanies();
  }, [refreshCompanies]);

  useEffect(() => {
    const sync = () => setCompanyIdState(getCompanyId());
    window.addEventListener("company-changed", sync);
    return () => window.removeEventListener("company-changed", sync);
  }, []);

  useEffect(() => {
    const onCleared = () => clearWorkspace();
    window.addEventListener("workspace-cleared", onCleared);
    return () => window.removeEventListener("workspace-cleared", onCleared);
  }, [clearWorkspace]);

  const selectCompany = (id: string) => {
    persistCompanyId(id);
    setCompanyIdState(id);
    window.dispatchEvent(new Event("company-changed"));
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        companyId,
        ready,
        workspaceUser,
        workspaceReady,
        selectCompany,
        refreshCompanies,
        clearWorkspace,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}

export function canManageUsers(role: string | undefined) {
  return role === "super_admin" || role === "admin";
}

export function isSuperAdmin(role: string | undefined) {
  return role === "super_admin";
}
