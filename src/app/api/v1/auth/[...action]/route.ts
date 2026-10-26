import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const db = readDb();

  if (sub === "me") {
    return NextResponse.json({
      data: {
        id: db.user.id,
        email: db.user.email,
        role: db.user.role,
        plan: db.user.plan,
        status: db.user.status,
        onboardingDone: db.user.onboardingDone,
      },
    });
  }

  return NextResponse.json({ data: { valid: true, email: db.user.email } });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const db = readDb();

  if (sub === "login") {
    try {
      const body = await req.json();
      if (body?.email) {
        db.user.email = body.email;
        writeDb(db);
      }
    } catch {}
    return NextResponse.json({ data: db.user });
  }

  if (sub === "logout" || sub === "logout-all") {
    return NextResponse.json({ data: { ok: true } });
  }

  return NextResponse.json({ data: { ok: true } });
}
