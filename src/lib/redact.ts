/** Redact an SSN, leaving only the last 4 digits: ***-**-1234 */
export function redactSSN(ssn: string): string {
  const last4 = ssn.replace(/\D/g, "").slice(-4);
  return `***-**-${last4}`;
}

/** Redact a phone number, leaving only the last 4 digits: ***-***-1234 */
export function redactPhone(phone: string): string {
  const last4 = phone.replace(/\D/g, "").slice(-4);
  return `***-***-${last4}`;
}

/** Placeholder shown in place of a redacted date of birth */
export const REDACTED_DOB = "••••-••-••";
