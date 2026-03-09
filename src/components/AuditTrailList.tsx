"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./AuditTrailList.module.css";
import { formatDate, formatAuditAction, type DateRange, DATE_OPTIONS, getDateBounds } from "@/lib/intakeHelpers";
import { type AuditEntry, ACTION_OPTIONS, exportToCSV } from "@/lib/auditTrailHelpers";

export type { AuditEntry };

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function AuditTrailList({ entries }: { entries: AuditEntry[] }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<DateRange>("ALL");
  const [page, setPage] = useState(1);

  const dateBounds = getDateBounds(dateFilter);

  const filtered = entries.filter((entry) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      entry.intake.clientName.toLowerCase().includes(q) ||
      entry.intake.id.slice(0, 8).toLowerCase().includes(q) ||
      entry.user.name.toLowerCase().includes(q);
    const matchesAction = actionFilter === "ALL" || entry.action === actionFilter;
    if (!matchesSearch || !matchesAction) return false;
    if (dateBounds) {
      const createdAt = new Date(entry.createdAt);
      if (createdAt < dateBounds.from) return false;
      if (dateBounds.to && createdAt >= dateBounds.to) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Audit Trail</h1>
          <p className={styles.pageSubtitle}>
            Full compliance log of all actions taken on intake applications
          </p>
        </div>
        <Link href="/queue" className={styles.backLink}>
          ← Review Queue
        </Link>
      </div>

      {/* Summary card */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.iconGray}`}>🗒</div>
          <div>
            <p className={styles.summaryLabel}>Total Events</p>
            <p className={styles.summaryCount}>{entries.length}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.tableTitle}>Activity Log</h2>
            <p className={styles.tableSubtitle}>
              {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className={styles.controls}>
            <div className={styles.searchWrapper}>
              <svg
                className={styles.searchIcon}
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
              >
                <circle cx="8.5" cy="8.5" r="5.75" stroke="#aaa" strokeWidth="1.75" />
                <path d="M13 13l4 4" stroke="#aaa" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by client, ID, or user..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className={styles.actionSelect}
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className={styles.actionSelect}
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value as DateRange); setPage(1); }}
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className={styles.controlsDivider} />
            <button
              className={styles.exportBtn}
              onClick={() => exportToCSV(filtered)}
              disabled={filtered.length === 0}
              title="Export filtered results as CSV"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Intake</th>
                <th>Client</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.dateCell}>{formatDate(entry.createdAt)}</td>
                  <td>
                    <span className={styles.actionBadge} data-action={entry.action}>
                      {formatAuditAction(entry.action, entry.details)}
                    </span>
                  </td>
                  <td className={styles.idCell}>
                    <Link
                      href={`/queue/${entry.intake.id}`}
                      className={styles.intakeLink}
                    >
                      #{entry.intake.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className={styles.nameCell}>{entry.intake.clientName}</td>
                  <td className={styles.userCell}>{entry.user.name}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>No audit log entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
