import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { generateId, readDb, writeDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const db = readDb();

  if (sub === "settings") {
    return NextResponse.json({
      data: {
        user: db.user,
        isAdmin: db.user.role === "ADMIN",
        customDomain: db.domains[0]?.domain || null,
        customDomains: db.domains.map((d) => ({
          id: d.id,
          domain: d.domain,
          status: d.status,
        })),
      },
    });
  }

  if (sub === "affiliate") {
    return NextResponse.json({
      data: {
        code: db.user.affiliateCode,
        referrals: [],
        isAdmin: db.user.role === "ADMIN",
      },
    });
  }

  if (sub === "achievements") {
    const totalClicks = db.campaigns.reduce((sum, c) => sum + c.clicksTotal, 0);
    const milestones = [
      { code: "500K", clicks: 500000 },
      { code: "1M", clicks: 1000000 },
      { code: "5M", clicks: 5000000 },
      { code: "10M", clicks: 10000000 },
      { code: "25M", clicks: 25000000 },
    ].map((m) => ({
      ...m,
      unlocked: totalClicks >= m.clicks,
    }));

    return NextResponse.json({
      data: {
        totalClicks,
        milestones,
      },
    });
  }

  if (sub === "refund") {
    return NextResponse.json({
      data: {
        purchaseEmails: [db.user.email],
        request: db.refundRequest,
      },
    });
  }

  return NextResponse.json({ data: {} });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const body = await req.json();
  const db = readDb();

  if (sub === "settings") {
    if (body.email) {
      db.user.email = String(body.email).trim();
    }
    writeDb(db);
    return NextResponse.json({ data: { user: db.user } });
  }

  if (sub === "affiliate") {
    if (body.code) {
      db.user.affiliateCode = String(body.code)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      writeDb(db);
    }
    return NextResponse.json({
      data: {
        code: db.user.affiliateCode,
        referrals: [],
        isAdmin: db.user.role === "ADMIN",
      },
    });
  }

  return NextResponse.json({ data: { ok: true } });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const sub = action.join("/");
  const db = readDb();

  if (sub === "onboarding/complete") {
    db.user.onboardingDone = true;
    writeDb(db);
    return NextResponse.json({ data: { ok: true } });
  }

  if (sub === "rotate-xgo-token") {
    const newToken = `xgo_${crypto.randomBytes(16).toString("base64url")}`;
    db.user.xgoToken = newToken;
    writeDb(db);
    return NextResponse.json({ data: { token: newToken } });
  }

  if (sub === "refund") {
    const body = await req.json();
    db.refundRequest = {
      id: generateId("ref_"),
      purchaseEmail: String(body.purchaseEmail || db.user.email),
      reason: String(body.reason || ""),
      whatsapp: String(body.whatsapp || ""),
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    writeDb(db);
    return NextResponse.json({ data: { request: db.refundRequest } });
  }

  return NextResponse.json({ data: { ok: true } });
}
