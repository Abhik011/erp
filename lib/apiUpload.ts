// utils/apiUpload.ts

"use client";

import { getToken } from "@clerk/nextjs";
import { API_BASE } from "./api";

export const apiUpload = async (
  url: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const token = await getToken();

    const res = await fetch(`${API_BASE}${url}`, {
      ...options,

      method: options.method || "POST",

      headers: {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      // 🔥 IMPORTANT
      // never JSON.stringify FormData
      body: formData,
    });

    return res;
  } catch (err) {
    console.error("API Upload Error:", err);
    throw err;
  }
};