"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./IntakeDetail.module.css";
import { redactSSN, redactPhone, REDACTED_DOB } from "@/lib/redact";
import { formatBytes } from "@/lib/intakeFormHelpers";
import {
  type Status,
  type PreviewKind,
  STATUS_LABELS,
  formatDate,
  formatAuditAction,
  previewKind,
  docIcon,
} from "@/lib/intakeHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditLogEntry = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string };
};

type DocumentRecord = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  createdAt: string;
};

export type IntakeFull = {
  id: string;
  status: Status;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  dateOfBirth: string;
  ssn: string;
  description: string;
  notes: string | null;
  submittedBy: { id: string; name: string; email: string };
  reviewer: { id: string; name: string } | null;
  auditLogs: AuditLogEntry[];
  documents: DocumentRecord[];
};

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  doc,
  intakeId,
  onClose,
}: {
  doc: DocumentRecord;
  intakeId: string;
  onClose: () => void;
}) {
  const src = `/api/intakes/${intakeId}/documents/${doc.id}`;
  const downloadSrc = `${src}?download=1`;
  const kind = previewKind(doc.fileType);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalFileName}>{doc.fileName}</span>
          <div className={styles.modalActions}>
            <a
              href={downloadSrc}
              className={styles.downloadLink}
              title="Download"
            >
              ↓ Download
            </a>
            <button
              className={styles.modalClose}
              onClick={onClose}
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={doc.fileName} className={styles.previewImage} />
          )}
          {kind === "pdf" && (
            <iframe
              src={src}
              className={styles.previewPdf}
              title={doc.fileName}
            />
          )}
          {kind === "none" && (
            <div className={styles.previewFallback}>
              <span className={styles.previewFallbackIcon}>📄</span>
              <p>Preview not available for this file type.</p>
              <a href={downloadSrc} className={styles.downloadBtn}>
                ↓ Download {doc.fileName}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={styles.badge} data-status={status}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function InfoField({
  label,
  value,
  sensitive = false,
  mono = false,
}: {
  label: string;
  value: string;
  sensitive?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={styles.infoField}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd
        className={[styles.fieldValue, sensitive ? styles.redacted : "", mono ? styles.mono : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const ACTIONABLE_STATUSES: Status[] = ["PENDING", "IN_REVIEW"];

export default function IntakeDetail({ intake }: { intake: IntakeFull }) {
  const router = useRouter();
  const [privileged, setPrivileged] = useState(false);
  const [actionLoading, setActionLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [actionError, setActionError] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const canAct = ACTIONABLE_STATUSES.includes(intake.status);

  async function updateStatus(status: "APPROVED" | "REJECTED") {
    setActionError("");
    setActionLoading(status);
    const res = await fetch(`/api/intakes/${intake.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError((data as { error?: string }).error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  // Resolved display values (redacted vs. privileged)
  const phone = privileged ? intake.clientPhone : redactPhone(intake.clientPhone);
  const dob = privileged ? intake.dateOfBirth : REDACTED_DOB;
  const ssn = privileged ? intake.ssn : redactSSN(intake.ssn);

  return (
    <div className={styles.container}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <Link href="/queue" className={styles.backLink}>
          ← Back to Queue
        </Link>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{intake.clientName}</h1>
            <div className={styles.titleMeta}>
              <StatusBadge status={intake.status} />
              <span className={styles.metaSep}>·</span>
              <span className={styles.submittedAt}>Submitted {formatDate(intake.createdAt)}</span>
            </div>
          </div>

          {canAct && (
            <div className={styles.actionButtons}>
              {actionError && <span className={styles.actionError}>{actionError}</span>}
              <button
                className={styles.rejectBtn}
                onClick={() => updateStatus("REJECTED")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "REJECTED" ? "Rejecting…" : "Reject"}
              </button>
              <button
                className={styles.approveBtn}
                onClick={() => updateStatus("APPROVED")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "APPROVED" ? "Approving…" : "Approve"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Left column */}
        <div className={styles.mainCol}>
          {/* Patient information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Patient Information</h2>
              <div className={styles.toggle}>
                <button
                  className={`${styles.toggleBtn} ${!privileged ? styles.toggleActive : ""}`}
                  onClick={() => setPrivileged(false)}
                >
                  Redacted
                </button>
                <button
                  className={`${styles.toggleBtn} ${privileged ? styles.toggleActive : ""}`}
                  onClick={() => setPrivileged(true)}
                >
                  Privileged
                </button>
              </div>
            </div>
            <dl className={styles.infoGrid}>
              <InfoField label="Full Name" value={intake.clientName} />
              <InfoField label="Email" value={intake.clientEmail} />
              <InfoField label="Phone" value={phone} sensitive={!privileged} />
              <InfoField label="Date of Birth" value={dob} sensitive={!privileged} mono={privileged} />
              <InfoField label="SSN" value={ssn} sensitive={!privileged} mono />
            </dl>
          </div>

          {/* Enrollment details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Enrollment Details</h2>
            <div className={styles.detailBlock}>
              <p className={styles.fieldLabel}>Reason for Enrollment</p>
              <p className={styles.descriptionText}>{intake.description}</p>
            </div>
            {intake.notes && (
              <div className={styles.detailBlock}>
                <p className={styles.fieldLabel}>Additional Notes</p>
                <p className={styles.descriptionText}>{intake.notes}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          {intake.documents.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Supporting Documents</h2>
              <ul className={styles.docList}>
                {intake.documents.map((doc) => (
                  <li key={doc.id} className={styles.docItem}>
                    <div className={styles.docIcon}>{docIcon(doc.fileType)}</div>
                    <div className={styles.docInfo}>
                      <span className={styles.docName}>{doc.fileName}</span>
                      {doc.description && (
                        <span className={styles.docDesc}>{doc.description}</span>
                      )}
                    </div>
                    <span className={styles.docSize}>{formatBytes(doc.fileSize)}</span>
                    <button
                      className={styles.previewBtn}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      Preview
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className={styles.sideCol}>
          {/* Case info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Case Information</h2>
            <dl className={styles.caseInfo}>
              <div className={styles.caseRow}>
                <dt className={styles.fieldLabel}>Status</dt>
                <dd><StatusBadge status={intake.status} /></dd>
              </div>
              <div className={styles.caseRow}>
                <dt className={styles.fieldLabel}>Submitted By</dt>
                <dd className={styles.fieldValue}>{intake.submittedBy.name}</dd>
              </div>
              <div className={styles.caseRow}>
                <dt className={styles.fieldLabel}>Reviewer</dt>
                <dd className={styles.fieldValue}>{intake.reviewer?.name ?? "Unassigned"}</dd>
              </div>
              <div className={styles.caseRow}>
                <dt className={styles.fieldLabel}>Reference ID</dt>
                <dd className={`${styles.fieldValue} ${styles.mono}`}>
                  #{intake.id.slice(0, 8).toUpperCase()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Audit log */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Audit Log</h2>
            {intake.auditLogs.length === 0 ? (
              <p className={styles.emptyLog}>No activity yet.</p>
            ) : (
              <ul className={styles.timeline}>
                {intake.auditLogs.map((log) => (
                  <li key={log.id} className={styles.logEntry}>
                    <div className={styles.logDot} />
                    <div className={styles.logContent}>
                      <p className={styles.logAction}>
                        {formatAuditAction(log.action, log.details)}
                      </p>
                      <p className={styles.logMeta}>
                        {log.user.name} · {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          intakeId={intake.id}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
