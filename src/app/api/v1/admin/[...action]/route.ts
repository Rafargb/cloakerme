import { NextRequest, NextResponse } from "next/server";
import { generateId, readDb, writeDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const db = readDb();

  if (sub === "platform-domains") {
    return NextResponse.json({
      data: db.platformDomains.map((d) => ({
        ...d,
        status: d.status || "ACTIVE",
      })),
    });
  }

  if (sub === "users") {
    return NextResponse.json({
      data: [
        {
          ...db.user,
          totalClicks: db.campaigns.reduce((s, c) => s + c.clicksTotal, 0),
          campaignsCount: db.campaigns.length,
          creativesCount: db.creatives.length,
        },
      ],
    });
  }

  return NextResponse.json({ data: [] });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const db = readDb();

  if (sub === "platform-domains") {
    const body = await req.json();
    const domain = String(body.domain || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const item = {
      id: generateId("pdom_"),
      domain,
      status: "ACTIVE" as const,
    };
    db.platformDomains.unshift(item);
    writeDb(db);
    return NextResponse.json({ data: item });
  }

  if (sub.startsWith("platform-domains/") && sub.endsWith("/provision")) {
    const id = sub.split("/")[1];
    const target = db.platformDomains.find((d) => d.id === id);
    if (target) target.status = "ACTIVE";
    writeDb(db);
    return NextResponse.json({ data: target });
  }

  return NextResponse.json({ data: { ok: true } });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const db = readDb();

  if (sub.startsWith("platform-domains/")) {
    const id = sub.split("/")[1];
    db.platformDomains = db.platformDomains.filter((d) => d.id !== id);
    writeDb(db);
  }

  return NextResponse.json({ data: { deleted: true } });
}
