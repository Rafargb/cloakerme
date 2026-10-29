import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { enrichCampaign } from '@/lib/campaign-utils';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const db = readDb();

  const idx = db.campaigns.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: { message: 'Campanha não encontrada.' } }, { status: 404 });
  }

  const current = db.campaigns[idx] as any;
  const nextActive =
    body.status !== undefined
      ? body.status === 'ACTIVE'
      : body.active !== undefined
      ? Boolean(body.active)
      : current.active;

  const whitePage = body.whitePageId ? db.pages.find((p) => p.id === body.whitePageId) : null;
  const blackPage = body.blackPageId ? db.pages.find((p) => p.id === body.blackPageId) : null;
  const customDomain = body.customDomainId ? db.domains.find((d) => d.id === body.customDomainId) : null;

  const updated = {
    ...current,
    ...body,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    platform: body.adPlatform || body.platform || current.platform || 'meta',
    adPlatform: body.adPlatform || body.platform || current.adPlatform || 'meta',
    whiteUrl: whitePage?.url || (body.whiteUrl ? String(body.whiteUrl).trim() : current.whiteUrl),
    offerUrl: blackPage?.url || (body.offerUrl ? String(body.offerUrl).trim() : current.offerUrl),
    whitePageId: body.whitePageId !== undefined ? body.whitePageId : current.whitePageId,
    blackPageId: body.blackPageId !== undefined ? body.blackPageId : current.blackPageId,
    customDomainId: body.customDomainId !== undefined ? body.customDomainId : current.customDomainId,
    platformDomainId: body.platformDomainId !== undefined ? body.platformDomainId : current.platformDomainId,
    trackingDomain: customDomain?.domain || customDomain?.hostname || (body.customDomainId === null ? '' : current.trackingDomain),
    active: nextActive,
    status: nextActive ? 'ACTIVE' : 'PAUSED',
    displayMode: body.displayMode || current.displayMode || 'REDIRECT',
    useIframe: body.displayMode ? body.displayMode === 'IFRAME' : current.useIframe,
    deviceFilter: body.deviceFilter || current.deviceFilter || 'ALL',
    allowedDevices:
      body.deviceFilter === 'MOBILE'
        ? 'mobile'
        : body.deviceFilter === 'DESKTOP'
        ? 'desktop'
        : body.deviceFilter === 'ALL'
        ? 'all'
        : current.allowedDevices,
    blockBots: body.blockBots !== undefined ? Boolean(body.blockBots) : current.blockBots,
    autoCloak: body.blockBots !== undefined ? Boolean(body.blockBots) : current.autoCloak,
    blockDatacenter: body.blockDatacenter !== undefined ? Boolean(body.blockDatacenter) : current.blockDatacenter,
    allowedCountries: Array.isArray(body.allowedCountries) ? body.allowedCountries : current.allowedCountries,
    blockedCountries: Array.isArray(body.blockedCountries) ? body.blockedCountries : current.blockedCountries,
    allowedLanguages: Array.isArray(body.allowedLanguages) ? body.allowedLanguages : current.allowedLanguages,
    blockedLanguages: Array.isArray(body.blockedLanguages) ? body.blockedLanguages : current.blockedLanguages,
    allowedOS: Array.isArray(body.allowedOS || body.allowedOs) ? (body.allowedOS || body.allowedOs) : current.allowedOS,
    allowedOs: Array.isArray(body.allowedOS || body.allowedOs) ? (body.allowedOS || body.allowedOs) : current.allowedOs,
    allowedIPs: Array.isArray(body.allowedIPs || body.ipsAllowed) ? (body.allowedIPs || body.ipsAllowed) : current.allowedIPs,
    ipsAllowed: Array.isArray(body.allowedIPs || body.ipsAllowed) ? (body.allowedIPs || body.ipsAllowed) : current.ipsAllowed,
    blockedIPs: Array.isArray(body.blockedIPs || body.ipsBlocked) ? (body.blockedIPs || body.ipsBlocked) : current.blockedIPs,
    ipsBlocked: Array.isArray(body.blockedIPs || body.ipsBlocked) ? (body.blockedIPs || body.ipsBlocked) : current.ipsBlocked,
    requiredUrlTokens: Array.isArray(body.requiredUrlTokens || body.tokensRequired) ? (body.requiredUrlTokens || body.tokensRequired) : current.requiredUrlTokens,
    tokensRequired: Array.isArray(body.requiredUrlTokens || body.tokensRequired) ? (body.requiredUrlTokens || body.tokensRequired) : current.tokensRequired,
    blockedUrlTokens: Array.isArray(body.blockedUrlTokens || body.tokensBlocked) ? (body.blockedUrlTokens || body.tokensBlocked) : current.blockedUrlTokens,
    tokensBlocked: Array.isArray(body.blockedUrlTokens || body.tokensBlocked) ? (body.blockedUrlTokens || body.tokensBlocked) : current.tokensBlocked,
    warmupClicks: body.warmupClicks !== undefined ? Number(body.warmupClicks) : current.warmupClicks,
    warmupDuration: body.warmupClicks !== undefined ? Number(body.warmupClicks) : current.warmupDuration,
    warmupMode: body.warmupClicks !== undefined ? Number(body.warmupClicks) > 0 : current.warmupMode,
    whiteUntilHour: body.whiteUntilHour !== undefined ? (body.whiteUntilHour != null ? Number(body.whiteUntilHour) : null) : current.whiteUntilHour,
    blackVariants: Array.isArray(body.blackVariants) ? body.blackVariants : current.blackVariants,
    abTest: Array.isArray(body.blackVariants) ? body.blackVariants.length > 0 : current.abTest,
    updatedAt: new Date().toISOString(),
  };

  db.campaigns[idx] = updated;
  writeDb(db);

  return NextResponse.json(enrichCampaign(updated, db));
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = readDb();
  db.campaigns = db.campaigns.filter((c) => c.id !== id);
  writeDb(db);
  return NextResponse.json({ data: { removed: true } });
}
