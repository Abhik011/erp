export type ChatWallpaperId =
  | "default"
  | "dots"
  | "grid"
  | "warm"
  | "cool"
  | "mint"
  | "slate";

export const CHAT_WALLPAPER_IDS: ChatWallpaperId[] = [
  "default",
  "dots",
  "grid",
  "warm",
  "cool",
  "mint",
  "slate",
];

export const CHAT_WALLPAPER_LABELS: Record<ChatWallpaperId, string> = {
  default: "Default",
  dots: "Dots",
  grid: "Grid",
  warm: "Warm",
  cool: "Cool",
  mint: "Mint",
  slate: "Slate",
};

import type { CSSProperties } from "react";

export function chatWallpaperStyle(id: ChatWallpaperId): CSSProperties {
  switch (id) {
    case "dots":
      return {
        backgroundColor: "#e8e4de",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.06) 1px, transparent 0)",
        backgroundSize: "18px 18px",
      };
    case "grid":
      return {
        backgroundColor: "#f3f1ed",
        backgroundImage:
          "linear-gradient(rgb(0 0 0 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(0 0 0 / 0.04) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      };
    case "warm":
      return {
        background: "linear-gradient(160deg, #fff7ed 0%, #fde8d8 45%, #f9f9f7 100%)",
      };
    case "cool":
      return {
        background: "linear-gradient(160deg, #eff6ff 0%, #dbeafe 50%, #f9fafb 100%)",
      };
    case "mint":
      return {
        background: "linear-gradient(160deg, #ecfdf5 0%, #d1fae5 50%, #f9fafb 100%)",
      };
    case "slate":
      return {
        background: "linear-gradient(160deg, #f1f5f9 0%, #e2e8f0 50%, #f8fafc 100%)",
      };
    default:
      return { backgroundColor: "#f9f9f7" };
  }
}
