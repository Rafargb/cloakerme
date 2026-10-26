import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getUploadsDir, readDb, writeDb } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = readDb();
  const target = db.creatives.find((c) => c.id === id);

  if (target) {
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, `${target.fileId}.${target.format}`);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
    db.creatives = db.creatives.filter((c) => c.id !== id);
    writeDb(db);
  }

  return NextResponse.json({ data: { deleted: true } });
}
