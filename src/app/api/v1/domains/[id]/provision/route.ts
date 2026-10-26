import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = readDb();
  const idx = db.domains.findIndex((d) => d.id === id);
  if (idx !== -1) {
    db.domains[idx].status = "ACTIVE";
    db.domains[idx].errorMessage = null;
    db.domains[idx].updatedAt = new Date().toISOString();
    writeDb(db);
    return NextResponse.json({ data: db.domains[idx] });
  }
  return NextResponse.json({ error: { message: "Domínio não encontrado." } }, { status: 404 });
}
