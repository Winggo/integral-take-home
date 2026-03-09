"use client";

import { useState } from "react";
import styles from "./IntakeForm.module.css";
import {
  type FormFields,
  validateField,
  formatSSN,
  formatPhone,
  formatBytes,
} from "@/lib/intakeFormHelpers";

interface Props {
  defaultName: string;
  defaultEmail: string;
}

interface SuccessState {
  intakeId: string;
}


const REQUIRED_FIELDS: Array<keyof FormFields> = [
  "clientName",
  "clientEmail",
  "clientPhone",
  "dateOfBirth",
  "ssn",
  "description",
];

export default function IntakeForm({ defaultName, defaultEmail }: Props) {
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState<FormFields>({
    clientName: defaultName,
    clientEmail: defaultEmail,
    clientPhone: "",
    dateOfBirth: "",
    ssn: "",
    description: "",
    notes: "",
  });

  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [files, setFiles] = useState<File[]>([]);

  // ── Helpers ──

  function setFieldValue(field: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Live-clear error once user starts correcting
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function handleBlur(field: keyof FormFields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
  }

  function inputClass(field: keyof FormFields) {
    return [
      styles.input,
      touched[field] && fieldErrors[field] ? styles.inputError : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function validateAll(): Partial<Record<keyof FormFields, string>> {
    const errors: Partial<Record<keyof FormFields, string>> = {};
    for (const field of REQUIRED_FIELDS) {
      const msg = validateField(field, form[field]);
      if (msg) errors[field] = msg;
    }
    setFieldErrors(errors);
    setTouched(Object.fromEntries(REQUIRED_FIELDS.map((f) => [f, true])));
    return errors;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = ""; // reset so re-selecting the same file works
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setSuccess(null);
    setSubmitError("");
    setFieldErrors({});
    setTouched({});
    setFiles([]);
    setForm({
      clientName: defaultName,
      clientEmail: defaultEmail,
      clientPhone: "",
      dateOfBirth: "",
      ssn: "",
      description: "",
      notes: "",
    });
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const errors = validateAll();
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const res = await fetch("/api/intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    const intake = await res.json();

    // Upload any selected documents (best-effort; intake is already saved)
    if (files.length > 0) {
      await Promise.allSettled(
        files.map((file) => {
          const fd = new FormData();
          fd.append("file", file);
          return fetch(`/api/intakes/${intake.id}/documents`, {
            method: "POST",
            body: fd,
          });
        })
      );
    }

    setSuccess({ intakeId: intake.id });
  }


  if (success) {
    return (
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Intake Submitted Successfully</h2>
        <p className={styles.successSubtitle}>
          Your intake has been received and is now pending review. You will be
          notified once a reviewer processes your submission.
        </p>
        <div className={styles.referenceBox}>
          <span className={styles.referenceLabel}>Reference Number</span>
          <span className={styles.referenceId}>
            {success.intakeId.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className={styles.successActions}>
          <button type="button" onClick={reset} className={styles.secondaryBtn}>
            Submit Another
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Submit New Intake</h2>
      <p className={styles.subtitle}>
        Please provide your personal information below. All fields marked with{" "}
        <span className={styles.required}>*</span> are required. Your
        information is encrypted and securely stored.
      </p>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Full Name */}
        <div className={styles.fieldFull}>
          <label className={styles.label} htmlFor="clientName">
            Full Name <span className={styles.required}>*</span>
          </label>
          <input
            id="clientName"
            type="text"
            className={inputClass("clientName")}
            placeholder="John Smith"
            value={form.clientName}
            onChange={(e) => setFieldValue("clientName", e.target.value)}
            onBlur={() => handleBlur("clientName")}
          />
          {touched.clientName && fieldErrors.clientName && (
            <span className={styles.fieldError}>{fieldErrors.clientName}</span>
          )}
        </div>

        {/* Email + Phone */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="clientEmail">
              Email Address <span className={styles.required}>*</span>
            </label>
            <input
              id="clientEmail"
              type="email"
              className={inputClass("clientEmail")}
              placeholder="john@example.com"
              value={form.clientEmail}
              onChange={(e) => setFieldValue("clientEmail", e.target.value)}
              onBlur={() => handleBlur("clientEmail")}
            />
            {touched.clientEmail && fieldErrors.clientEmail && (
              <span className={styles.fieldError}>{fieldErrors.clientEmail}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="clientPhone">
              Phone Number <span className={styles.required}>*</span>
            </label>
            <input
              id="clientPhone"
              type="tel"
              className={inputClass("clientPhone")}
              placeholder="(555) 123-4567"
              value={form.clientPhone}
              onChange={(e) => setFieldValue("clientPhone", formatPhone(e.target.value))}
              onBlur={() => handleBlur("clientPhone")}
            />
            {touched.clientPhone && fieldErrors.clientPhone && (
              <span className={styles.fieldError}>{fieldErrors.clientPhone}</span>
            )}
          </div>
        </div>

        {/* SSN + DOB */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ssn">
              Social Security Number <span className={styles.required}>*</span>
            </label>
            <input
              id="ssn"
              type="text"
              inputMode="numeric"
              className={inputClass("ssn")}
              placeholder="123-45-6789"
              value={form.ssn}
              onChange={(e) => setFieldValue("ssn", formatSSN(e.target.value))}
              onBlur={() => handleBlur("ssn")}
              maxLength={11}
            />
            {touched.ssn && fieldErrors.ssn ? (
              <span className={styles.fieldError}>{fieldErrors.ssn}</span>
            ) : (
              <span className={styles.hint}>Format: XXX-XX-XXXX</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dateOfBirth">
              Date of Birth <span className={styles.required}>*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className={inputClass("dateOfBirth")}
              value={form.dateOfBirth}
              onChange={(e) => setFieldValue("dateOfBirth", e.target.value)}
              onBlur={() => handleBlur("dateOfBirth")}
            />
            {touched.dateOfBirth && fieldErrors.dateOfBirth && (
              <span className={styles.fieldError}>{fieldErrors.dateOfBirth}</span>
            )}
          </div>
        </div>

        {/* Enrollment Reason */}
        <div className={styles.fieldFull}>
          <label className={styles.label} htmlFor="description">
            Enrollment Reason <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            className={[
              styles.textarea,
              touched.description && fieldErrors.description ? styles.inputError : "",
            ]
              .filter(Boolean)
              .join(" ")}
            placeholder="Please describe your reason for enrollment, relevant medical history, and any other information that may be relevant to your application..."
            value={form.description}
            onChange={(e) => setFieldValue("description", e.target.value)}
            onBlur={() => handleBlur("description")}
            rows={4}
          />
          {touched.description && fieldErrors.description && (
            <span className={styles.fieldError}>{fieldErrors.description}</span>
          )}
        </div>

        {/* Notes */}
        <div className={styles.fieldFull}>
          <label className={styles.label} htmlFor="notes">
            Additional Notes
          </label>
          <textarea
            id="notes"
            className={styles.textarea}
            placeholder="Any additional information you'd like to provide..."
            value={form.notes}
            onChange={(e) => setFieldValue("notes", e.target.value)}
            rows={3}
          />
        </div>

        {/* Supporting Documents */}
        <div className={styles.fieldFull}>
          <span className={styles.label}>Supporting Documents</span>
          <p className={styles.hint}>
            Upload medical records, insurance cards, or other relevant files (optional).
          </p>
          <label className={styles.fileLabel} htmlFor="fileInput">
            + Add files
          </label>
          <input
            id="fileInput"
            type="file"
            multiple
            className={styles.fileInput}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          {files.length > 0 && (
            <ul className={styles.fileList}>
              {files.map((file, i) => (
                <li key={i} className={styles.fileItem}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    className={styles.removeFile}
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.divider} />

        <p className={styles.consent}>
          By submitting this form, you consent to the collection and processing
          of your personal information in accordance with our privacy policy.
          Your data will be reviewed by authorized personnel only.
        </p>

        {submitError && <p className={styles.errorMsg}>{submitError}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={reset}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Submitting…" : "Submit Intake"}
          </button>
        </div>
      </form>
    </div>
  );
}
