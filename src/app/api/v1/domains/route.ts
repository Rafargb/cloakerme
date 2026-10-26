import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateId, readDb, writeDb } from '@/lib/db';

export async function GET() {
  const db = readDb();
  const enriched = db.domains.map((d: any) => ({
    ...d,
    hostname: d.hostname || d.domain,
    cnameTarget: d.cnameTarget || 'cname.cloakbyco.com',
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
    const now = new Date().toISOString();
    const record = {
      id: generateId('cmv'),
      userId: db.user.id,
      domain: rawDomain,
      hostname: rawDomain,
      cnameTarget: 'cname.cloakbyco.com',
      status: 'ACTIVE' as const,
      errorMessage: null,
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
