import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "REVIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { id: true, name: true } },
      intake: { select: { id: true, clientName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}
