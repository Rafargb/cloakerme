import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = readDb();
  db.domains = db.domains.filter((d) => d.id !== id);
  writeDb(db);
  return NextResponse.json({ data: { deleted: true } });
}
