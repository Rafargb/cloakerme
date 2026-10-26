import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = readDb();
  db.pages = db.pages.filter((p) => p.id !== id);
  writeDb(db);
  return NextResponse.json({ data: { deleted: true } });
}
