"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";


export default function EditInvoicePage() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    apiFetch(`/invoices/${id}`)
      .then((res) => res.json())
      .then(setInvoice);
  }, [id]);

  if (!invoice) return <div className="p-6">Loading...</div>;

  return (
    <div>
      {/* reuse your create form UI here */}
      {/* same component */}
    </div>
  );
}