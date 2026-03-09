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

  // Auto-transition PENDING → IN_REVIEW on first reviewer view, and always log VIEWED.
  // Both writes are batched in a single transaction.
  let effectiveStatus = raw.status as IntakeFull["status"];
  let effectiveReviewer = raw.reviewer as { id: string; name: string } | null;

  if (raw.status === "PENDING") {
    await prisma.$transaction([
      prisma.intake.update({
        where: { id },
        data: { status: "IN_REVIEW", reviewerId: user.id },
      }),
      prisma.auditLog.create({
        data: {
          action: "STATUS_CHANGED",
          details: JSON.stringify({ from: "PENDING", to: "IN_REVIEW" }),
          userId: user.id,
          intakeId: id,
        },
      }),
      prisma.auditLog.create({
        data: { action: "VIEWED", userId: user.id, intakeId: id },
      }),
    ]);
    effectiveStatus = "IN_REVIEW";
    effectiveReviewer = { id: user.id, name: user.name };
  } else {
    await prisma.auditLog.create({
      data: { action: "VIEWED", userId: user.id, intakeId: id },
    });
  }

  // Serialize all dates for the client component
  const intake: IntakeFull = {
    id: raw.id,
    status: effectiveStatus,
    createdAt: raw.createdAt.toISOString(),
    clientName: raw.clientName,
    clientEmail: raw.clientEmail,
    clientPhone: raw.clientPhone,
    dateOfBirth: raw.dateOfBirth,
    ssn: raw.ssn,
    description: raw.description,
    notes: raw.notes ?? null,
    submittedBy: raw.submittedBy,
    reviewer: effectiveReviewer,
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
