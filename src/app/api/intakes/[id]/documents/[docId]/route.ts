import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string; docId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: intakeId, docId } = await params;

  // Verify the document exists and belongs to this intake
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.intakeId !== intakeId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Patients may only access documents from their own intakes
  if (session.user.role === "PATIENT") {
    const intake = await prisma.intake.findUnique({ where: { id: intakeId } });
    if (intake?.submittedById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Path traversal guard: resolved path must stay inside uploads/
  const uploadsDir = path.join(process.cwd(), "uploads");
  const absPath = path.resolve(process.cwd(), doc.filePath);
  if (!absPath.startsWith(uploadsDir + path.sep)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(absPath);
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const url = new URL(request.url);
  const disposition =
    url.searchParams.get("download") === "1"
      ? `attachment; filename="${doc.fileName}"`
      : `inline; filename="${doc.fileName}"`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": doc.fileType || "application/octet-stream",
      "Content-Disposition": disposition,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
