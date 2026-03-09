"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./ReviewQueue.module.css";
import { type Status, STATUS_LABELS, formatDate, type DateRange, DATE_OPTIONS, getDateBounds } from "@/lib/intakeHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntakeSummary = {
  id: string;
  status: Status;
  clientName: string;
  clientEmail: string;
  createdAt: string;
  reviewer: { name: string } | null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={styles.badge} data-status={status}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const SUMMARY_CARDS: { status: Status; label: string; colorClass: string; icon: string }[] = [
  { status: "PENDING",   label: "Pending",   colorClass: styles.iconAmber, icon: "◷" },
  { status: "IN_REVIEW", label: "In Review", colorClass: styles.iconBlue,  icon: "◎" },
  { status: "APPROVED",  label: "Approved",  colorClass: styles.iconGreen, icon: "✓" },
  { status: "REJECTED",  label: "Rejected",  colorClass: styles.iconRed,   icon: "✕" },
];

const ACTIONABLE_STATUSES: Status[] = ["PENDING", "IN_REVIEW"];

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function ReviewQueue({ intakes }: { intakes: IntakeSummary[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<DateRange>("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const selectAllRef = useRef<HTMLInputElement>(null);

  const counts = { PENDING: 0, IN_REVIEW: 0, APPROVED: 0, REJECTED: 0 } as Record<Status, number>;
  intakes.forEach((i) => counts[i.status]++);

  const dateBounds = getDateBounds(dateFilter);

  const filtered = intakes.filter((intake) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      intake.clientName.toLowerCase().includes(q) ||
      intake.clientEmail.toLowerCase().includes(q) ||
      intake.id.slice(0, 8).toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || intake.status === statusFilter;
    if (!matchesSearch || !matchesStatus) return false;
    if (dateBounds) {
      const createdAt = new Date(intake.createdAt);
      if (createdAt < dateBounds.from) return false;
      if (dateBounds.to && createdAt >= dateBounds.to) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Selectable = actionable status (across all filtered, not just current page)
  const selectableFiltered = filtered.filter((i) => ACTIONABLE_STATUSES.includes(i.status));
  const allSelectableSelected =
    selectableFiltered.length > 0 && selectableFiltered.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0;
  const someButNotAll = someSelected && !allSelectableSelected;

  // Sync indeterminate state on the select-all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someButNotAll;
    }
  }, [someButNotAll]);

  // Clear selection when filters change
  useEffect(() => {
    setSelected(new Set());
    setBulkError("");
  }, [search, statusFilter, dateFilter]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelectableSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableFiltered.map((i) => i.id)));
    }
  }

  async function handleBulkAction(status: "APPROVED" | "REJECTED") {
    setBulkError("");
    setBulkLoading(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/intakes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    );
    setBulkLoading(false);
    const failed = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
    ).length;
    if (failed > 0) {
      setBulkError(`${failed} action${failed !== 1 ? "s" : ""} failed. Please try again.`);
    }
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Review Queue</h1>
          <p className={styles.pageSubtitle}>Manage and review client intake submissions</p>
        </div>
        <Link href="/queue/audit-trail" className={styles.auditLink}>
          Audit Trail →
        </Link>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        {SUMMARY_CARDS.map(({ status, label, colorClass, icon }) => (
          <div key={status} className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${colorClass}`}>{icon}</div>
            <div>
              <p className={styles.summaryLabel}>{label}</p>
              <p className={styles.summaryCount}>{counts[status]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.tableTitle}>Intake Submissions</h2>
            <p className={styles.tableSubtitle}>
              {filtered.length} intake{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className={styles.controls}>
            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.75" stroke="#aaa" strokeWidth="1.75"/>
                <path d="M13 13l4 4" stroke="#aaa" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as Status | "ALL"); setPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              className={styles.statusSelect}
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value as DateRange); setPage(1); }}
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>
              {selected.size} selected
            </span>
            {bulkError && <span className={styles.bulkError}>{bulkError}</span>}
            <div className={styles.bulkActions}>
              <button
                className={styles.bulkRejectBtn}
                onClick={() => handleBulkAction("REJECTED")}
                disabled={bulkLoading}
              >
                {bulkLoading ? "Processing…" : "Reject Selected"}
              </button>
              <button
                className={styles.bulkApproveBtn}
                onClick={() => handleBulkAction("APPROVED")}
                disabled={bulkLoading}
              >
                {bulkLoading ? "Processing…" : "Approve Selected"}
              </button>
              <button
                className={styles.bulkClearBtn}
                onClick={() => setSelected(new Set())}
                disabled={bulkLoading}
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={toggleAll}
                    disabled={selectableFiltered.length === 0}
                    aria-label="Select all actionable intakes"
                  />
                </th>
                <th>ID</th>
                <th>Client Name</th>
                <th>Email</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Reviewer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((intake) => {
                const isSelectable = ACTIONABLE_STATUSES.includes(intake.status);
                const isChecked = selected.has(intake.id);
                return (
                  <tr key={intake.id} className={isChecked ? styles.rowSelected : undefined}>
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(intake.id)}
                        disabled={!isSelectable}
                        aria-label={`Select ${intake.clientName}`}
                      />
                    </td>
                    <td className={styles.idCell}>#{intake.id.slice(0, 8).toUpperCase()}</td>
                    <td className={styles.nameCell}>{intake.clientName}</td>
                    <td className={styles.emailCell}>{intake.clientEmail}</td>
                    <td className={styles.dateCell}>{formatDate(intake.createdAt)}</td>
                    <td><StatusBadge status={intake.status} /></td>
                    <td className={styles.reviewerCell}>{intake.reviewer?.name ?? "—"}</td>
                    <td>
                      <Link href={`/queue/${intake.id}`} className={styles.viewLink}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 4C5 4 1.73 8.11 1.2 9.6a.75.75 0 000 .8C1.73 11.89 5 16 10 16s8.27-4.11 8.8-5.6a.75.75 0 000-.8C18.27 8.11 15 4 10 4zm0 9a3 3 0 110-6 3 3 0 010 6z"/>
                        </svg>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={8}>No intakes found.</td>
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
