"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ReviewQueue.module.css";
import { type Status, STATUS_LABELS, formatDate } from "@/lib/intakeHelpers";

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewQueue({ intakes }: { intakes: IntakeSummary[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");

  const counts = { PENDING: 0, IN_REVIEW: 0, APPROVED: 0, REJECTED: 0 } as Record<Status, number>;
  intakes.forEach((i) => counts[i.status]++);

  const filtered = intakes.filter((intake) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      intake.clientName.toLowerCase().includes(q) ||
      intake.clientEmail.toLowerCase().includes(q) ||
      intake.id.slice(0, 8).toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || intake.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Review Queue</h1>
        <p className={styles.pageSubtitle}>Manage and review client intake submissions</p>
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
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
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
              {filtered.map((intake) => (
                <tr key={intake.id}>
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
              ))}
              {filtered.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={7}>No intakes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
