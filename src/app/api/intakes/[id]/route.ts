import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const intake = await prisma.intake.findUnique({
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

  if (!intake) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Patients may only view their own intakes
  if (session.user.role === "PATIENT" && intake.submittedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(intake);
}

const VALID_STATUSES = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"] as const;
type IntakeStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "REVIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status: IntakeStatus };

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.intake.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const intake = await tx.intake.update({
      where: { id },
      data: {
        status,
        reviewerId: session.user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STATUS_CHANGED",
        details: JSON.stringify({ from: existing.status, to: status }),
        userId: session.user.id,
        intakeId: id,
      },
    });

    return intake;
  });

  return NextResponse.json(updated);
}
