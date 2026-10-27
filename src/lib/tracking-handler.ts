import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { evaluateCloakRequest } from "@/lib/cloaker-engine";

export async function handleTrackingRequest(
  req: NextRequest,
  slug: string
) {
  const db = readDb();
  const campaign = db.campaigns.find((c) => c.slug === slug || c.id === slug);

  if (!campaign) {
    return new NextResponse(
      `<!doctype html><html style="background:#080808;color:#fff;font-family:sans-serif"><body style="display:grid;place-items:center;min-height:100vh"><div><h2>Campanha não encontrada: ${slug}</h2></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const queryParams: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    queryParams[k] = v;
  });

  const ip =
    queryParams["__ip"] ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "177.54.144.21";

  const userAgent =
    queryParams["__ua"] || req.headers.get("user-agent") || "Mozilla/5.0";

  const result = evaluateCloakRequest(campaign, {
    ip,
    userAgent,
    referer: req.headers.get("referer"),
    acceptLanguage: req.headers.get("accept-language"),
    countryHeader: req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country"),
    ispHeader: req.headers.get("x-isp"),
    queryParams,
  });

  if (queryParams["__json"] === "1") {
    return NextResponse.json({ data: result });
  }

  if (result.useIframe) {
    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${campaign.name}</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <iframe src="${result.targetUrl}" allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.redirect(result.targetUrl, { status: 302 });
}
