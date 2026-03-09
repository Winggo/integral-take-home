-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intakeId" TEXT NOT NULL,
    CONSTRAINT "Document_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
