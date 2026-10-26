'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/Primitives';
import { Globe, Activity, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';

interface StatsData {
  campaignsCount: number;
  totalClicks: number;
  whiteClicks: number;
  blackClicks: number;
  botsBlocked: number;
  datacenterBlocked: number;
  byCountry: Array<{ country: string; total: number; black: number; white: number }>;
  byOS: Array<{ os: string; count: number }>;
  byISP: Array<{ isp: string; count: number }>;
  recentClicks: Array<{
    id: string;
    ip: string;
    country: string;
    city: string;
    decision: 'WHITE' | 'BLACK';
    reason: string | null;
    createdAt: string;
    campaignName?: string;
  }>;
}

export function OverviewScreen() {
  const { locale, t } = useLocale();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const { data: campaigns = [] } = useQuery<
    Array<{ id: string; name: string; status: string }>
  >({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/campaigns');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');

  const { data: stats } = useQuery<StatsData>({
    queryKey: ['stats', selectedCampaignId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCampaignId) params.campaignId = selectedCampaignId;
      const { data } = await axios.get('/api/v1/stats', { params });
      return data;
    },
  });

  const total = stats?.totalClicks ?? 0;
  const accepted = stats?.blackClicks ?? 0;
  const filtered = stats?.whiteClicks ?? 0;
  const acceptPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const filterPct = total > 0 ? Math.round((filtered / total) * 100) : 0;

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('overview.title')}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{t('overview.subtitle')}</p>
        </div>
        <Link href="/dashboard/campaigns">
          <Button size="sm">{t('overview.newCampaign')}</Button>
        </Link>
      </div>

      {/* Active Campaign Selector Pills */}
      <div className="rounded-xl border border-white/[0.08] bg-[#101010]/90 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {t('overview.activeCampaigns')}
          </span>
          {selectedCampaignId && (
            <button
              type="button"
              onClick={() => setSelectedCampaignId('')}
              className="self-start sm:self-auto text-xs text-[#f97316] hover:text-orange-300 font-medium"
            >
              {t('overview.showAllOverview')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCampaignId('')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all border ${
              !selectedCampaignId
                ? 'bg-[#f97316]/20 text-orange-200 border-[#f97316]/50 shadow-[0_0_24px_-6px_rgba(249,115,22,0.45)]'
                : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/[0.14] hover:text-zinc-200'
            }`}
          >
            {t('overview.allSummary', { count: activeCampaigns.length })}
          </button>
          {activeCampaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCampaignId(c.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all border max-w-[220px] truncate ${
                selectedCampaignId === c.id
                  ? 'bg-[#f97316]/20 text-orange-200 border-[#f97316]/50 shadow-[0_0_24px_-6px_rgba(249,115,22,0.45)]'
                  : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/[0.14] hover:text-zinc-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Stats + Right Globe & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left Column */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {t('overview.totalRequests')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/25">
                  {t('overview.liveBadge')}
                </span>
              </div>
              <p className="text-3xl font-bold text-white font-mono mt-2 tabular-nums">
                {total.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{t('overview.recordedClicks')}</p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/[0.12] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('overview.acceptedRequests')}
              </span>
              <p className="text-3xl font-bold text-emerald-400 font-mono mt-2 tabular-nums">
                {accepted.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t('overview.realPagesPct', { pct: acceptPct })}
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/[0.1] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                {t('overview.filteredRequests')}
              </span>
              <p className="text-3xl font-bold text-amber-400 font-mono mt-2 tabular-nums">
                {filtered.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t('overview.whitePagesPct', { pct: filterPct })}
              </p>
            </div>
          </div>

          {/* Traffic Intelligence Card */}
          <div className="rounded-xl border border-white/[0.08] bg-[#101010]/90 p-5 flex-1 flex flex-col gap-5">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                {t('overview.trafficIntel')}
              </h2>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {t('overview.trafficIntelCampaignSub')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/40 border border-white/[0.06] p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {t('overview.botsDetected')}
                </p>
                <p className="text-xl font-bold text-red-400 font-mono mt-1">
                  {stats?.botsBlocked ?? 0}
                </p>
              </div>
              <div className="rounded-lg bg-black/40 border border-white/[0.06] p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {t('overview.datacenterhosting')}
                </p>
                <p className="text-xl font-bold text-orange-400 font-mono mt-1">
                  {stats?.datacenterBlocked ?? 0}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-zinc-400 mb-2">
                {t('overview.operatingSystems')}
              </p>
              <div className="space-y-2">
                {(stats?.byOS || []).map((row) => {
                  const pct = total > 0 ? Math.min(100, Math.round((row.count / total) * 100)) : 50;
                  return (
                    <div key={row.os}>
                      <div className="flex justify-between text-xs text-zinc-400 mb-0.5">
                        <span className="truncate pr-2">{row.os}</span>
                        <span className="font-mono text-zinc-300 shrink-0">{row.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto">
              <p className="text-[11px] font-medium text-zinc-400 mb-2">{t('overview.topIsps')}</p>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                {(stats?.byISP || []).map((row) => (
                  <li
                    key={row.isp}
                    className="flex justify-between gap-2 text-zinc-400 border-b border-white/[0.04] pb-1"
                  >
                    <span className="truncate text-zinc-300">{row.isp}</span>
                    <span className="font-mono text-zinc-500 shrink-0">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Radar Globe + Recent Activity */}
        <div className="xl:col-span-7 flex flex-col min-h-[480px]">
          <div className="relative flex-1 rounded-2xl border border-white/[0.09] bg-[#070708] overflow-hidden shadow-[0_0_80px_-20px_rgba(249,115,22,0.18)] flex flex-col justify-between p-6">
            {/* Radar Globe Visual Background */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-80">
              <div className="relative h-80 w-80 sm:h-96 sm:w-96 rounded-full border border-[#f97316]/25 bg-[radial-gradient(circle_at_35%_30%,rgba(249,115,22,0.22),rgba(10,10,12,0.9)_70%)] shadow-[0_0_90px_-10px_rgba(249,115,22,0.3)] flex items-center justify-center">
                <div className="absolute inset-6 rounded-full border border-dashed border-[#f97316]/20 animate-spin" style={{ animationDuration: '40s' }} />
                <div className="absolute inset-16 rounded-full border border-white/[0.06]" />
                <Globe className="h-32 w-32 text-[#f97316]/30" />
                {/* Glowing Hotspots */}
                <span className="absolute top-1/2 left-1/3 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-ping" />
                <span className="absolute top-1/2 left-1/3 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="absolute top-1/3 right-1/3 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24]" />
              </div>
            </div>

            {/* Top Overlay Info */}
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
              <div className="rounded-lg bg-black/65 backdrop-blur-md border border-white/[0.08] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/90 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {t('overview.mapOriginTitle')}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{t('overview.mapOriginHint')}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(stats?.byCountry || []).map((c) => (
                  <div
                    key={c.country}
                    className="rounded-lg bg-black/70 backdrop-blur-md border border-white/[0.08] px-3 py-1.5 text-xs flex items-center gap-2"
                  >
                    <span className="font-bold text-white">{c.country}</span>
                    <span className="text-emerald-400 font-mono">{c.black} B</span>
                    <span className="text-amber-400 font-mono">{c.white} W</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Overlay: Recent Activity */}
            <div className="relative z-10 mt-auto pt-32">
              <div className="rounded-xl bg-black/75 backdrop-blur-md border border-white/[0.1] p-3 max-h-52 overflow-y-auto">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-[#f97316]" />
                    {t('overview.recentActivity')}
                  </span>
                  <Link
                    href="/dashboard/logs"
                    className="text-[11px] text-[#f97316] hover:text-orange-300"
                  >
                    {t('overview.fullLogsLink')}
                  </Link>
                </div>

                {!stats?.recentClicks || stats.recentClicks.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">{t('overview.noClicksYet')}</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {stats.recentClicks.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-white/[0.05] last:border-0 text-zinc-300"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                            {new Date(r.createdAt).toLocaleTimeString(
                              locale === 'en' ? 'en-US' : 'pt-BR',
                              { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                            )}
                          </span>
                          <span className="truncate text-zinc-400">
                            {[r.country, r.city].filter(Boolean).join(' · ')}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[120px]">
                            {r.ip}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-zinc-500 truncate max-w-[120px]">
                            {r.campaignName}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              r.decision === 'BLACK'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                                : 'bg-amber-500/20 text-amber-200 border border-amber-500/35'
                            }`}
                          >
                            {r.decision === 'BLACK'
                              ? t('overview.badgeAccepted')
                              : t('overview.badgeFiltered')}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
