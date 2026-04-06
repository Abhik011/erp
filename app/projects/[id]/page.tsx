"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";

const columns = ["Todo", "In Progress", "Done"];

export default function ProjectTasks({ params }: { params: { id: string } }) {
  const { ready, companyId } = useCompany();
  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  const fetchData = async () => {
    const res = await apiFetch(`/tasks/project/${params.id}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);

    const p = await apiFetch(`/projects/${params.id}/progress`);
    const pdata = await p.json();
    setProgress(pdata.progress ?? 0);
  };

  useEffect(() => {
    if (!ready || !companyId || !params.id) return;
    fetchData();
  }, [params.id, ready, companyId]);

  // 🔥 DRAG START
  const onDragStart = (e: any, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  // 🔥 DROP
  const onDrop = async (e: any, status: string) => {
    const id = e.dataTransfer.getData("taskId");

    await apiFetch(`/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchData();
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">Project Tasks</h1>

        {/* PROGRESS */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-black h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress}% completed
          </p>
        </div>
      </div>

      {/* KANBAN */}
      <div className="flex gap-4 overflow-x-auto">

        {columns.map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, col)}
            className="min-w-[260px] bg-gray-50 border rounded-xl p-3"
          >

            <h2 className="text-sm font-medium mb-3">{col}</h2>

            {tasks
              .filter((t) => t.status === col)
              .map((task) => (

                <div
                  key={task._id}
                  draggable
                  onDragStart={(e) => onDragStart(e, task._id)}
                  className="bg-white border p-3 rounded-lg mb-2 cursor-grab"
                >

                  <p className="text-sm font-medium">
                    {task.title}
                  </p>

                  <p className="text-xs text-gray-500">
                    {task.priority}
                  </p>

                  {/* ASSIGN */}
                  <input
                    value={task.assignedTo || ""}
                    onChange={async (e) => {
                      await apiFetch(`/tasks/${task._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          assignedTo: e.target.value,
                        }),
                      });
                      fetchData();
                    }}
                    placeholder="Assign"
                    className="mt-2 text-xs border px-2 py-1 rounded w-full"
                  />

                  {/* TIME TRACK */}
                  <button
                    onClick={async () => {
                      await apiFetch(`/tasks/${task._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          timeSpent: (task.timeSpent || 0) + 30,
                        }),
                      });
                      fetchData();
                    }}
                    className="mt-2 text-xs bg-gray-100 px-2 py-1 rounded"
                  >
                    +30 min
                  </button>

                  <p className="text-xs text-gray-400 mt-1">
                    ⏱ {task.timeSpent || 0} min
                  </p>

                </div>

              ))}

          </div>
        ))}

      </div>

    </div>
  );
}