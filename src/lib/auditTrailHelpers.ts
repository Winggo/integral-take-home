import { formatAuditAction } from "@/lib/intakeHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditEntry = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string };
  intake: { id: string; clientName: string };
};

// ─── Action filter options ────────────────────────────────────────────────────

export const ACTION_OPTIONS = [
  { value: "ALL",            label: "All Actions" },
  { value: "CREATED",        label: "Intake Submitted" },
  { value: "STATUS_CHANGED", label: "Status Changed" },
  { value: "VIEWED",         label: "Viewed" },
] as const;

// ─── CSV export ───────────────────────────────────────────────────────────────

function escapeCSV(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function exportToCSV(entries: AuditEntry[]): void {
  const headers = ["Event ID", "Timestamp", "Action", "Intake ID", "Client Name", "Performed By"];
  const rows = entries.map((e) => [
    e.id.slice(0, 8).toUpperCase(),
    e.createdAt,
    formatAuditAction(e.action, e.details),
    e.intake.id.slice(0, 8).toUpperCase(),
    e.intake.clientName,
    e.user.name,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  // UTF-8 BOM so Excel opens it correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
