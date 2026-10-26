'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useLocale } from '@/context/LocaleContext';
import { Button, Card } from '@/components/ui/Primitives';
import { Play, Bot } from 'lucide-react';

interface ClickLogItem {
  id: string;
  campaignId: string;
  ip: string;
  country: string;
  city: string;
  isp: string;
  userAgent: string;
  os: string;
  device: string;
  referer: string | null;
  decision: 'WHITE' | 'BLACK';
  reason: string | null;
  isBot: boolean;
  isDatacenter: boolean;
  createdAt: string;
  campaign?: { id: string; name: string; slug: string };
}

function getFlagEmoji(cc: string) {
  if (!cc || cc.length !== 2) return '🌐';
  const codePoints = cc
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function LogsScreen() {
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();

  const [campaignId, setCampaignId] = useState('');
  const [decision, setDecision] = useState('');
  const [country, setCountry] = useState('');
  const [os, setOs] = useState('');
  const [device, setDevice] = useState('');
  const [isBot, setIsBot] = useState('');
  const [isDatacenter, setIsDatacenter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: campaigns = [] } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/campaigns');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const { data, isLoading } = useQuery<{
    data: ClickLogItem[];
    total: number;
    summary: { white: number; black: number; bots: number; datacenter: number };
  }>({
    queryKey: ['clicks', campaignId, decision, country, os, device, isBot, isDatacenter, search, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 25 };
      if (campaignId) params.campaignId = campaignId;
      if (decision) params.decision = decision;
      if (country) params.country = country;
      if (os) params.os = os;
      if (device) params.device = device;
      if (isBot) params.isBot = isBot;
      if (isDatacenter) params.isDatacenter = isDatacenter;
      if (search) params.search = search;
      const res = await axios.get('/api/v1/clicks', { params });
      return res.data;
    },
  });

  const simulateClick = async (mode: 'real' | 'bot') => {
    const targetCampaign = campaigns.find((c) => c.id === campaignId) || campaigns[0];
    if (!targetCampaign) {
      toast.error('Crie uma campanha primeiro');
      return;
    }
    try {
      await fetch(`/api/v1/track/${targetCampaign.slug}?sim=${mode}`, {
        headers:
          mode === 'bot'
            ? {
                'x-forwarded-for': '66.220.149.12',
                'x-country': 'US',
              }
            : {
                'x-forwarded-for': '177.55.142.88',
                'x-country': 'BR',
              },
        redirect: 'manual',
      });
      queryClient.invalidateQueries({ queryKey: ['clicks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(
        mode === 'bot'
          ? 'Clique simulado (Bot / Revisão -> WHITE) registrado!'
          : 'Clique simulado (Visitante Real -> BLACK) registrado!'
      );
    } catch {
      queryClient.invalidateQueries({ queryKey: ['clicks'] });
    }
  };

  const resetFilters = () => {
    setCampaignId('');
    setDecision('');
    setCountry('');
    setOs('');
    setDevice('');
    setIsBot('');
    setIsDatacenter('');
    setSearch('');
    setPage(1);
  };

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('logs.title')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('logs.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => simulateClick('real')}>
            <Play className="h-3.5 w-3.5 text-emerald-400" />
            <span>Simular Visitante Real (BLACK)</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => simulateClick('bot')}>
            <Bot className="h-3.5 w-3.5 text-amber-400" />
            <span>Simular Bot Revisão (WHITE)</span>
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.campaign')}</label>
            <select
              value={campaignId}
              onChange={(e) => {
                setCampaignId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            >
              <option value="">{t('common.allFeminine')}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.decision')}</label>
            <select
              value={decision}
              onChange={(e) => {
                setDecision(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            >
              <option value="">{t('common.allFeminine')}</option>
              <option value="WHITE">WHITE</option>
              <option value="BLACK">BLACK</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.countryCode')}</label>
            <input
              type="text"
              placeholder={t('logs.countryPh')}
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.os')}</label>
            <input
              type="text"
              placeholder={t('logs.osPh')}
              value={os}
              onChange={(e) => {
                setOs(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.device')}</label>
            <select
              value={device}
              onChange={(e) => {
                setDevice(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            >
              <option value="">{t('common.allMasculine')}</option>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.bot')}</label>
            <select
              value={isBot}
              onChange={(e) => {
                setIsBot(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            >
              <option value="">{t('common.allMasculine')}</option>
              <option value="true">{t('common.yes')}</option>
              <option value="false">{t('common.no')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.datacenter')}</label>
            <select
              value={isDatacenter}
              onChange={(e) => {
                setIsDatacenter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            >
              <option value="">{t('common.allMasculine')}</option>
              <option value="true">{t('common.yes')}</option>
              <option value="false">{t('common.no')}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-500 mb-1">{t('logs.searchLabel')}</label>
            <input
              type="text"
              placeholder={t('logs.searchPh')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            />
          </div>

          <div className="flex items-end">
            <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
              {t('logs.clearFilters')}
            </Button>
          </div>
        </div>

        {/* Summary Pills */}
        {summary && (
          <div className="flex flex-wrap gap-3 mb-4 pt-3 border-t border-white/[0.06] text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-zinc-400">
              {t('logs.totalLabel')}: <strong className="text-white font-mono">{total}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25">
              WHITE: <strong className="font-mono">{summary.white}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              BLACK: <strong className="font-mono">{summary.black}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/25">
              {t('logs.botsPill')}: <strong className="font-mono">{summary.bots}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/25">
              {t('logs.dcPill')}: <strong className="font-mono">{summary.datacenter}</strong>
            </span>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="h-64 rounded-lg bg-zinc-800/40 animate-pulse" />
        ) : items.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">{t('logs.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-white/[0.06]">
                  <th className="pb-3 pr-4">{t('logs.colDate')}</th>
                  <th className="pb-3 pr-4">{t('logs.colCampaign')}</th>
                  <th className="pb-3 pr-4">{t('logs.colIp')}</th>
                  <th className="pb-3 pr-4">{t('logs.colCountryCity')}</th>
                  <th className="pb-3 pr-4">{t('logs.colIsp')}</th>
                  <th className="pb-3 pr-4">{t('logs.colOsDev')}</th>
                  <th className="pb-3 pr-4">{t('logs.colDecision')}</th>
                  <th className="pb-3 pr-4">{t('logs.colReason')}</th>
                  <th className="pb-3 pr-4">{t('logs.colBotDc')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 text-zinc-400 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300 text-xs">{log.campaign?.name ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-400 text-xs">{log.ip ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs whitespace-nowrap">
                      <span className="mr-1.5">{getFlagEmoji(log.country)}</span>
                      {[log.country, log.city].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-500 text-xs max-w-[140px] truncate">
                      {log.isp ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-400 text-xs">
                      {[log.os, log.device].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={
                          log.decision === 'BLACK'
                            ? 'text-emerald-400 font-medium text-xs'
                            : 'text-amber-400 font-medium text-xs'
                        }
                      >
                        {log.decision}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-500 text-xs">{log.reason ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      {log.isBot && <span className="text-red-400 mr-1">Bot</span>}
                      {log.isDatacenter && <span className="text-orange-400">DC</span>}
                      {!log.isBot && !log.isDatacenter && <span className="text-zinc-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
