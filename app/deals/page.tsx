"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

export default function DealsPage() {
  const router = useRouter();
  const { ready, companyId } = useCompany();

  const [deals, setDeals] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !companyId) return;

    apiFetch("/deals")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setDeals(list);
        setFiltered(list);
        setLoading(false);
      });
  }, [ready, companyId]);

  // SEARCH
  useEffect(() => {
    const q = search.toLowerCase();

    const result = deals.filter((d) =>
      (d.title || "").toLowerCase().includes(q) ||
      (d.customer?.companyName || "").toLowerCase().includes(q)
    );

    setFiltered(result);
  }, [search, deals]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN").format(n || 0);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deal?")) return;

    try {
      await apiFetch(`/deals/${id}`, {
        method: "DELETE",
      });

      setDeals((prev) => prev.filter((d) => d._id !== id));
    } catch {
      alert("Failed to delete");
    }
  };

  const statusStyle = (status: string) => {
    if (status === "Won") return "bg-green-100 text-green-700";
    if (status === "Lost") return "bg-red-100 text-red-600";
    return "bg-yellow-100 text-yellow-700";
  };

  if (loading)
    return <div className="p-6 text-gray-500">Loading deals...</div>;

  return (
    <div className=" mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deals
          </h1>
          <p className="text-sm text-gray-500">
            {deals.length} total deals
          </p>
        </div>

        <button
          onClick={() => router.push("/deals/new")}
          className="bg-[#f7e414] text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          + New Deal
        </button>

      </div>

      {/* SEARCH */}
      <input
        placeholder="Search deals..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
      />

      {/* CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No deals found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-[#fafafa] text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Deal</th>
                  <th className="text-left px-4">Customer</th>
                  <th className="text-left px-4">Value</th>
                  <th className="text-left px-4">Status</th>
                  <th className="text-left px-4">Date</th>
                  <th className="text-left px-4">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((deal) => (
                  <tr
                    key={deal._id}
                    onClick={() => router.push(`/deals/${deal._id}`)}
                    className="border-t hover:bg-gray-50 cursor-pointer transition"
                  >

                    {/* DEAL */}
                    <td className="px-4 py-3 font-medium text-gray-900 min-w-[180px]">
                      {deal.title}
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-4 text-gray-600 min-w-[180px]">
                      {deal.customer?.companyName || deal.customer?.name}
                    </td>

                    {/* VALUE */}
                    <td className="px-4 font-mono">
                      ₹{fmt(deal.value)}
                    </td>

                    {/* STATUS */}
                    <td className="px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle(
                          deal.status
                        )}`}
                      >
                        {deal.status || "In Progress"}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="px-4 text-gray-500 text-sm">
                      {new Date(deal.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    {/* ACTIONS */}
                    <td
                      className="px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            router.push(`/deals/${deal._id}`)
                          }
                          className="text-xs bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(deal._id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100"
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  );
}