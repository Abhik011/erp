"use client";

const stages = [
  "New",
  "Contacted",
  "Negotiation",
  "Qualified",
  "Converted"
];

const stageColor = (stage: string) => {
  if (stage === "New") return "bg-blue-100 text-blue-600";
  if (stage === "Contacted") return "bg-yellow-100 text-yellow-600";
  if (stage === "Negotiation") return "bg-orange-100 text-orange-600";
  if (stage === "Qualified") return "bg-purple-100 text-purple-600";
  if (stage === "Converted") return "bg-green-100 text-green-600";
  return "bg-gray-100 text-gray-600";
};

export default function LeadsPipeline({ leads }: any) {
  return (

    <div className="flex gap-4 overflow-x-auto pb-2">

      {stages.map((stage) => {

        const stageLeads = leads.filter(
          (lead: any) => lead.status === stage
        );

        return (
          <div
            key={stage}
            className="min-w-[260px] bg-[#fafafa] border border-gray-200 rounded-2xl p-3 flex flex-col"
          >

            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">

              <h2 className="text-sm font-medium text-gray-700">
                {stage}
              </h2>

              <span className="text-xs text-gray-500">
                {stageLeads.length}
              </span>

            </div>

            {/* LEADS */}
            <div className="space-y-2">

              {stageLeads.map((lead: any) => (

                <div
                  key={lead._id}
                  className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition"
                >

                  {/* NAME */}
                  <div className="flex items-center gap-2 mb-2">

                    <div className="w-7 h-7 bg-gray-100 text-gray-700 flex items-center justify-center rounded-full text-xs font-semibold">
                      {lead.name?.charAt(0)}
                    </div>

                    <p className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </p>

                  </div>

                  {/* COMPANY */}
                  <p className="text-xs text-gray-500 mb-1">
                    {lead.company || "-"}
                  </p>

                  {/* PHONE */}
                  <p className="text-xs text-gray-400">
                    {lead.phone || ""}
                  </p>

                  {/* STATUS BADGE */}
                  <div className="mt-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-medium ${stageColor(stage)}`}
                    >
                      {stage}
                    </span>
                  </div>

                </div>

              ))}

              {stageLeads.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-6">
                  No leads
                </div>
              )}

            </div>

          </div>
        );
      })}

    </div>

  );
}