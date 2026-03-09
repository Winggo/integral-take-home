import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: intakeId } = await params;

  const intake = await prisma.intake.findUnique({ where: { id: intakeId } });
  if (!intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const description = formData.get("description") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Save file to local disk: uploads/<intakeId>/<timestamp>-<name>
  const uploadDir = path.join(process.cwd(), "uploads", intakeId);
  await mkdir(uploadDir, { recursive: true });

  const storedName = `${Date.now()}-${file.name}`;
  const relPath = path.join("uploads", intakeId, storedName);
  const absPath = path.join(process.cwd(), relPath);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  const document = await prisma.document.create({
    data: {
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      filePath: relPath,
      description: description || null,
      intakeId,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
