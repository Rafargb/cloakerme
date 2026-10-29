import crypto from 'crypto';
import dns from 'dns/promises';
import { NextRequest, NextResponse } from 'next/server';
import { generateId, readDb, writeDb } from '@/lib/db';

const DEFAULT_CNAME_TARGET = process.env.VERCEL_CNAME_TARGET || 'cname.vercel-dns.com';

async function checkDomainDns(domain: string): Promise<boolean> {
  try {
    const cnames = await dns.resolveCname(domain);
    if (cnames.some((c) => c.toLowerCase().includes('vercel') || c.toLowerCase().includes('cname.vercel-dns.com'))) {
      return true;
    }
  } catch (e) {
    try {
      const ips = await dns.resolve4(domain);
      if (ips.includes('76.76.21.21')) {
        return true;
      }
    } catch (e2) {}
  }
  return false;
}

export async function GET() {
  const db = readDb();
  const enriched = db.domains.map((d: any) => ({
    ...d,
    hostname: d.hostname || d.domain,
    cnameTarget: d.cnameTarget || DEFAULT_CNAME_TARGET,
    status: d.status || 'PENDING',
  }));
  return NextResponse.json({ data: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawDomain = String(body.hostname || body.domain || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');

    if (!rawDomain) {
      return NextResponse.json(
        { error: { message: 'Informe um domínio válido.' } },
        { status: 400 }
      );
    }

    const db = readDb();
    const existing = db.domains.find((d: any) => (d.hostname || d.domain) === rawDomain);
    if (existing) {
      return NextResponse.json(
        { error: { message: 'Este domínio já está cadastrado.' } },
        { status: 400 }
      );
    }

    // Verify DNS immediately upon adding
    const isPointed = await checkDomainDns(rawDomain);
    const now = new Date().toISOString();

    const record = {
      id: generateId('cmv'),
      userId: db.user.id,
      domain: rawDomain,
      hostname: rawDomain,
      cnameTarget: DEFAULT_CNAME_TARGET,
      status: (isPointed ? 'ACTIVE' : 'PENDING') as 'ACTIVE' | 'PENDING',
      errorMessage: isPointed
        ? null
        : `Aponte o CNAME para ${DEFAULT_CNAME_TARGET} e clique em Verificar DNS.`,
      changesMonth: now.slice(0, 7),
      changesCount: 1,
      operationKey: crypto.randomBytes(12).toString('base64url'),
      createdAt: now,
      updatedAt: now,
    };

    db.domains.unshift(record);
    writeDb(db);
    return NextResponse.json({ data: record });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'Falha ao registrar domínio.' } },
      { status: 400 }
    );
  }
}
