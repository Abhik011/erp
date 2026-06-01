"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import {
    UploadCloud,
    ShieldCheck,
    Sparkles,
    FileSpreadsheet,
    FileText,
    X,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

export default function LeadImportModal({
    open,
    close,
}: any) {

    const [file, setFile] =
        useState<any>(null);

    const [dragging, setDragging] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [result, setResult] =
        useState<any>(null);
    const handleFile = (
        selected: any
    ) => {

        if (!selected) return;

        setFile(selected);

        setResult(null);

    };
    const handleImport =
        async () => {

            if (!file) return;

            try {

                setLoading(true);

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file
                );

                const res =
                    await apiFetch(
                        "/import-leads/import",
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                const data =
                    await res.json();

                setResult(data);

            } catch (err) {

                console.error(err);

            } finally {

                setLoading(false);

            }
        };

    return (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 px-4 md:px-0" >
            <div className="
  bg-white
  w-full
  max-w-5xl
  rounded-[28px]
  shadow-2xl
  overflow-hidden
  border border-gray-200
  max-h-[92vh]
  flex flex-col
">

                {/* HEADER */}

                <div className="px-7 py-6 border-b bg-gradient-to-r from-violet-50 via-white to-white flex items-start justify-between">

                    <div>

                        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">

                            <Sparkles size={14} />

                            Smart CRM Import

                        </div>

                        <h2 className="text-2xl font-semibold text-gray-900">

                            Import Leads

                        </h2>

                        <p className="text-sm text-gray-500 mt-1">

                            Upload Excel or CSV files and automatically detect mapped CRM fields.

                        </p>

                    </div>

                    <button
                        onClick={close}
                        className="h-10 w-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"
                    >

                        <X size={18} />

                    </button>

                </div>

                {/* BODY */}

                <div className="
  p-7
  space-y-7
  overflow-y-auto
  flex-1
">

                    {/* UPLOAD */}

                    <label
                        onDragEnter={() =>
                            setDragging(true)
                        }
                        onDragLeave={() =>
                            setDragging(false)
                        }
                        onDrop={() =>
                            setDragging(false)
                        }
                        className={`relative border-2 border-dashed rounded-[28px] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${dragging
                            ? "border-violet-500 bg-violet-50"
                            : "border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/50"
                            }`}
                    >

                        <div className="h-20 w-20 rounded-3xl bg-violet-100 flex items-center justify-center mb-5 shadow-sm">

                            <UploadCloud
                                size={34}
                                className="text-violet-600"
                            />

                        </div>

                        <h3 className="text-xl font-semibold text-gray-900">

                            Drag & Drop Files

                        </h3>

                        <p className="text-sm text-gray-500 mt-2 max-w-lg leading-relaxed">

                            Upload Excel (.xlsx, .xls) or CSV files.
                            Only supported CRM fields will be imported automatically.

                        </p>

                        <div className="mt-6 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-2xl text-sm font-medium transition-all shadow-sm">

                            <FileSpreadsheet size={16} />

                            Choose Import File

                        </div>

                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) =>
                                handleFile(
                                    e.target.files?.[0]
                                )
                            }
                        />

                    </label>

                    {/* FILE PREVIEW */}

                    {file && (

                        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 flex items-center justify-between">

                            <div className="flex items-center gap-4">

                                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center border">

                                    <FileText
                                        size={22}
                                        className="text-violet-600"
                                    />

                                </div>

                                <div>

                                    <h4 className="text-sm font-semibold text-gray-800">

                                        {file.name}

                                    </h4>

                                    <p className="text-xs text-gray-500 mt-1">

                                        {(file.size / 1024).toFixed(1)} KB

                                    </p>

                                </div>

                            </div>

                            <CheckCircle2
                                size={20}
                                className="text-green-600"
                            />

                        </div>

                    )}
                    {/* IMPORT SUMMARY */}

                    {result && (

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="rounded-3xl border border-green-200 bg-green-50 p-5">

                                <div className="text-3xl font-bold text-green-700">

                                    {result.imported || 0}

                                </div>

                                <div className="text-sm text-green-700 mt-1">

                                    Leads Imported

                                </div>

                            </div>

                            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5">

                                <div className="text-3xl font-bold text-yellow-700">

                                    {result.duplicateCount || 0}

                                </div>

                                <div className="text-sm text-yellow-700 mt-1">

                                    Duplicates Skipped

                                </div>

                            </div>

                            <div className="rounded-3xl border border-red-200 bg-red-50 p-5">

                                <div className="text-3xl font-bold text-red-700">

                                    {result.invalidCount || 0}

                                </div>

                                <div className="text-sm text-red-700 mt-1">

                                    Invalid Rows

                                </div>

                            </div>

                        </div>

                    )}
                    {/* FEATURE CARDS */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                        <div className="rounded-3xl border bg-gradient-to-b from-white to-gray-50 p-5">

                            <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">

                                <Sparkles
                                    size={20}
                                    className="text-violet-600"
                                />

                            </div>

                            <h4 className="font-semibold text-gray-900">

                                Smart Detection

                            </h4>

                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">

                                Automatically maps Name, Company, Email, Phone & LinkedIn columns.

                            </p>

                        </div>

                        <div className="rounded-3xl border bg-gradient-to-b from-white to-gray-50 p-5">

                            <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4">

                                <ShieldCheck
                                    size={20}
                                    className="text-green-600"
                                />

                            </div>

                            <h4 className="font-semibold text-gray-900">

                                Duplicate Protection

                            </h4>

                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">

                                Detect duplicate email, phone & LinkedIn profiles automatically.

                            </p>

                        </div>

                        <div className="rounded-3xl border bg-gradient-to-b from-white to-gray-50 p-5">

                            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">

                                <FileSpreadsheet
                                    size={20}
                                    className="text-amber-600"
                                />

                            </div>

                            <h4 className="font-semibold text-gray-900">

                                Auto Lead Scoring

                            </h4>

                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">

                                Imported leads get automatic lead score & CRM enrichment.

                            </p>

                        </div>

                    </div>

                    {/* FIELDS */}

                    <div className="rounded-3xl border overflow-hidden">

                        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">

                            <h4 className="font-semibold text-gray-900 text-sm">

                                Supported Import Fields

                            </h4>

                            <span className="text-xs text-gray-500">

                                Auto mapped during import

                            </span>

                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">

                            {[
                                "Full Name",
                                "Email",
                                "Phone",
                                "Company",
                                "Designation",
                                "Industry",
                                "LinkedIn",
                                "Tags",
                            ].map((field) => (

                                <div
                                    key={field}
                                    className="bg-gray-50 border rounded-2xl px-4 py-3 text-sm font-medium text-gray-700"
                                >

                                    {field}

                                </div>

                            ))}

                        </div>

                    </div>

                    {/* RULES */}

                    <div className="rounded-3xl bg-amber-50 border border-amber-200 p-5">

                        <div className="flex items-start gap-3">

                            <AlertTriangle
                                size={18}
                                className="text-amber-600 mt-0.5"
                            />

                            <div>

                                <h4 className="font-semibold text-amber-900 text-sm">

                                    Import Rules

                                </h4>

                                <ul className="space-y-1.5 text-sm text-amber-800 mt-3">

                                    <li>
                                        • Maximum file size: 10MB
                                    </li>

                                    <li>
                                        • Duplicate leads are skipped automatically
                                    </li>

                                    <li>
                                        • Only supported CRM fields are imported
                                    </li>

                                    <li>
                                        • Invalid rows are ignored during import
                                    </li>

                                </ul>

                            </div>

                        </div>

                    </div>

                </div>

                {/* FOOTER */}

                <div className="px-7 py-5 border-t bg-gray-50 flex items-center justify-between">

                    <div className="text-sm text-gray-500">

                        Supports Excel (.xlsx, .xls) & CSV imports

                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={close}
                            className="px-5 py-2.5 rounded-2xl border border-gray-300 text-sm font-medium hover:bg-white transition-all"
                        >

                            Cancel

                        </button>

                        <button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="
    bg-violet-600
    hover:bg-violet-700
    disabled:opacity-50
    disabled:cursor-not-allowed
    text-white
    px-6
    py-2.5
    rounded-2xl
    text-sm
    font-semibold
    shadow-sm
    transition-all
  "
                        >

                            {loading
                                ? "Importing..."
                                : "Import Leads"}

                        </button>


                    </div>

                </div>

            </div>

        </div>
    );
}