import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = readDb();
  const limit = Number(req.nextUrl.searchParams.get('limit') || 50);
  const campaignId = req.nextUrl.searchParams.get('campaignId') || '';
  const decision = req.nextUrl.searchParams.get('decision') || '';
  const country = (req.nextUrl.searchParams.get('country') || '').toUpperCase();
  const os = (req.nextUrl.searchParams.get('os') || '').toLowerCase();
  const device = (req.nextUrl.searchParams.get('device') || '').toLowerCase();
  const isBot = req.nextUrl.searchParams.get('isBot') || '';
  const isDatacenter = req.nextUrl.searchParams.get('isDatacenter') || '';
  const search = (req.nextUrl.searchParams.get('search') || '').toLowerCase();

  const campMap = new Map(db.campaigns.map((c) => [c.id, c]));

  let items = db.clicks.map((clk) => {
    const camp = campMap.get(clk.campaignId);
    const dec = clk.blocked ? ('WHITE' as const) : ('BLACK' as const);
    const botFlag = Boolean(clk.blocked && String(clk.blockReason || '').toLowerCase().includes('bot'));
    const dcFlag = Boolean(clk.blocked && !botFlag);
    return {
      ...clk,
      decision: dec,
      reason: clk.blockReason || (clk.blocked ? 'Bot / Revisão' : 'Visitante Real'),
      isBot: botFlag,
      isDatacenter: dcFlag,
      campaign: camp ? { id: camp.id, name: camp.name, slug: camp.slug } : undefined,
    };
  });

  if (campaignId) items = items.filter((c) => c.campaignId === campaignId);
  if (decision) items = items.filter((c) => c.decision === decision);
  if (country) items = items.filter((c) => (c.country || '').toUpperCase().includes(country));
  if (os) items = items.filter((c) => (c.os || '').toLowerCase().includes(os));
  if (device) items = items.filter((c) => (c.device || '').toLowerCase().includes(device));
  if (isBot === 'true') items = items.filter((c) => c.isBot);
  if (isBot === 'false') items = items.filter((c) => !c.isBot);
  if (isDatacenter === 'true') items = items.filter((c) => c.isDatacenter);
  if (isDatacenter === 'false') items = items.filter((c) => !c.isDatacenter);
  if (search) {
    items = items.filter(
      (c) =>
        (c.ip || '').toLowerCase().includes(search) ||
        (c.isp || '').toLowerCase().includes(search) ||
        (c.city || '').toLowerCase().includes(search) ||
        (c.reason || '').toLowerCase().includes(search)
    );
  }

  const summary = {
    white: items.filter((c) => c.decision === 'WHITE').length,
    black: items.filter((c) => c.decision === 'BLACK').length,
    bots: items.filter((c) => c.isBot).length,
    datacenter: items.filter((c) => c.isDatacenter).length,
  };

  return NextResponse.json({
    data: items.slice(0, limit),
    total: items.length,
    summary,
  });
}
