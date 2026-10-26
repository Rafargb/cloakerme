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

  const updated = {
    ...current,
    ...body,
    active: nextActive,
    status: nextActive ? 'ACTIVE' : 'PAUSED',
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
