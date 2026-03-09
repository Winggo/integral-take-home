"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type RoleTab = "PATIENT" | "REVIEWER";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleTab>("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPatient = role === "PATIENT";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("credentials", { email, password, redirect: false });
    } catch {
      // Auth.js v5 may throw on credential failure in some configurations
    }

    // Auth.js v5 beta: check session state to determine success/failure
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    setLoading(false);

    if (!session?.user) {
      setError("Invalid email or password.");
      return;
    }

    const userRole = session.user.role;
    if (userRole === "REVIEWER") {
      router.push("/queue");
    } else {
      router.push("/intake");
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Intake Review System</h1>
          <p className={styles.subtitle}>Secure document intake and review platform</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Sign In</h2>
          <p className={styles.cardSubtitle}>Choose your role to continue</p>

          {/* Role toggle */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${isPatient ? styles.tabActive : ""}`}
              onClick={() => {
                setRole("PATIENT");
                setError("");
              }}
            >
              <span className={styles.tabIcon}>📋</span> Patient
            </button>
            <button
              type="button"
              className={`${styles.tab} ${!isPatient ? styles.tabActive : ""}`}
              onClick={() => {
                setRole("REVIEWER");
                setError("");
              }}
            >
              <span className={styles.tabIcon}>🛡</span> Reviewer
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder={isPatient ? "client@example.com" : "reviewer@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading
                ? "Signing in…"
                : isPatient
                ? "Sign in as Client"
                : "Sign in as Reviewer"}
            </button>

            <p className={styles.roleHint}>
              {isPatient
                ? "Submit and track your intake applications"
                : "Review and manage enrollment applications"}
            </p>
          </form>
        </div>

        <p className={styles.demoNote}>
          Demo: <code>patient@demo.com</code> or <code>reviewer@demo.com</code> — password: <code>password</code>
        </p>
      </div>
    </main>
  );
}
