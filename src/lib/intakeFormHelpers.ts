// ─── Types ────────────────────────────────────────────────────────────────────

export type FormFields = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  dateOfBirth: string;
  ssn: string;
  description: string;
  notes: string;
};

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SSN_RE = /^\d{3}-\d{2}-\d{4}$/;

export function validateField(field: keyof FormFields, value: string): string {
  switch (field) {
    case "clientName":
      return value.trim() ? "" : "Full name is required.";
    case "clientEmail":
      if (!value.trim()) return "Email address is required.";
      if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
      return "";
    case "clientPhone": {
      const digits = value.replace(/\D/g, "");
      if (!digits) return "Phone number is required.";
      if (digits.length !== 10) return "Enter a valid 10-digit US phone number.";
      return "";
    }
    case "ssn":
      if (!value.trim()) return "Social Security Number is required.";
      if (!SSN_RE.test(value)) return "SSN must be in the format XXX-XX-XXXX.";
      return "";
    case "dateOfBirth":
      return value ? "" : "Date of birth is required.";
    case "description":
      return value.trim() ? "" : "Enrollment reason is required.";
    default:
      return "";
  }
}

// ─── Auto-formatters ──────────────────────────────────────────────────────────

export function formatSSN(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
