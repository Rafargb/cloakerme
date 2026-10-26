import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get('days') || 7);
  const campaignId = req.nextUrl.searchParams.get('campaignId') || '';
  const db = readDb();

  const filteredCampaigns = campaignId
    ? db.campaigns.filter((c) => c.id === campaignId)
    : db.campaigns;

  const totalCampaigns = filteredCampaigns.length;
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicksTotal, 0);
  const blackClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicksReal, 0);
  const whiteClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicksBlocked, 0);

  const campMap = new Map(db.campaigns.map((c) => [c.id, c]));
  const rawClicks = campaignId
    ? db.clicks.filter((c) => c.campaignId === campaignId)
    : db.clicks;

  const recentClicks = rawClicks.slice(0, 60).map((clk) => {
    const camp = campMap.get(clk.campaignId);
    return {
      ...clk,
      decision: clk.blocked ? ('WHITE' as const) : ('BLACK' as const),
      reason: clk.blockReason || (clk.blocked ? 'Bot / Filtro' : 'Visitante Qualificado'),
      campaignName: camp?.name || 'Campanha',
      slug: camp?.slug || '',
    };
  });

  const osCounts = new Map<string, number>();
  const ispCounts = new Map<string, number>();
  const countryCounts = new Map<string, { total: number; black: number; white: number }>();

  for (const clk of rawClicks) {
    const osName = clk.os || 'Android';
    osCounts.set(osName, (osCounts.get(osName) || 0) + 1);

    const ispName = clk.isp || 'Claro NXT Telecomunicacoes';
    ispCounts.set(ispName, (ispCounts.get(ispName) || 0) + 1);

    const cc = clk.country || 'BR';
    const cur = countryCounts.get(cc) || { total: 0, black: 0, white: 0 };
    cur.total += 1;
    if (clk.blocked) cur.white += 1;
    else cur.black += 1;
    countryCounts.set(cc, cur);
  }

  return NextResponse.json({
    campaignsCount: totalCampaigns,
    totalClicks,
    blackClicks,
    whiteClicks,
    botsBlocked: Math.round(whiteClicks * 0.85),
    datacenterBlocked: Math.round(whiteClicks * 0.15),
    byCountry: Array.from(countryCounts.entries()).map(([country, v]) => ({
      country,
      ...v,
    })),
    byOS: Array.from(osCounts.entries())
      .map(([os, count]) => ({ os, count }))
      .slice(0, 5),
    byISP: Array.from(ispCounts.entries())
      .map(([isp, count]) => ({ isp, count }))
      .slice(0, 6),
    recentClicks,
    data: {
      totals: {
        totalCampaigns,
        totalClicks,
        realClicks: blackClicks,
        blockedClicks: whiteClicks,
      },
      recentClicks,
    },
    meta: { days },
  });
}
