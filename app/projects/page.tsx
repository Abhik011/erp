"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // FETCH PROJECTS
  useEffect(() => {
    fetch(`${API}/projects`)
      .then((res) => res.json())
      .then(async (data) => {
        // 🔥 attach progress
        const withProgress = await Promise.all(
          data.map(async (p: any) => {
            try {
              const res = await fetch(
                `${API}/projects/${p._id}/progress`
              );
              const prog = await res.json();
              return { ...p, progress: prog.progress };
            } catch {
              return { ...p, progress: 0 };
            }
          })
        );

        setProjects(withProgress);
        setFiltered(withProgress);
        setLoading(false);
      });
  }, []);

  // SEARCH
  useEffect(() => {
    const q = search.toLowerCase();

    const result = projects.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.customer?.companyName || "")
          .toLowerCase()
          .includes(q)
    );

    setFiltered(result);
  }, [search, projects]);

  if (loading)
    return <div className="p-6 text-gray-500">Loading projects...</div>;

  return (
    <div className=" mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-gray-500">
            {projects.length} total projects
          </p>
        </div>

      </div>

      {/* SEARCH */}
      <input
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
      />

      {/* CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No projects found
          </div>
        ) : (
          <div className="divide-y">

            {filtered.map((p) => (
              <div
                key={p._id}
                onClick={() => router.push(`/projects/${p._id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >

                <div className="flex justify-between items-center">

                  {/* LEFT */}
                  <div>

                    <p className="font-medium text-gray-900">
                      {p.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {p.customer?.companyName ||
                        p.customer?.name ||
                        "—"}
                    </p>

                  </div>

                  {/* RIGHT */}
                  <div className="text-right">

                    <p className="text-xs text-gray-500 mb-1">
                      {p.progress || 0}%
                    </p>

                    {/* PROGRESS BAR */}
                    <div className="w-32 bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-black h-2 rounded-full"
                        style={{ width: `${p.progress || 0}%` }}
                      />
                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
}