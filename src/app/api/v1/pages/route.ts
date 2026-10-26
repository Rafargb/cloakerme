import { NextRequest, NextResponse } from "next/server";
import { generateId, readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = readDb();
  return NextResponse.json({ data: db.pages });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDb();
    const now = new Date().toISOString();
    const id = generateId("cmv");
    const hasHtml = Boolean(body.html && String(body.html).trim());
    const fileId = hasHtml ? generateId("page_") : null;
    const url = hasHtml ? `/api/v1/files/${fileId}` : String(body.url || "").trim();

    const page = {
      id,
      userId: db.user.id,
      name: String(body.name || "Nova Página").trim(),
      url,
      type: (body.type === "BLACK" ? "BLACK" : "WHITE") as "WHITE" | "BLACK",
      html: hasHtml ? String(body.html) : null,
      fileId,
      createdAt: now,
      updatedAt: now,
    };

    db.pages.unshift(page);
    writeDb(db);
    return NextResponse.json({ data: page });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || "Erro ao criar página." } },
      { status: 400 }
    );
  }
}
