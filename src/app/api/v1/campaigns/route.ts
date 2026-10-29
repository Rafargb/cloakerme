import { NextRequest, NextResponse } from 'next/server';
import { CampaignRecord, generateId, readDb, writeDb } from '@/lib/db';
import { enrichCampaign, slugifyName } from '@/lib/campaign-utils';

export async function GET(req: NextRequest) {
  const db = readDb();
  const limit = Number(req.nextUrl.searchParams.get('limit') || 10000);
  const page = Number(req.nextUrl.searchParams.get('page') || 1);
  const enriched = db.campaigns.slice(0, limit).map((c) => enrichCampaign(c, db));
  return NextResponse.json({
    data: enriched,
    meta: {
      page,
      limit,
      total: db.campaigns.length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDb();
    const now = new Date().toISOString();

    const whitePage = db.pages.find((p) => p.id === body.whitePageId);
    const blackPage = db.pages.find((p) => p.id === body.blackPageId);
    const customDomain = db.domains.find((d) => d.id === body.customDomainId);

    const record: CampaignRecord & Record<string, any> = {
      id: generateId('cmv'),
      userId: db.user.id,
      name: String(body.name || 'Nova Campanha').trim(),
      slug: slugifyName(String(body.name || 'campanha')),
      platform: body.adPlatform || body.platform || 'meta',
      whiteUrl: whitePage?.url || String(body.whiteUrl || 'https://g1.globo.com').trim(),
      offerUrl: blackPage?.url || String(body.offerUrl || 'https://seusite.com/oferta').trim(),
      whitePageId: body.whitePageId || whitePage?.id,
      blackPageId: body.blackPageId || blackPage?.id,
      customDomainId: body.customDomainId || null,
      platformDomainId: body.platformDomainId || null,
      active: body.status ? body.status === 'ACTIVE' : body.active !== undefined ? Boolean(body.active) : true,
      status: body.status || 'ACTIVE',
      clicksTotal: 0,
      clicksReal: 0,
      clicksBlocked: 0,
      allowedCountries: Array.isArray(body.allowedCountries) ? body.allowedCountries : ['BR'],
      blockedCountries: Array.isArray(body.blockedCountries) ? body.blockedCountries : [],
      allowedLanguages: Array.isArray(body.allowedLanguages) ? body.allowedLanguages : [],
      blockedLanguages: Array.isArray(body.blockedLanguages) ? body.blockedLanguages : [],
      allowedOs: Array.isArray(body.allowedOS || body.allowedOs) ? (body.allowedOS || body.allowedOs) : [],
      allowedOS: Array.isArray(body.allowedOS || body.allowedOs) ? (body.allowedOS || body.allowedOs) : [],
      useIframe: body.displayMode === 'IFRAME' || Boolean(body.useIframe),
      displayMode: body.displayMode || 'REDIRECT',
      usePagebot: Boolean(body.usePagebot),
      abTest: Boolean(body.abTest || (Array.isArray(body.blackVariants) && body.blackVariants.length > 0)),
      abPages: Array.isArray(body.abPages) ? body.abPages : [],
      blackVariants: Array.isArray(body.blackVariants) ? body.blackVariants : [],
      autoCloak: body.blockBots !== undefined ? Boolean(body.blockBots) : true,
      blockBots: body.blockBots !== undefined ? Boolean(body.blockBots) : true,
      blockDatacenter: body.blockDatacenter !== undefined ? Boolean(body.blockDatacenter) : true,
      extraParams: String(body.extraParams || ''),
      tags: String(body.tags || ''),
      tokensRequired: Array.isArray(body.requiredUrlTokens || body.tokensRequired)
        ? (body.requiredUrlTokens || body.tokensRequired)
        : [],
      tokensBlocked: Array.isArray(body.blockedUrlTokens || body.tokensBlocked)
        ? (body.blockedUrlTokens || body.tokensBlocked)
        : [],
      uaBlocked: Array.isArray(body.uaBlocked) ? body.uaBlocked : [],
      ispBlocked: Array.isArray(body.ispBlocked) ? body.ispBlocked : [],
      ipsAllowed: Array.isArray(body.allowedIPs || body.ipsAllowed)
        ? (body.allowedIPs || body.ipsAllowed)
        : [],
      ipsBlocked: Array.isArray(body.blockedIPs || body.ipsBlocked)
        ? (body.blockedIPs || body.ipsBlocked)
        : [],
      showWhiteUntil: body.whiteUntilHour != null ? String(body.whiteUntilHour) : body.showWhiteUntil || null,
      replicateMode: Boolean(body.replicateMode),
      protectionLevel: body.protectionLevel || 'normal',
      allowedDevices:
        body.deviceFilter === 'MOBILE'
          ? 'mobile'
          : body.deviceFilter === 'DESKTOP'
          ? 'desktop'
          : 'all',
      deviceFilter: body.deviceFilter || 'ALL',
      trackingDomain: customDomain?.domain || customDomain?.hostname || String(body.trackingDomain || ''),
      warmupMode: Boolean(body.warmupClicks > 0 || body.warmupMode),
      warmupDuration: Number(body.warmupClicks || body.warmupDuration || 0),
      warmupClicks: Number(body.warmupClicks || 0),
      createdAt: now,
      updatedAt: now,
    };

    db.campaigns.unshift(record);
    writeDb(db);

    const enriched = enrichCampaign(record, db);
    return NextResponse.json(enriched);
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'Falha ao criar campanha.' } },
      { status: 400 }
    );
  }
}
