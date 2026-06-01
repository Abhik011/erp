"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  FileText,
  Flag,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type Props = {
  lead: any;
  close: () => void;
  refresh?: () => void;
};

export default function FollowUpModal({
  lead,
  close,
  refresh,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState({
      date: new Date()
        .toISOString()
        .slice(0, 16),

      type: "Call",

      note: "",

      priority:
        "Medium",
    });

  const save = async () => {
    try {
      setLoading(true);

      const followUp = {
        date: form.date,
        type: form.type,
        note: form.note,
        priority:
          form.priority,

        createdBy:
          lead.owner?._id ||
          lead.owner,
      };

      const res =
        await apiFetch(
          `/leads/${lead._id}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                followUps: [
                  ...(
                    lead.followUps ||
                    []
                  ),
                  followUp,
                ],

                nextFollowUp:
                  form.date,
              }),
          }
        );

      if (!res.ok) {
        throw new Error(
          "Failed"
        );
      }

      refresh?.();

      close();

    } catch (err) {
      console.log(err);
      alert(
        "Failed to save follow up"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold">
              Add Follow Up
            </h2>

            <p className="text-sm text-gray-500">
              {lead.fullName}
            </p>
          </div>

          <button
            onClick={close}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={18}/>
          </button>

        </div>

        {/* DATE */}

        <div className="mb-4">

          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Calendar size={15}/>
            Date & Time
          </label>

          <input
            type="datetime-local"
            value={form.date}
            onChange={(e)=>
              setForm({
                ...form,
                date:
                  e.target.value,
              })
            }
            className="w-full rounded-xl border px-4 py-3"
          />

        </div>

        {/* TYPE */}

        <div className="mb-4">

          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Clock size={15}/>
            Type
          </label>

          <select
            value={form.type}
            onChange={(e)=>
              setForm({
                ...form,
                type:
                  e.target.value,
              })
            }
            className="w-full rounded-xl border px-4 py-3"
          >

            <option>
              Call
            </option>

            <option>
              Email
            </option>

            <option>
              Meeting
            </option>

            <option>
              WhatsApp
            </option>

            <option>
              Demo
            </option>

          </select>

        </div>

        {/* PRIORITY */}

        <div className="mb-4">

          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Flag size={15}/>
            Priority
          </label>

          <select
            value={
              form.priority
            }
            onChange={(e)=>
              setForm({
                ...form,
                priority:
                  e.target.value,
              })
            }
            className="w-full rounded-xl border px-4 py-3"
          >

            <option>
              Low
            </option>

            <option>
              Medium
            </option>

            <option>
              High
            </option>

          </select>

        </div>

        {/* NOTE */}

        <div className="mb-6">

          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText size={15}/>
            Note
          </label>

          <textarea
            rows={4}
            value={form.note}
            onChange={(e)=>
              setForm({
                ...form,
                note:
                  e.target.value,
              })
            }
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Add notes..."
          />

        </div>

        {/* BUTTONS */}

        <div className="flex justify-end gap-3">

          <button
            onClick={close}
            className="rounded-xl border px-5 py-2"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={save}
            className="rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] px-5 py-2 text-white"
          >
            {loading
              ? "Saving..."
              : "Save Follow Up"}
          </button>

        </div>

      </div>

    </div>
  );
}