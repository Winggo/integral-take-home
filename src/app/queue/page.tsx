import { auth } from "@/auth";
import AppHeader from "@/components/AppHeader";
import ReviewQueue, { type IntakeSummary } from "@/components/ReviewQueue";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export default async function QueuePage() {
  const session = await auth();
  const user = session!.user;

  const raw = await prisma.intake.findMany({
    include: {
      reviewer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates for the client component
  const intakes: IntakeSummary[] = raw.map((i) => ({
    id: i.id,
    status: i.status as IntakeSummary["status"],
    clientName: i.clientName,
    clientEmail: i.clientEmail,
    createdAt: i.createdAt.toISOString(),
    reviewer: i.reviewer ? { name: i.reviewer.name } : null,
  }));

  return (
    <>
      <AppHeader
        userName={user.name}
        userRole={user.role}
        organization={user.organization}
      />
      <main className={styles.main}>
        <ReviewQueue intakes={intakes} />
      </main>
    </>
  );
}
