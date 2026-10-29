import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateId, readDb, writeDb } from '@/lib/db';

const DEFAULT_CNAME_TARGET = process.env.VERCEL_CNAME_TARGET || 'cname.vercel-dns.com';

export async function GET() {
  const db = readDb();
  const enriched = (db.domains || []).map((d: any) => ({
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
      .replace(/^[a-z]+:\/\//i, '')
      .replace(/\/.*$/, '');

    if (!rawDomain || !rawDomain.includes('.') || rawDomain.length < 3) {
      return NextResponse.json(
        { error: { message: 'Informe um domínio ou subdomínio válido (ex: track.seudominio.com).' } },
        { status: 400 }
      );
    }

    const db = readDb();
    if (!Array.isArray(db.domains)) {
      db.domains = [];
    }

    const existing = db.domains.find((d: any) => (d.hostname || d.domain) === rawDomain);
    if (existing) {
      return NextResponse.json(
        { error: { message: 'Este domínio já está cadastrado na sua lista.' } },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const record = {
      id: generateId('cmv'),
      userId: db.user.id,
      domain: rawDomain,
      hostname: rawDomain,
      cnameTarget: DEFAULT_CNAME_TARGET,
      status: 'PENDING' as const,
      errorMessage: `Aponte o CNAME para ${DEFAULT_CNAME_TARGET} e depois clique em Verificar DNS.`,
      changesMonth: now.slice(0, 7),
      changesCount: 0,
      operationKey: crypto.randomBytes(12).toString('base64url'),
      createdAt: now,
      updatedAt: now,
    };

    // Add without any artificial limits (unlimited domains)
    db.domains.unshift(record);
    writeDb(db);

    return NextResponse.json({ data: record, success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'Falha ao adicionar domínio.' } },
      { status: 400 }
    );
  }
}
