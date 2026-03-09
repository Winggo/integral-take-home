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
