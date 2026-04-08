"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import InvoiceRenderer from "@/components/invoice/InvoiceRenderer";

export default function InvoiceView() {
  const params = useParams();
  const id = params?.id as string;

  const { ready, companyId } = useCompany();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !ready || !companyId) return;

    const load = async () => {
      try {
        const res = await apiFetch(`/invoices/${id}`);
        const data = await res.json();
        setInvoice(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, ready, companyId]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading invoice...</div>;
  }

  if (!invoice) return null;

  return (
    <div className="bg-white min-h-screen">
      <div id="invoice-print">
        <InvoiceRenderer invoice={invoice} />
      </div>
    </div>
  );
}