"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch, getCompanyId, setCompanyId as persistCompanyId } from "@/lib/api";

type CompanyCtx = {
  companies: { _id: string; name?: string }[];
  companyId: string | null;
  ready: boolean;
  selectCompany: (id: string) => void;
  refreshCompanies: () => Promise<void>;
};

const CompanyContext = createContext<CompanyCtx>({
  companies: [],
  companyId: null,
  ready: false,
  selectCompany: () => {},
  refreshCompanies: async () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<{ _id: string; name?: string }[]>(
    []
  );
  const [companyId, setCompanyIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refreshCompanies = useCallback(async () => {
    const res = await apiFetch("/agencies");
    const data = await res.json();
    if (!Array.isArray(data)) {
      setCompanies([]);
      setReady(true);
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
  }, []);

  useEffect(() => {
    refreshCompanies();
  }, [refreshCompanies]);

  useEffect(() => {
    const sync = () => setCompanyIdState(getCompanyId());
    window.addEventListener("company-changed", sync);
    return () => window.removeEventListener("company-changed", sync);
  }, []);

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
        selectCompany,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
