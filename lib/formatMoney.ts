/** Format whole currency units (e.g. INR) for agency contracts */
export function formatCurrency(
  amount: number | null | undefined,
  currency = "INR"
): string {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return String(amount);
  }
}

/** Compact label for crore-scale deals (1 Cr = 10,000,000 INR) */
export function formatCroreLabel(amount: number, currency = "INR"): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (currency !== "INR") return "";
  const cr = n / 1e7;
  if (cr >= 0.01) return `≈ ${cr.toFixed(2)} Cr`;
  const lakhs = n / 1e5;
  if (lakhs >= 0.1) return `≈ ${lakhs.toFixed(1)} L`;
  return "";
}

export function labelProjectStage(s: string | undefined): string {
  const map: Record<string, string> = {
    discovery: "Discovery",
    proposal: "Proposal",
    signed: "Signed",
    kickoff: "Kickoff",
    build: "Build",
    uat: "UAT",
    launch: "Launch",
    warranty: "Warranty",
    closed: "Closed",
  };
  return map[s || ""] || s || "—";
}

export function labelHealth(h: string | undefined): string {
  const map: Record<string, string> = {
    on_track: "On track",
    at_risk: "At risk",
    blocked: "Blocked",
    completed: "Completed",
  };
  return map[h || ""] || h || "—";
}

export function labelEngagement(e: string | undefined): string {
  const map: Record<string, string> = {
    fixed_price: "Fixed price",
    time_materials: "Time & materials",
    retainer: "Retainer",
    hybrid: "Hybrid",
  };
  return map[e || ""] || e || "—";
}

export function labelDelivery(d: string | undefined): string {
  const map: Record<string, string> = {
    dedicated_team: "Dedicated team",
    sprint_based: "Sprint-based",
    staff_augmentation: "Staff augmentation",
    fixed_scope: "Fixed scope",
  };
  return map[d || ""] || d || "—";
}
