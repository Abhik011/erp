/**
 * Company tenure from account creation (24h clock: hour 1–24, then day +1, hour resets to 1).
 */
export type CompanyTenure = {
  days: number;
  hour: number;
  label: string;
  shortLabel: string;
};

export function companyTenureFromCreatedAt(
  createdAt: string | Date | null | undefined,
  now: Date = new Date()
): CompanyTenure | null {
  if (!createdAt) return null;
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return null;

  const ms = Math.max(0, now.getTime() - start.getTime());
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hour = (totalHours % 24) + 1;

  const dayWord = days === 1 ? "day" : "days";
  const hrWord = hour === 1 ? "hr" : "hr";

  return {
    days,
    hour,
    label: `${days} ${dayWord} · ${hour} ${hrWord}`,
    shortLabel: `${days}d · ${hour}h`,
  };
}
