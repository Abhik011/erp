"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

type Customer = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!API) {
      setError("API URL not configured");
      setLoading(false);
      return;
    }

    fetch(`${API}/customers`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch customers");
        return res.json();
      })
      .then((data) => setCustomers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className=" mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <h1 className="text-2xl font-semibold tracking-tight">
          Customers
        </h1>

        <button className="bg-[#f7e414] text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">
          + New Customer
        </button>

      </div>

      {/* CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* STATES */}

        {loading && (
          <div className="p-6 text-center text-gray-500">
            Loading customers...
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && customers.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No customers found
          </div>
        )}

        {/* TABLE */}

        {!loading && !error && customers.length > 0 && (
          <table className="w-full text-sm">

            <thead className="bg-[#fafafa] text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 font-medium">Email</th>
                <th className="text-left px-4 font-medium">Phone</th>
              </tr>
            </thead>

            <tbody>

              {customers.map((c) => (
                <tr
                  key={c._id}
                  className="border-t hover:bg-gray-50 transition"
                >

                  {/* CUSTOMER */}
                  <td className="px-4 py-3 flex items-center gap-3">

                    <div className="w-9 h-9 bg-gray-100 text-gray-700 flex items-center justify-center rounded-full text-sm font-semibold">
                      {c.name?.charAt(0) || "C"}
                    </div>

                    <div>
                      <Link
                        href={`/customers/${c._id}`}
                        className="text-gray-900 font-medium hover:underline"
                      >
                        {c.name || "Unnamed"}
                      </Link>

                      <p className="text-xs text-gray-400">
                        Customer ID: {c._id.slice(-5)}
                      </p>
                    </div>

                  </td>

                  {/* EMAIL */}
                  <td className="px-4 text-gray-600 text-sm">
                    {c.email || "-"}
                  </td>

                  {/* PHONE */}
                  <td className="px-4 text-gray-600 text-sm">
                    {c.phone || "-"}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}