import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where =
    session.user.role === "PATIENT"
      ? { submittedById: session.user.id }
      : {};

  const intakes = await prisma.intake.findMany({
    where,
    include: {
      reviewer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(intakes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clientName, clientEmail, clientPhone, dateOfBirth, ssn, description, notes } = body;

  if (!clientName || !clientEmail || !clientPhone || !dateOfBirth || !ssn || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Create intake and audit log atomically
  const intake = await prisma.$transaction(async (tx) => {
    const created = await tx.intake.create({
      data: {
        clientName,
        clientEmail,
        clientPhone,
        dateOfBirth,
        ssn,
        description,
        notes: notes || null,
        status: "PENDING",
        submittedById: session.user.id,
      },
      include: { auditLogs: true },
    });

    await tx.auditLog.create({
      data: {
        action: "CREATED",
        details: JSON.stringify({ status: "PENDING" }),
        userId: session.user.id,
        intakeId: created.id,
      },
    });

    // Return intake with the audit log included
    return tx.intake.findUniqueOrThrow({
      where: { id: created.id },
      include: { auditLogs: true },
    });
  });

  return NextResponse.json(intake, { status: 201 });
}
