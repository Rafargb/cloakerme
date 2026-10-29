import { CampaignRecord, ClickRecord, generateId, readDb, writeDb } from "./db";

const BOT_UA_SIGNATURES = [
  "facebookexternalhit",
  "facebot",
  "meta-externalagent",
  "adsbot-google",
  "mediapartners-google",
  "googlebot",
  "apis-google",
  "tiktokspider",
  "bytespider",
  "bytedance",
  "kwai",
  "bingbot",
  "crawler",
  "spider",
  "robot",
  "headlesschrome",
  "phantomjs",
  "puppeteer",
  "playwright",
  "selenium",
  "curl/",
  "wget/",
  "python-requests",
  "go-http-client",
  "axios/",
  "lighthouse",
];

const DATACENTER_ISP_SIGNATURES = [
  "amazon",
  "aws",
  "google cloud",
  "google llc",
  "microsoft",
  "azure",
  "digitalocean",
  "hetzner",
  "ovh",
  "linode",
  "vultr",
  "cloudflare",
  "fastly",
  "akamai",
  "meta platforms",
  "facebook",
  "bytedance",
];

export function detectOs(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ios")) return "iOS";
  if (lower.includes("android")) return "Android";
  if (lower.includes("mac os") || lower.includes("macintosh")) return "macOS";
  if (lower.includes("windows")) return "Windows";
  if (lower.includes("linux")) return "Linux";
  return "Other";
}

export function detectDeviceType(ua: string): "mobile" | "desktop" {
  const lower = ua.toLowerCase();
  if (/android|iphone|ipad|ipod|mobile|iemobile|opera mini/i.test(lower)) {
    return "mobile";
  }
  return "desktop";
}

export interface CloakEvaluationResult {
  isReal: boolean;
  blockedReason: string | null;
  targetUrl: string;
  useIframe: boolean;
  click: ClickRecord;
  campaign: CampaignRecord;
}

