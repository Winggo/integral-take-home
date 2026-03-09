import { auth } from "@/auth";
import AppHeader from "@/components/AppHeader";
import AuditTrailList, { type AuditEntry } from "@/components/AuditTrailList";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export default async function AuditTrailPage() {
  const session = await auth();
  const user = session!.user;

  const raw = await prisma.auditLog.findMany({
    include: {
      user: { select: { id: true, name: true } },
      intake: { select: { id: true, clientName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const entries: AuditEntry[] = raw.map((log) => ({
    id: log.id,
    action: log.action,
    details: log.details ?? null,
    createdAt: log.createdAt.toISOString(),
    user: log.user,
    intake: log.intake,
  }));

  return (
    <>
      <AppHeader
        userName={user.name}
        userRole={user.role}
        organization={user.organization}
      />
      <main className={styles.main}>
        <AuditTrailList entries={entries} />
      </main>
    </>
  );
}
