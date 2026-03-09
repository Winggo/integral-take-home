"use client";

import { signOut } from "next-auth/react";
import styles from "./AppHeader.module.css";

interface Props {
  userName: string;
  userRole: "PATIENT" | "REVIEWER";
  organization: string;
}

export default function AppHeader({ userName, userRole, organization }: Props) {
  const roleLabel = userRole === "PATIENT" ? "Client" : "Reviewer";

  async function handleSignOut() {
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className={styles.header}>
      <span className={styles.appName}>Intake Review System</span>

      <div className={styles.right}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName}</span>
          <span className={styles.userMeta}>
            {roleLabel} · {organization}
          </span>
        </div>
        <button onClick={handleSignOut} className={styles.signOutBtn}>
          Sign out
        </button>
      </div>
    </header>
  );
}
