import crypto from 'crypto';
import { readDb } from '@/lib/db';

export function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'campanha'}-${suffix}`;
}

export function enrichCampaign(c: any, db: ReturnType<typeof readDb>) {
  const whitePage =
    db.pages.find((p) => p.id === c.whitePageId || p.url === c.whiteUrl) || {
      id: c.whitePageId || 'w_default',
      name: c.whiteUrl || 'Página White',
      type: 'WHITE',
      url: c.whiteUrl,
    };
  const blackPage =
    db.pages.find((p) => p.id === c.blackPageId || p.url === c.offerUrl) || {
      id: c.blackPageId || 'b_default',
      name: c.offerUrl || 'Página Black',
      type: 'BLACK',
      url: c.offerUrl,
    };
  const customDomain = c.customDomainId
    ? db.domains.find((d) => d.id === c.customDomainId) || null
    : c.trackingDomain
    ? db.domains.find((d) => (d.hostname || d.domain) === c.trackingDomain) || null
    : null;

  return {
    ...c,
    status: c.status || (c.active !== false ? 'ACTIVE' : 'PAUSED'),
    adPlatform: c.adPlatform ?? c.platform ?? 'meta',
    whitePageId: c.whitePageId || whitePage.id,
    blackPageId: c.blackPageId || blackPage.id,
    whitePage,
    blackPage,
    customDomain,
    displayMode: c.displayMode || (c.useIframe ? 'IFRAME' : 'REDIRECT'),
    deviceFilter:
      c.deviceFilter ||
      (c.allowedDevices === 'mobile'
        ? 'MOBILE'
        : c.allowedDevices === 'desktop'
        ? 'DESKTOP'
        : 'ALL'),
    blockBots: c.blockBots ?? c.autoCloak ?? true,
    blockDatacenter: c.blockDatacenter ?? true,
    allowedCountries: c.allowedCountries || ['BR'],
    blockedCountries: c.blockedCountries || [],
    allowedLanguages: c.allowedLanguages || [],
    blockedLanguages: c.blockedLanguages || [],
    allowedOS: c.allowedOS || c.allowedOs || [],
    allowedIPs: c.allowedIPs || c.ipsAllowed || [],
    blockedIPs: c.blockedIPs || c.ipsBlocked || [],
    requiredUrlTokens: c.requiredUrlTokens || c.tokensRequired || [],
    blockedUrlTokens: c.blockedUrlTokens || c.tokensBlocked || [],
    warmupClicks: c.warmupClicks ?? c.warmupDuration ?? 0,
    whiteUntilHour: c.whiteUntilHour ?? null,
    blackVariants: c.blackVariants || [],
    _count: {
      clicks: c.clicksTotal ?? 0,
    },
  };
}
