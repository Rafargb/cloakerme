import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface UserRecord {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  plan: "FREE" | "TRIAL" | "STARTER" | "PRO" | "GLOBAL";
  status: "ACTIVE" | "SUSPENDED";
  affiliateCode: string;
  onboardingDone: boolean;
  createdAt: string;
  xgoToken: string;
}

export interface CreativeRecord {
  id: string;
  userId: string;
  originalName: string;
  newName: string;
  fileUrl: string;
  format: string;
  originalSize: number;
  newSize: number;
  hash: string;
  fileId: string;
  appliedOptions?: Record<string, any>;
  createdAt: string;
}

export interface CampaignRecord {
  id: string;
  userId: string;
  name: string;
  slug: string;
  platform: "tiktok" | "meta" | "google" | "kwai" | "taboola" | "outbrain" | "manual";
  whiteUrl: string;
  offerUrl: string;
  active: boolean;
  clicksTotal: number;
  clicksReal: number;
  clicksBlocked: number;
  allowedCountries: string[];
  allowedLanguages: string[];
  allowedOs: string[];
  useIframe: boolean;
  usePagebot: boolean;
  abTest: boolean;
  abPages: string[];
  autoCloak: boolean;
  extraParams: string;
  tags: string;
  tokensRequired: string[];
  tokensBlocked: string[];
  uaBlocked: string[];
  ispBlocked: string[];
  ipsAllowed: string[];
  ipsBlocked: string[];
  showWhiteUntil: string | null;
  replicateMode: boolean;
  protectionLevel: "safe" | "normal" | "black";
  allowedDevices: "all" | "mobile" | "desktop";
  trackingDomain: string;
  warmupMode: boolean;
  warmupDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageRecord {
  id: string;
  userId: string;
  name: string;
  url: string;
  type: "WHITE" | "BLACK";
  html?: string | null;
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainRecord {
  id: string;
  userId: string;
  domain: string;
  hostname?: string;
  cnameTarget?: string;
  status: "ACTIVE" | "PROVISIONING" | "PENDING" | "FAILED";
  errorMessage: string | null;
  changesMonth: string;
  changesCount: number;
  operationKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformDomainRecord {
  id: string;
  domain: string;
  status?: "ACTIVE" | "PROVISIONING" | "PENDING" | "FAILED";
}

export interface ClickRecord {
  id: string;
  campaignId: string;
  ip: string | null;
  country: string | null;
  city?: string | null;
  language: string | null;
  os: string | null;
  isp: string | null;
  device?: string | null;
  userAgent: string | null;
  isReal: boolean;
  blocked?: boolean;
  blockedReason: string | null;
  blockReason?: string | null;
  decision?: string;
  referer: string | null;
  params: Record<string, string>;
  createdAt: string;
}

export interface DatabaseSchema {
  user: UserRecord;
  distractorUrl: string | null;
  distractorFileId: string | null;
  creatives: CreativeRecord[];
  campaigns: CampaignRecord[];
  pages: PageRecord[];
  domains: DomainRecord[];
  platformDomains: PlatformDomainRecord[];
  clicks: ClickRecord[];
  refundRequest: {
    id: string;
    purchaseEmail: string;
    reason: string;
    whatsapp: string;
    status: "PENDING" | "CONTACTING" | "RESOLVED";
    createdAt: string;
  } | null;
}

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const DATA_DIR = IS_SERVERLESS ? path.join("/tmp", "cloakby_data") : path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");
const BUNDLED_DB_FILE = path.join(process.cwd(), "data", "db.json");

let memoryDb: DatabaseSchema | null = null;

export function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (e) {
    // Read-only filesystem fallback
  }
}

export function getUploadsDir() {
  ensureDirectories();
  return UPLOADS_DIR;
}

const INITIAL_DB: DatabaseSchema = {
  user: {
    id: "cmvkkha7o00zhy9n7kp095ap5",
    email: "onupdigitalgroup@gmail.com",
    role: "ADMIN",
    plan: "GLOBAL",
    status: "ACTIVE",
    affiliateCode: "ref-llp5bw6t08c",
    onboardingDone: true,
    createdAt: "2026-10-23T06:06:24.756Z",
    xgoToken: "xgo_pIMgT36A7TVDGlE3tvXk3g",
  },
  distractorUrl: null,
  distractorFileId: null,
  creatives: [
    {
      id: "cmvnkucd10034u7n7k1qt1epz",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      originalName: "300PIA A V08.18 - v2.MP4",
      newName: "5bddeb0c-da16-4b80-8bb3-3e052593912a.mp4",
      fileUrl: "/api/v1/files/cmvnkuccy0033u7n7yevi9cuo",
      format: "mp4",
      originalSize: 3169952,
      newSize: 3969987,
      hash: "a273fdae6815f4586b73e859d46e5ade76b5f3d80a2d3ab7618c25c55ce59e5d",
      fileId: "cmvnkuccy0033u7n7yevi9cuo",
      createdAt: "2026-10-25T08:39:52.597Z",
    },
    {
      id: "cmvnke46v002wu7n7l8s4z7vq",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      originalName: "300PIA A V08.9 - v2.mp4",
      newName: "f505b9d7-94f7-4960-bcd0-dd6fcacfbcbe.mp4",
      fileUrl: "/api/v1/files/cmvnke46m002vu7n7tmqeb7av",
      format: "mp4",
      originalSize: 11716727,
      newSize: 7525476,
      hash: "11974b0e06e4b5998e66139797fa303ceebcd336fe34e7964701e52bf501bff4",
      fileId: "cmvnke46m002vu7n7tmqeb7av",
      createdAt: "2026-10-25T08:27:15.511Z",
    },
    {
      id: "cmvm0gcjb000t07n7jrvjy1no",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      originalName: "1024 (3).mp4",
      newName: "09bbde0c-88ab-40e5-9665-95f139c34f30.mp4",
      fileUrl: "/api/v1/files/cmvm0gcj7000s07n7w4dwj84d",
      format: "mp4",
      originalSize: 17422354,
      newSize: 12154088,
      hash: "d0b94d7974fabee840fd1331f8b3c690db9b5e2ae27645b611498abf41cc8f9e",
      fileId: "cmvm0gcj7000s07n7w4dwj84d",
      createdAt: "2026-10-24T06:21:21.143Z",
    },
    {
      id: "cmvlzj4gw000r07n7cux8ozn6",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      originalName: "1024 (2).mp4",
      newName: "a8be912f-d035-47c5-af7a-395d6c528b2a.mp4",
      fileUrl: "/api/v1/files/cmvlzj4gs000q07n738k6dj8e",
      format: "mp4",
      originalSize: 17191235,
      newSize: 5209766,
      hash: "380f46db04834895ce1be826f02407dee4a58d7e5378d042ee2818297695ec1c",
      fileId: "cmvlzj4gs000q07n738k6dj8e",
      createdAt: "2026-10-24T05:55:31.040Z",
    },
  ],
  campaigns: [
    {
      id: "cmvo31k9e003vu7n7wz2bkpky",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      name: "Templates Videos 01",
      slug: "templates-videos-01-bffuhv",
      platform: "meta",
      whiteUrl: "https://aimedialab.online/video-ia",
      offerUrl: "https://aimedialab.online",
      active: true,
      clicksTotal: 546,
      clicksReal: 78,
      clicksBlocked: 468,
      allowedCountries: [],
      allowedLanguages: [],
      allowedOs: [],
      useIframe: true,
      usePagebot: false,
      abTest: false,
      abPages: [],
      autoCloak: true,
      extraParams: "",
      tags: "meta, video, templates",
      tokensRequired: [],
      tokensBlocked: [],
      uaBlocked: [],
      ispBlocked: [],
      ipsAllowed: [],
      ipsBlocked: [],
      showWhiteUntil: null,
      replicateMode: true,
      protectionLevel: "normal",
      allowedDevices: "all",
      trackingDomain: "templates.aimedialab.online",
      warmupMode: false,
      warmupDuration: 60,
      createdAt: "2026-10-25T17:09:22.514Z",
      updatedAt: "2026-10-26T09:23:48.123Z",
    },
    {
      id: "cmvnms5ee0035u7n74vv9w68z",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      name: "Model Cash 01",
      slug: "model-cash-01-oxajb1",
      platform: "meta",
      whiteUrl: "https://aimedialab.online/video-ia",
      offerUrl: "https://aimedialab.online",
      active: true,
      clicksTotal: 82,
      clicksReal: 12,
      clicksBlocked: 70,
      allowedCountries: [],
      allowedLanguages: [],
      allowedOs: [],
      useIframe: true,
      usePagebot: false,
      abTest: false,
      abPages: [],
      autoCloak: true,
      extraParams: "",
      tags: "meta, model-cash",
      tokensRequired: [],
      tokensBlocked: [],
      uaBlocked: [],
      ispBlocked: [],
      ipsAllowed: [],
      ipsBlocked: [],
      showWhiteUntil: null,
      replicateMode: true,
      protectionLevel: "normal",
      allowedDevices: "all",
      trackingDomain: "templates.aimedialab.online",
      warmupMode: false,
      warmupDuration: 60,
      createdAt: "2026-10-25T09:34:09.494Z",
      updatedAt: "2026-10-25T17:08:23.922Z",
    },
  ],
  pages: [
    {
      id: "cmvniwq2c002ru7n7zm3ko0yq",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      name: "Model Cash",
      url: "https://aimedialab.online",
      type: "BLACK",
      fileId: null,
      createdAt: "2026-10-25T07:45:44.436Z",
      updatedAt: "2026-10-25T07:45:44.436Z",
    },
    {
      id: "cmvniw74s002qu7n7tgk0n4op",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      name: "Model Cash (White)",
      url: "https://aimedialab.online/video-ia",
      type: "WHITE",
      fileId: null,
      createdAt: "2026-10-25T07:45:19.900Z",
      updatedAt: "2026-10-25T07:45:19.900Z",
    },
  ],
  domains: [
    {
      id: "cmvn6fbko001du7n7ouatz7nt",
      userId: "cmvkkha7o00zhy9n7kp095ap5",
      domain: "templates.aimedialab.online",
      status: "ACTIVE",
      errorMessage: null,
      changesMonth: "2026-10",
      changesCount: 1,
      operationKey: "hOa2XiylnOJiTg6qOQhrpw",
      createdAt: "2026-10-25T01:56:17.112Z",
      updatedAt: "2026-10-25T07:09:22.617Z",
    },
  ],
  platformDomains: [
    { id: "cmst8wwqe00022jn74fzta4iv", domain: "amizadereally.shop", status: "ACTIVE" },
    { id: "cmsup4pil0001ugn75w5z9zky", domain: "track.kilopfze.shop", status: "ACTIVE" },
  ],
  clicks: [
    {
      id: "GtiAoecwviHsN0JVBWLfP",
      campaignId: "cmvo31k9e003vu7n7wz2bkpky",
      ip: "2a03:2880:3ff:6::",
      country: "US",
      language: "en-US",
      os: "Linux",
      isp: "Meta Platforms Ireland",
      userAgent: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      isReal: false,
      blockedReason: "bot_ua:facebookexternalhit",
      referer: null,
      params: {},
      createdAt: "2026-10-26T09:23:48.118Z",
    },
    {
      id: "2RF4QTbgjX6wjvIeDrhRX",
      campaignId: "cmvo31k9e003vu7n7wz2bkpky",
      ip: "177.54.144.21",
      country: "BR",
      language: "pt-BR",
      os: "iOS",
      isp: "Claro NXT Telecomunicacoes",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F79 Instagram",
      isReal: true,
      blockedReason: null,
      referer: "https://l.instagram.com/",
      params: { fbclid: "IwZXh0bgNhZW0BMABhZGlkAas123" },
      createdAt: "2026-10-26T09:20:10.000Z",
    },
    {
      id: "vxIyNOuzFl8CaU3VgmhQF",
      campaignId: "cmvo31k9e003vu7n7wz2bkpky",
      ip: "189.40.82.109",
      country: "BR",
      language: "pt-BR",
      os: "Android",
      isp: "Vivo / Telefonica Brasil",
      userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
      isReal: true,
      blockedReason: null,
      referer: "https://m.facebook.com/",
      params: { fbclid: "IwZXh0bgNhZW0BMABhZGlkAas456" },
      createdAt: "2026-10-26T09:15:32.000Z",
    },
    {
      id: "K3bgwCEknXmLvubmwZfUL",
      campaignId: "cmvo31k9e003vu7n7wz2bkpky",
      ip: "34.171.112.4",
      country: "US",
      language: "en-US",
      os: "Windows",
      isp: "Google Cloud",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      isReal: false,
      blockedReason: "no_click_id",
      referer: null,
      params: {},
      createdAt: "2026-10-26T07:20:22.167Z",
    },
    {
      id: "mcClickReal01",
      campaignId: "cmvnms5ee0035u7n74vv9w68z",
      ip: "200.155.88.14",
      country: "BR",
      language: "pt-BR",
      os: "iOS",
      isp: "TIM Brasil",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      isReal: true,
      blockedReason: null,
      referer: "https://l.facebook.com/",
      params: { fbclid: "IwZXh0bgNhZW0BMABhZGlkAas789" },
      createdAt: "2026-10-26T08:11:04.000Z",
    },
  ],
  refundRequest: null,
};

export function readDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }
  ensureDirectories();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw) as DatabaseSchema;
      return memoryDb;
    }
    if (fs.existsSync(BUNDLED_DB_FILE)) {
      const raw = fs.readFileSync(BUNDLED_DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw) as DatabaseSchema;
      try {
        fs.writeFileSync(DB_FILE, raw, "utf-8");
      } catch {}
      return memoryDb;
    }
  } catch {}

  memoryDb = structuredClone(INITIAL_DB);
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), "utf-8");
  } catch {}
  return memoryDb;
}

export function writeDb(db: DatabaseSchema): void {
  memoryDb = db;
  ensureDirectories();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    // If running in restricted serverless container, memoryDb retains changes
  }
}

export function generateId(prefix = "cmv"): string {
  return `${prefix}${crypto.randomBytes(10).toString("hex")}`;
}
