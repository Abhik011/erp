"use client";

import { useCompany } from "@/components/CompanyProvider";
import { apiUpload } from "@/lib/apiUpload";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { getToken } from "@clerk/nextjs";



function formatRole(role: string | undefined) {
    if (!role) return "—";
    return role.replace(/_/g, " ");
}

function formatDate(iso: string | undefined | null) {
    if (!iso) return "—";

    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function UserProfilePage() {
    const { workspaceUser, workspaceReady } = useCompany();

    const getInitials = (name?: string) => {
        if (!name) return "U";

        const parts = name.trim().split(" ");

        if (parts.length === 1) {
            return parts[0][0].toUpperCase();
        }

        return (
            parts[0][0] + parts[parts.length - 1][0]
        ).toUpperCase();
    };

    const user = workspaceUser;

    const [editProfile, setEditProfile] = useState(false);

    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || "",
        image: user?.image || "",
        file: null as File | null,
    });

    const handleProfileSave = async () => {
        try {
            const res = await apiFetch("/users/me/profile", {
                method: "PUT",
                body: JSON.stringify({
                    name: profile.name,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            setProfile((prev: any) => ({
                ...prev,
                name: data.user.name,
            }));

            setEditProfile(false);
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        if (!user) return;

        setProfile((prev: any) => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
            image:
                prev.image ||
                user.image ||
                "",
        }));
    }, [user]);
    if (!workspaceReady) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-sm text-gray-500">
                Loading profile...
            </div>
        );
    }
    return (
        <div className="min-h-screen  p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb] shadow-xl">
                    {/* Background Effects */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
                    </div>

                    <div className="relative px-8 py-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">

                            {/* Avatar */}
                            <div className="relative group w-28 h-28">

                                {profile.image ? (
                                    <img
                                        src={profile.image}
                                        alt="Profile"
                                        className="w-28 h-28 rounded-full object-cover border border-white/30 shadow-2xl"
                                        onError={(e) => {
                                            console.log("IMAGE ERROR");

                                            (e.target as HTMLImageElement).src =
                                                "https://ui-avatars.com/api/?name=" +
                                                encodeURIComponent(profile.name);
                                        }}
                                    />
                                ) : (
                                    <div className="w-28 h-28 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white text-3xl font-bold shadow-2xl uppercase">
                                        {getInitials(profile.name)}
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <label className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer flex items-center justify-center">

                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];

                                            if (!file) return;

                                            // only images
                                            if (!file.type.startsWith("image/")) {
                                                return alert("Only image files are allowed");
                                            }

                                            // max 5MB before compression
                                            if (file.size > 5 * 1024 * 1024) {
                                                return alert("Image too large");
                                            }

                                            try {
                                                // compress image
                                                const compressImage = (
                                                    file: File
                                                ) =>
                                                    new Promise<File>((resolve) => {
                                                        const img = new Image();
                                                        const reader = new FileReader();

                                                        reader.onload = (event) => {
                                                            img.src = event.target?.result as string;
                                                        };

                                                        img.onload = () => {
                                                            const canvas = document.createElement("canvas");

                                                            const MAX_WIDTH = 600;
                                                            const scale = MAX_WIDTH / img.width;

                                                            canvas.width = MAX_WIDTH;
                                                            canvas.height = img.height * scale;

                                                            const ctx = canvas.getContext("2d");

                                                            ctx?.drawImage(
                                                                img,
                                                                0,
                                                                0,
                                                                canvas.width,
                                                                canvas.height
                                                            );

                                                            canvas.toBlob(
                                                                (blob) => {
                                                                    if (!blob) return resolve(file);

                                                                    const compressed = new File(
                                                                        [blob],
                                                                        file.name.replace(/\.[^/.]+$/, ".jpg"),
                                                                        {
                                                                            type: "image/jpeg",
                                                                        }
                                                                    );

                                                                    resolve(compressed);
                                                                },
                                                                "image/jpeg",
                                                                0.7
                                                            );
                                                        };

                                                        reader.readAsDataURL(file);
                                                    });

                                                const compressedFile = await compressImage(file);

                                                // preview
                                                const imageUrl = URL.createObjectURL(compressedFile);

                                                setProfile((prev: any) => ({
                                                    ...prev,
                                                    image: imageUrl,
                                                }));

                                                // upload
                                                const formData = new FormData();

                                                formData.append("file", compressedFile);
                                                formData.append("name", profile.name);

                                                const res = await apiUpload(
                                                    "/users/me/profile",
                                                    formData,
                                                    {
                                                        method: "PUT",
                                                    }
                                                );

                                                const data = await res.json();

                                                if (!res.ok) {
                                                    throw new Error(data.message);
                                                }

                                                setProfile((prev: any) => ({
                                                    ...prev,
                                                    image: data.user.image,
                                                }));
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                    />

                                    {/* Camera Icon */}
                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 text-gray-700"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 7h4l2-2h6l2 2h4v12H3V7zm9 10a4 4 0 100-8 4 4 0 000 8z"
                                            />
                                        </svg>
                                    </div>
                                </label>

                                {/* Status */}
                                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                    {user?.name || "User"}
                                </h1>

                                <p className="text-white/90 mt-2 text-base uppercase tracking-wide font-medium">
                                    {formatRole(user?.role)}
                                </p>

                                <div className="flex flex-wrap gap-3 mt-5">
                                    <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-white text-sm font-medium">
                                        {user?.companyName || "Workspace"}
                                    </span>

                                    <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20  text-white text-sm">
                                        Active Member
                                    </span>
                                </div>
                            </div>

                            {/* Right Side Mini Card */}
                            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-4 min-w-[180px]">
                                <p className="text-white/70 text-xs uppercase tracking-wider">
                                    Workspace Role
                                </p>

                                <h3 className="text-white text-lg font-bold mt-1 uppercase ">
                                    {formatRole(user?.role)}
                                </h3>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                    <span className="text-white/80 text-sm ">
                                        Online
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Profile Card */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Profile Information
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Manage your personal account details.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditProfile(!editProfile)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#5b4bdb]  text-white text-sm font-medium hover:opacity-90 transition"
                            >
                                {editProfile ? "Cancel" : "Edit Profile"}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                        Full Name
                                    </label>

                                    {editProfile ? (
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) =>
                                                setProfile((prev: any) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-[#5B5FC7]/20"
                                        />
                                    ) : (
                                        <div className="h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center text-sm text-gray-900">
                                            {user?.name || "—"}
                                        </div>
                                    )}
                                </div>
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                        Email Address
                                    </label>

                                    <div className="h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center text-sm text-gray-900">
                                        {user?.email || "—"}
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                        Role
                                    </label>

                                    <div className="h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center text-sm uppercase font-medium text-gray-900">
                                        {formatRole(user?.role)}
                                    </div>
                                </div>

                                {/* Workspace */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                        Workspace
                                    </label>

                                    <div className="h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center text-sm text-gray-900">
                                        {user?.companyName || "—"}
                                    </div>
                                </div>

                                {/* Joined */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                        Joined
                                    </label>

                                    <div className="h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center text-sm text-gray-900">
                                        {formatDate(user?.createdAt)}
                                    </div>
                                </div>

                            </div>

                            {/* Save Button */}
                            {editProfile && (
                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleProfileSave}
                                        className="h-11 px-6 rounded-xl bg-[#5B5FC7] text-white text-sm font-medium hover:opacity-90 transition"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Card */}
                    <div className="space-y-6">

                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                Account Overview
                            </h3>

                            <div className="space-y-4">

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Status
                                    </span>

                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                        Active
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Workspace
                                    </span>

                                    <span className="text-sm font-medium text-gray-900">
                                        {user?.companyName || "—"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Role
                                    </span>

                                    <span className="text-sm font-medium uppercase text-gray-900">
                                        {formatRole(user?.role)}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileField({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {label}
            </span>

            <div
                className={`text-sm text-gray-900 break-all ${mono ? "font-mono text-xs" : ""
                    }`}
            >
                {value}
            </div>
        </div>
    );
}

function StatusCard({
    title,
    value,
}: {
    title: string;
    value: string;
}) {
    return (
        <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{title}</p>

            <p className="text-sm font-semibold text-gray-900">
                {value}
            </p>
        </div>
    );
}