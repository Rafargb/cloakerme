import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { evaluateCloakRequest } from "@/lib/cloaker-engine";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const db = readDb();
  const campaign = db.campaigns.find((c) => c.slug === slug || c.id === slug);

  if (!campaign) {
    return NextResponse.json({ error: { message: "Campanha não encontrada." } }, { status: 404 });
  }

  const queryParams: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    queryParams[k] = v;
  });

  const result = evaluateCloakRequest(campaign, {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "189.40.82.109",
    userAgent: req.headers.get("user-agent") || "Mozilla/5.0",
    referer: req.headers.get("referer"),
    acceptLanguage: req.headers.get("accept-language"),
    countryHeader: "BR",
    ispHeader: "Vivo / Telefonica Brasil",
    queryParams,
    forceMode: "real",
  });

  if (queryParams["__json"] === "1") {
    return NextResponse.json({ data: result });
  }

  return NextResponse.redirect(result.targetUrl, { status: 302 });
}