export function evaluateCloakRequest(
  campaign: CampaignRecord,
  reqInfo: {
    ip: string;
    userAgent: string;
    referer: string | null;
    acceptLanguage: string | null;
    countryHeader: string | null;
    ispHeader: string | null;
    queryParams: Record<string, string>;
    forceMode?: "real" | "white";
  }
): CloakEvaluationResult {
  const ua = reqInfo.userAgent || "";
  const uaLower = ua.toLowerCase();
  const os = detectOs(ua);
  const device = detectDeviceType(ua);
  const country = (
    reqInfo.queryParams["__country"] ||
    reqInfo.countryHeader ||
    "BR"
  ).toUpperCase();
  const language =
    reqInfo.queryParams["__lang"] ||
    (reqInfo.acceptLanguage ? reqInfo.acceptLanguage.split(",")[0]?.trim() : "pt-BR") ||
    "pt-BR";
  const isp =
    reqInfo.queryParams["__isp"] ||
    reqInfo.ispHeader ||
    (uaLower.includes("facebookexternalhit") ? "Meta Platforms Ireland" : "Provedor Residencial");

  let isReal = true;
  let blockedReason: string | null = null;

  if (reqInfo.forceMode === "real") {
    isReal = true;
    blockedReason = null;
  } else if (reqInfo.forceMode === "white") {
    isReal = false;
    blockedReason = "forced_white_preview";
  } else {
    // 1. Check if campaign is active
    if (!campaign.active) {
      isReal = false;
      blockedReason = "campaign_paused";
    }

    // 2. Check showWhiteUntil schedule
    if (isReal && campaign.showWhiteUntil) {
      const untilMs = new Date(campaign.showWhiteUntil).getTime();
      if (!Number.isNaN(untilMs) && Date.now() < untilMs) {
        isReal = false;
        blockedReason = "scheduled_white";
      }
    }

    // 3. Check warmupMode
    if (isReal && campaign.warmupMode) {
      const createdMs = new Date(campaign.createdAt).getTime();
      const warmupEndMs = createdMs + (campaign.warmupDuration || 60) * 60 * 1000;
      if (Date.now() < warmupEndMs) {
        isReal = false;
        blockedReason = "warmup_mode";
      }
    }

    // 4. Explicit IP allowlist / blocklist
    if (isReal && campaign.ipsBlocked?.length > 0) {
      if (campaign.ipsBlocked.some((b) => reqInfo.ip.includes(b.trim()))) {
        isReal = false;
        blockedReason = `ip_blocked:${reqInfo.ip}`;
      }
    }
    const isExplicitlyAllowedIp =
      campaign.ipsAllowed?.length > 0 &&
      campaign.ipsAllowed.some((a) => reqInfo.ip.includes(a.trim()));

    if (isReal && !isExplicitlyAllowedIp) {
      // 5. Auto-cloak Bot User-Agent detection
      if (campaign.autoCloak) {
        for (const sig of BOT_UA_SIGNATURES) {
          if (uaLower.includes(sig)) {
            isReal = false;
            blockedReason = `bot_ua:${sig}`;
            break;
          }
        }
      }

      // 6. Custom UA blocklist
      if (isReal && campaign.uaBlocked?.length > 0) {
        for (const customUa of campaign.uaBlocked) {
          if (customUa && uaLower.includes(customUa.toLowerCase())) {
            isReal = false;
            blockedReason = `ua_blocked:${customUa}`;
            break;
          }
        }
      }

      // 7. ISP blocklist & datacenter detection on normal/black protection
      if (isReal && campaign.ispBlocked?.length > 0) {
        for (const blockedIsp of campaign.ispBlocked) {
          if (blockedIsp && isp.toLowerCase().includes(blockedIsp.toLowerCase())) {
            isReal = false;
            blockedReason = `isp_blocked:${blockedIsp}`;
            break;
          }
        }
      }
      if (isReal && campaign.autoCloak && campaign.protectionLevel !== "safe") {
        for (const dcIsp of DATACENTER_ISP_SIGNATURES) {
          if (isp.toLowerCase().includes(dcIsp)) {
            isReal = false;
            blockedReason = `datacenter_isp:${dcIsp}`;
            break;
          }
        }
      }

      // 8. Device filter
      if (isReal && campaign.allowedDevices && campaign.allowedDevices !== "all") {
        if (campaign.allowedDevices !== device) {
          isReal = false;
          blockedReason = `device_mismatch:${device}`;
        }
      }

      // 9. Allowed countries
      if (isReal && campaign.allowedCountries?.length > 0) {
        const upperAllowed = campaign.allowedCountries.map((c) => c.toUpperCase());
        if (!upperAllowed.includes(country)) {
          isReal = false;
          blockedReason = `geo_block:${country}`;
        }
      }

      // 10. Allowed languages
      if (isReal && campaign.allowedLanguages?.length > 0) {
        const langMatch = campaign.allowedLanguages.some((l) =>
          language.toLowerCase().startsWith(l.toLowerCase())
        );
        if (!langMatch) {
          isReal = false;
          blockedReason = `lang_block:${language}`;
        }
      }

      // 11. Allowed OS
      if (isReal && campaign.allowedOs?.length > 0) {
        const osMatch = campaign.allowedOs.some((o) =>
          os.toLowerCase().includes(o.toLowerCase())
        );
        if (!osMatch) {
          isReal = false;
          blockedReason = `os_block:${os}`;
        }
      }

      // 12. Blocked tokens in query string
      if (isReal && campaign.tokensBlocked?.length > 0) {
        const allQueryStr = new URLSearchParams(reqInfo.queryParams).toString().toLowerCase();
        for (const tb of campaign.tokensBlocked) {
          if (tb && allQueryStr.includes(tb.toLowerCase())) {
            isReal = false;
            blockedReason = `token_blocked:${tb}`;
            break;
          }
        }
      }

      // 13. Required tokens in query string
      if (isReal && campaign.tokensRequired?.length > 0) {
        for (const tr of campaign.tokensRequired) {
          if (
            tr &&
            !(tr in reqInfo.queryParams) &&
            !Object.values(reqInfo.queryParams).some((v) => v.includes(tr))
          ) {
            isReal = false;
            blockedReason = `missing_token:${tr}`;
            break;
          }
        }
      }

      // 14. Protection level "black" requires click ID or xgo token
      if (isReal && campaign.protectionLevel === "black") {
        const hasClickId = Boolean(
          reqInfo.queryParams["fbclid"] ||
            reqInfo.queryParams["ttclid"] ||
            reqInfo.queryParams["gclid"] ||
            reqInfo.queryParams["click_id"] ||
            reqInfo.queryParams["xgo"]
        );
        if (!hasClickId) {
          isReal = false;
          blockedReason = "no_click_id";
        }
      }
    }
  }

  // Pick destination URL
  let targetUrl = campaign.whiteUrl;
  if (isReal) {
    if (campaign.abTest && campaign.abPages?.length > 0) {
      const pool = [campaign.offerUrl, ...campaign.abPages.filter(Boolean)];
      targetUrl = pool[Math.floor(Math.random() * pool.length)] || campaign.offerUrl;
    } else {
      targetUrl = campaign.offerUrl;
    }
  }

  // Forward non-internal query params to targetUrl if redirecting
  const cleanParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(reqInfo.queryParams)) {
    if (!k.startsWith("__")) {
      cleanParams[k] = v;
    }
  }

  // Persist click and update campaign stats
  const db = readDb();
  const clickRecord: ClickRecord = {
    id: generateId("clk_"),
    campaignId: campaign.id,
    ip: reqInfo.ip,
    country,
    language,
    os,
    isp,
    userAgent: ua,
    isReal,
    blockedReason,
    referer: reqInfo.referer,
    params: cleanParams,
    createdAt: new Date().toISOString(),
  };

  db.clicks.unshift(clickRecord);
  if (db.clicks.length > 50000) {
    db.clicks = db.clicks.slice(0, 50000);
  }

  const campIdx = db.campaigns.findIndex((c) => c.id === campaign.id);
  if (campIdx !== -1) {
    db.campaigns[campIdx].clicksTotal += 1;
    if (isReal) {
      db.campaigns[campIdx].clicksReal += 1;
    } else {
      db.campaigns[campIdx].clicksBlocked += 1;
    }
    db.campaigns[campIdx].updatedAt = new Date().toISOString();
  }

  writeDb(db);

  return {
    isReal,
    blockedReason,
    targetUrl,
    useIframe: isReal ? campaign.useIframe : campaign.useIframe || campaign.replicateMode,
    click: clickRecord,
    campaign: campIdx !== -1 ? db.campaigns[campIdx] : campaign,
  };
}
