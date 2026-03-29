"use client";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LeadsTable({ leads, refresh }: any) {

  const changeStatus = async (id: string, status: string) => {
    await fetch(`${API}/leads/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    refresh();
  };

  const convertLead = async (id: string) => {
    await fetch(`${API}/leads/${id}/convert`, {
      method: "POST"
    });
    refresh();
  };

  const statusColor = (status: string) => {
    if (status === "New") return "bg-blue-100 text-blue-700";
    if (status === "Contacted") return "bg-yellow-100 text-yellow-700";
    if (status === "Negotiation") return "bg-orange-100 text-orange-700";
    if (status === "Qualified") return "bg-purple-100 text-purple-700";
    if (status === "Converted") return "bg-green-100 text-green-700";
    if (status === "Lost") return "bg-gray-200 text-gray-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      <table className="w-full text-sm">

        {/* HEADER */}
        <thead className="bg-[#f9f9f7] text-black text-xs">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Lead</th>
            <th className="text-left px-4 font-medium">Company</th>
            <th className="text-left px-4 font-medium">Contact</th>
            <th className="text-left px-4 font-medium">Source</th>
            <th className="text-left px-4 font-medium">Status</th>
            <th className="text-left px-4 font-medium">Actions</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>

          {leads.map((lead: any) => (
            <tr
              key={lead._id}
              className={`border-t transition hover:bg-gray-50`}
            >

              {/* LEAD */}
              <td className="px-4 py-3 flex items-center gap-3">

                <div className="w-9 h-9 bg-gray-100 text-gray-700 flex items-center justify-center rounded-full text-sm font-semibold">
                  {lead.name?.charAt(0)}
                </div>

                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {lead.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lead.email}
                  </p>
                </div>

              </td>

              {/* COMPANY */}
              <td className="px-4 text-gray-700 text-sm">
                {lead.company || "-"}
              </td>

              {/* PHONE */}
              <td className="px-4 text-gray-500 text-sm">
                {lead.phone || "-"}
              </td>

              {/* SOURCE */}
              <td className="px-4">
                {lead.source ? (
                  <span className="text-gray-600 text-xs px-2 py-1 ">
                    {lead.source}
                  </span>
                ) : "-"}
              </td>

              {/* STATUS */}
              <td className="px-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor(
                    lead.status
                  )}`}
                >
                  {lead.status}
                </span>
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-3">

                <div className="flex items-center gap-2">

                  {/* STATUS SELECT */}
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      changeStatus(lead._id, e.target.value)
                    }
                    disabled={lead.status === "Converted"}
                    className="border border-gray-200 text-xs px-2 py-1 rounded-lg bg-white"
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Negotiation</option>
                    <option>Qualified</option>
                    <option>Lost</option>
                  </select>

                  {/* CONVERT BUTTON */}
                  {lead.status === "Qualified" && (
                    <button
                      onClick={() => convertLead(lead._id)}
                      className="bg-black text-white text-xs px-3 py-1 rounded-lg hover:opacity-90"
                    >
                      Convert
                    </button>
                  )}

                  {/* CONVERTED */}
                  {/* {lead.status === "Converted" && (
                    <span className="text-green-600 text-xs font-medium">
                     Converted
                    </span>
                  )} */}

                </div>

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}