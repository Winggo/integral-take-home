// ─── Types ────────────────────────────────────────────────────────────────────

export type Status = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

// ─── Status labels ────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pending",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export function formatAuditAction(action: string, details: string | null): string {
  if (action === "STATUS_CHANGED" && details) {
    try {
      const { from, to } = JSON.parse(details) as { from: string; to: string };
      return `Status: ${STATUS_LABELS[from as Status] ?? from} → ${STATUS_LABELS[to as Status] ?? to}`;
    } catch {
      /* fall through */
    }
  }
  if (action === "CREATED") return "Intake submitted";
  return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

// ─── Date range filter ────────────────────────────────────────────────────────

export type DateRange = "ALL" | "TODAY" | "YESTERDAY" | "LAST_7" | "LAST_30" | "LAST_365";

export const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "ALL",       label: "All Time" },
  { value: "TODAY",     label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "LAST_7",    label: "Last 7 Days" },
  { value: "LAST_30",   label: "Last Month" },
  { value: "LAST_365",  label: "Last Year" },
];

export function getDateBounds(range: DateRange): { from: Date; to?: Date } | null {
  if (range === "ALL") return null;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case "TODAY":     return { from: todayStart };
    case "YESTERDAY": {
      const from = new Date(todayStart);
      from.setDate(from.getDate() - 1);
      return { from, to: todayStart };
    }
    case "LAST_7":   { const from = new Date(now); from.setDate(from.getDate() - 7);         return { from }; }
    case "LAST_30":  { const from = new Date(now); from.setDate(from.getDate() - 30);        return { from }; }
    case "LAST_365": { const from = new Date(now); from.setFullYear(from.getFullYear() - 1); return { from }; }
  }
}

// ─── Document helpers ─────────────────────────────────────────────────────────

export type PreviewKind = "image" | "pdf" | "none";

export function previewKind(fileType: string): PreviewKind {
  if (fileType.startsWith("image/")) return "image";
  if (fileType === "application/pdf") return "pdf";
  return "none";
}

export function docIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType === "application/pdf") return "📋";
  return "📄";
}
