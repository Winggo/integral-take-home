import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/components/AppHeader";
import IntakeDetail, { type IntakeFull } from "@/components/IntakeDetail";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IntakeDetailPage({ params }: PageProps) {
  const [session, { id }] = await Promise.all([auth(), params]);
  const user = session!.user;

  const raw = await prisma.intake.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
      auditLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      documents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!raw) notFound();

  // Record a VIEWED audit log entry
  await prisma.auditLog.create({
    data: { action: "VIEWED", userId: user.id, intakeId: id },
  });

  // Serialize all dates for the client component
  const intake: IntakeFull = {
    id: raw.id,
    status: raw.status as IntakeFull["status"],
    createdAt: raw.createdAt.toISOString(),
    clientName: raw.clientName,
    clientEmail: raw.clientEmail,
    clientPhone: raw.clientPhone,
    dateOfBirth: raw.dateOfBirth,
    ssn: raw.ssn,
    description: raw.description,
    notes: raw.notes ?? null,
    submittedBy: raw.submittedBy,
    reviewer: raw.reviewer ?? null,
    auditLogs: raw.auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details ?? null,
      createdAt: log.createdAt.toISOString(),
      user: log.user,
    })),
    documents: raw.documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      description: doc.description ?? null,
      createdAt: doc.createdAt.toISOString(),
    })),
  };

  return (
    <>
      <AppHeader
        userName={user.name}
        userRole={user.role}
        organization={user.organization}
      />
      <main className={styles.main}>
        <IntakeDetail intake={intake} />
      </main>
    </>
  );
}
