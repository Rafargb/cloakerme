'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useLocale } from '@/context/LocaleContext';
import { Button, Card, Input, Modal, ConfirmModal } from '@/components/ui/Primitives';

interface PageItem {
  id: string;
  name: string;
  type: 'WHITE' | 'BLACK';
  url?: string;
}

interface DomainItem {
  id: string;
  hostname: string;
  status: string;
}

interface CampaignVariant {
  pageId: string;
  weight: number;
}

interface CampaignItem {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'PAUSED';
  adPlatform: string | null;
  whitePageId: string;
  blackPageId: string | null;
  blackVariants?: CampaignVariant[];
  customDomainId: string | null;
  platformDomainId: string | null;
  allowedCountries: string[];
  blockedCountries: string[];
  allowedLanguages: string[];
  blockedLanguages: string[];
  allowedOS: string[];
  deviceFilter: 'ALL' | 'MOBILE' | 'DESKTOP';
  blockBots: boolean;
  blockDatacenter: boolean;
  allowedIPs: string[];
  blockedIPs: string[];
  requiredUrlTokens: string[];
  blockedUrlTokens: string[];
  warmupClicks: number;
  whiteUntilHour: number | null;
  displayMode: 'IFRAME' | 'REDIRECT';
  createdAt: string;
  whitePage?: PageItem | null;
  blackPage?: PageItem | null;
  customDomain?: DomainItem | null;
  platformDomain?: DomainItem | null;
  _count?: { clicks: number };
}

function mergeUtmTemplate(baseUrl: string, queryText: string): string {
  const trimmed = queryText.trim().replace(/^\?+/, '');
  if (!trimmed) return baseUrl;
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}${trimmed}`;
}

export function CampaignsScreen() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [deployTarget, setDeployTarget] = useState<CampaignItem | null>(null);
  const [utmQuery, setUtmQuery] = useState('utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}');
  const [deleteTarget, setDeleteTarget] = useState<CampaignItem | null>(null);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CampaignItem | null>(null);
  const [step, setStep] = useState<number>(0);

  // Form Fields
  const [name, setName] = useState('');
  const [adPlatform, setAdPlatform] = useState('');
  const [whitePageId, setWhitePageId] = useState('');
  const [useAbTest, setUseAbTest] = useState(false);
  const [blackPageId, setBlackPageId] = useState('');
  const [blackVariants, setBlackVariants] = useState<CampaignVariant[]>([{ pageId: '', weight: 100 }]);
  const [domainChoice, setDomainChoice] = useState('');
  const [displayMode, setDisplayMode] = useState<'IFRAME' | 'REDIRECT'>('REDIRECT');
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'MOBILE' | 'DESKTOP'>('ALL');
  const [blockBots, setBlockBots] = useState(true);
  const [blockDatacenter, setBlockDatacenter] = useState(true);
  const [allowedCountriesStr, setAllowedCountriesStr] = useState('');
  const [blockedCountriesStr, setBlockedCountriesStr] = useState('');
  const [allowedLanguagesStr, setAllowedLanguagesStr] = useState('');
  const [blockedLanguagesStr, setBlockedLanguagesStr] = useState('');
  const [allowedOSStr, setAllowedOSStr] = useState('');
  const [allowedIPsStr, setAllowedIPsStr] = useState('');
  const [blockedIPsStr, setBlockedIPsStr] = useState('');
  const [requiredTokensStr, setRequiredTokensStr] = useState('');
  const [blockedTokensStr, setBlockedTokensStr] = useState('');
  const [warmupClicks, setWarmupClicks] = useState<number>(0);
  const [whiteUntilHour, setWhiteUntilHour] = useState<string>('');

  const { data: campaigns = [], isLoading } = useQuery<CampaignItem[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/campaigns');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const { data: pages = [] } = useQuery<PageItem[]>({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/pages');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const { data: customDomains = [] } = useQuery<DomainItem[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/domains');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const { data: platformDomains = [] } = useQuery<DomainItem[]>({
    queryKey: ['platform-domains'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/platform-domains');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const whitePages = pages.filter((p) => p.type === 'WHITE');
  const blackPages = pages.filter((p) => p.type === 'BLACK');

  const getOrigin = () => (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  const getTrackUrl = (c: CampaignItem) => `${getOrigin()}/api/v1/track/${c.slug}`;
  const getRealUrl = (c: CampaignItem) => `${getOrigin()}/api/v1/track-real/${c.slug}`;
  const getWhiteUrl = (c: CampaignItem) => `${getOrigin()}/api/v1/track-white/${c.slug}`;

  const openCreateModal = () => {
    setEditTarget(null);
    setStep(0);
    setName('');
    setAdPlatform('meta');
    setWhitePageId(whitePages[0]?.id || '');
    setUseAbTest(false);
    setBlackPageId(blackPages[0]?.id || '');
    setBlackVariants([
      { pageId: blackPages[0]?.id || '', weight: 50 },
      { pageId: blackPages[1]?.id || blackPages[0]?.id || '', weight: 50 },
    ]);
    setDomainChoice('');
    setDisplayMode('REDIRECT');
    setDeviceFilter('ALL');
    setBlockBots(true);
    setBlockDatacenter(true);
    setAllowedCountriesStr('BR');
    setBlockedCountriesStr('');
    setAllowedLanguagesStr('');
    setBlockedLanguagesStr('');
    setAllowedOSStr('');
    setAllowedIPsStr('');
    setBlockedIPsStr('');
    setRequiredTokensStr('');
    setBlockedTokensStr('');
    setWarmupClicks(0);
    setWhiteUntilHour('');
    setModalOpen(true);
  };

  const openEditModal = (c: CampaignItem) => {
    setEditTarget(c);
    setStep(0);
    setName(c.name);
    setAdPlatform(c.adPlatform || '');
    setWhitePageId(c.whitePageId);
    const hasVariants = Array.isArray(c.blackVariants) && c.blackVariants.length > 0;
    setUseAbTest(hasVariants);
    setBlackPageId(c.blackPageId || blackPages[0]?.id || '');
    setBlackVariants(
      hasVariants
        ? c.blackVariants!
        : [
            { pageId: c.blackPageId || blackPages[0]?.id || '', weight: 50 },
            { pageId: blackPages[0]?.id || '', weight: 50 },
          ]
    );
    if (c.customDomainId) setDomainChoice(`custom:${c.customDomainId}`);
    else if (c.platformDomainId) setDomainChoice(`platform:${c.platformDomainId}`);
    else setDomainChoice('');
    setDisplayMode(c.displayMode || 'REDIRECT');
    setDeviceFilter(c.deviceFilter || 'ALL');
    setBlockBots(c.blockBots ?? true);
    setBlockDatacenter(c.blockDatacenter ?? true);
    setAllowedCountriesStr((c.allowedCountries || []).join(', '));
    setBlockedCountriesStr((c.blockedCountries || []).join(', '));
    setAllowedLanguagesStr((c.allowedLanguages || []).join(', '));
    setBlockedLanguagesStr((c.blockedLanguages || []).join(', '));
    setAllowedOSStr((c.allowedOS || []).join(', '));
    setAllowedIPsStr((c.allowedIPs || []).join(', '));
    setBlockedIPsStr((c.blockedIPs || []).join(', '));
    setRequiredTokensStr((c.requiredUrlTokens || []).join(', '));
    setBlockedTokensStr((c.blockedUrlTokens || []).join(', '));
    setWarmupClicks(c.warmupClicks || 0);
    setWhiteUntilHour(c.whiteUntilHour != null ? String(c.whiteUntilHour) : '');
    setModalOpen(true);
  };

  const splitList = (str: string) =>
    str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const customDomainId = domainChoice.startsWith('custom:') ? domainChoice.slice(7) : null;
      const platformDomainId = domainChoice.startsWith('platform:') ? domainChoice.slice(9) : null;
      const payload = {
        name: name.trim(),
        adPlatform: adPlatform || null,
        whitePageId,
        blackPageId: useAbTest ? null : blackPageId,
        blackVariants: useAbTest ? blackVariants.filter((v) => v.pageId && v.weight > 0) : [],
        customDomainId,
        platformDomainId,
        displayMode,
        deviceFilter,
        blockBots,
        blockDatacenter,
        allowedCountries: splitList(allowedCountriesStr).map((c) => c.toUpperCase()),
        blockedCountries: splitList(blockedCountriesStr).map((c) => c.toUpperCase()),
        allowedLanguages: splitList(allowedLanguagesStr).map((l) => l.toLowerCase()),
        blockedLanguages: splitList(blockedLanguagesStr).map((l) => l.toLowerCase()),
        allowedOS: splitList(allowedOSStr),
        allowedIPs: splitList(allowedIPsStr),
        blockedIPs: splitList(blockedIPsStr),
        requiredUrlTokens: splitList(requiredTokensStr),
        blockedUrlTokens: splitList(blockedTokensStr),
        warmupClicks: Number(warmupClicks) || 0,
        whiteUntilHour: whiteUntilHour !== '' ? Number(whiteUntilHour) : null,
      };

      if (editTarget) {
        const { data } = await axios.patch(`/api/v1/campaigns/${editTarget.id}`, payload);
        return data;
      } else {
        const { data } = await axios.post('/api/v1/campaigns', payload);
        return data;
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setModalOpen(false);
      toast.success(editTarget ? t('campaigns.updated') : t('campaigns.created'));
      if (!editTarget && saved) {
        setDeployTarget(saved);
      }
    },
    onError: () => {
      toast.error(editTarget ? t('campaigns.errUpdate') : t('campaigns.errCreate'));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (c: CampaignItem) => {
      const nextStatus = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await axios.patch(`/api/v1/campaigns/${c.id}`, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('campaigns.statusUpdated'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeleteTarget(null);
      toast.success(t('campaigns.deleted'));
    },
  });

  const copyText = (value: string, msg: string) => {
    navigator.clipboard.writeText(value);
    toast.success(msg);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('campaigns.title')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('campaigns.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal}>{t('campaigns.new')}</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-800/40 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-zinc-500">
            <p className="font-medium text-zinc-400 mb-1">{t('campaigns.emptyTitle')}</p>
            <p className="text-sm mb-4">{t('campaigns.emptyDesc')}</p>
            <Button onClick={openCreateModal}>{t('campaigns.createFirst')}</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const trackUrl = getTrackUrl(c);
            return (
              <Card key={c.id} className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{c.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? t('campaigns.active') : t('campaigns.paused')}
                      </span>
                      {c.adPlatform && (
                        <span className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-zinc-400 uppercase">
                          {c.adPlatform}
                        </span>
                      )}
                      {c.customDomain && (
                        <span className="px-2 py-0.5 rounded-md text-xs bg-[#f97316]/15 text-orange-300 border border-[#f97316]/30">
                          {c.customDomain.hostname}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {t('campaigns.whiteLabel')}: {c.whitePage?.name ?? '—'} ·{' '}
                      {c.blackVariants && c.blackVariants.length > 0
                        ? t('campaigns.abLabel', { count: c.blackVariants.length })
                        : `${t('campaigns.blackLabel')}: ${c.blackPage?.name ?? '—'}`}{' '}
                      · {t('campaigns.clicksCount', { count: c._count?.clicks ?? 0 })}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1 font-mono break-all">{trackUrl}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyText(trackUrl, t('campaigns.toastTrackCopied'))}
                    >
                      {t('campaigns.copyTrackUrl')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setDeployTarget(c)}>
                      {t('campaigns.fullDeploy')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(getRealUrl(c), t('campaigns.toastRealCopied'))}
                    >
                      {t('campaigns.copyReal')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(getWhiteUrl(c), t('campaigns.toastWhiteCopied'))}
                    >
                      {t('campaigns.copyWhite')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(c)}>
                      {t('campaigns.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate(c)}
                    >
                      {c.status === 'ACTIVE' ? t('campaigns.pause') : t('campaigns.activate')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(c)}>
                      {t('campaigns.delete')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Deploy Instructions Modal */}
      {deployTarget && (
        <Modal
          open={Boolean(deployTarget)}
          onClose={() => setDeployTarget(null)}
          title={t('campaigns.deployModalTitle', { name: deployTarget.name })}
          size="xl"
        >
          <div className="space-y-5 text-sm">
            <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/[0.07] p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                {t('campaigns.step1Badge')}
              </p>
              <p className="font-medium text-white">{t('campaigns.step1Title')}</p>
              <p className="text-zinc-400 text-xs leading-relaxed">{t('campaigns.step1Body')}</p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <code className="flex-1 rounded-lg bg-black/50 px-3 py-2 text-xs text-orange-200 font-mono break-all border border-white/[0.08]">
                  {getTrackUrl(deployTarget)}
                </code>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    copyText(getTrackUrl(deployTarget), t('campaigns.toastDeployTrack'))
                  }
                >
                  {t('campaigns.copyTrackLink')}
                </Button>
              </div>
            </div>

            {/* UTMify Builder */}
            <div className="rounded-lg border border-orange-500/25 bg-orange-950/15 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-300/90">
                {t('campaigns.utmBadge')}
              </p>
              <p className="font-medium text-white">{t('campaigns.utmTitle')}</p>
              <p className="text-zinc-400 text-xs leading-relaxed">{t('campaigns.utmIntro')}</p>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  {t('campaigns.utmPasteLabel')}
                </label>
                <textarea
                  value={utmQuery}
                  onChange={(e) => setUtmQuery(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-[#141414] border border-white/[0.08] px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#f97316]/50"
                />
              </div>
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-medium text-zinc-300">
                  {t('campaigns.utmResultLabel')}
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <code className="flex-1 rounded-lg bg-black/60 px-3 py-2 text-xs text-amber-200/95 font-mono break-all border border-orange-500/20">
                    {mergeUtmTemplate(getTrackUrl(deployTarget), utmQuery)}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      copyText(
                        mergeUtmTemplate(getTrackUrl(deployTarget), utmQuery),
                        t('campaigns.toastUtmCopied')
                      )
                    }
                  >
                    {t('campaigns.copyFullUrl')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.06]">
              <Button variant="secondary" onClick={() => setDeployTarget(null)}>
                {t('campaigns.understoodClose')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Campaign Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? t('campaigns.editModalTitle') : t('campaigns.createModalTitle')}
        size="lg"
      >
        <div className="space-y-5">
          {/* Step Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06]">
            {[
              { idx: 0, title: t('campaigns.step0Title'), desc: t('campaigns.step0Desc') },
              { idx: 1, title: t('campaigns.step1WizardTitle'), desc: t('campaigns.step1WizardDesc') },
              { idx: 2, title: t('campaigns.step2Title'), desc: t('campaigns.step2Desc') },
              { idx: 3, title: t('campaigns.step3Title'), desc: t('campaigns.step3Desc') },
            ].map((s) => (
              <button
                key={s.idx}
                type="button"
                onClick={() => setStep(s.idx)}
                className={`rounded-lg px-2.5 py-2 text-left transition-all ${
                  step === s.idx
                    ? 'bg-[#f97316]/15 border border-[#f97316]/40 text-white'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                <span className="block text-[10px] font-mono uppercase text-zinc-500">
                  {t('campaigns.stepBadge', { n: s.idx + 1 })}
                </span>
                <span className="block text-xs font-semibold truncate">{s.title}</span>
              </button>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <Input
                label={t('campaigns.nameLabel')}
                placeholder={t('campaigns.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  {t('campaigns.adPlatformLabel')}
                </label>
                <select
                  value={adPlatform}
                  onChange={(e) => setAdPlatform(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
                >
                  <option value="">{t('campaigns.adPlatformNone')}</option>
                  <option value="meta">{t('campaigns.adMeta')}</option>
                  <option value="tiktok">{t('campaigns.adTiktok')}</option>
                  <option value="google">{t('campaigns.adGoogle')}</option>
                  <option value="kwai">{t('campaigns.adKwai')}</option>
                  <option value="other">{t('campaigns.adOther')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  {t('campaigns.domainLinkLabel')}
                </label>
                <select
                  value={domainChoice}
                  onChange={(e) => setDomainChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
                >
                  <option value="">{t('campaigns.domainDefaultOption')}</option>
                  {platformDomains.length > 0 && (
                    <optgroup label={t('campaigns.optgroupCloakby')}>
                      {platformDomains.map((d) => (
                        <option key={d.id} value={`platform:${d.id}`}>
                          {d.hostname}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {customDomains.length > 0 && (
                    <optgroup label={t('campaigns.optgroupCustom')}>
                      {customDomains.map((d) => (
                        <option key={d.id} value={`custom:${d.id}`}>
                          {d.hostname}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  {t('campaigns.whiteSelectLabel')}
                </label>
                <select
                  value={whitePageId}
                  onChange={(e) => setWhitePageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
                >
                  <option value="">{t('campaigns.selectPlaceholder')}</option>
                  {whitePages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.url || 'HTML'})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAbTest}
                  onChange={(e) => setUseAbTest(e.target.checked)}
                  className="rounded accent-[#f97316]"
                />
                <span>{t('campaigns.useAbLabel')}</span>
              </label>

              {!useAbTest ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    {t('campaigns.blackSelectLabel')}
                  </label>
                  <select
                    value={blackPageId}
                    onChange={(e) => setBlackPageId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
                  >
                    <option value="">{t('campaigns.selectPlaceholder')}</option>
                    {blackPages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.url || 'HTML'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 rounded-lg border border-white/[0.08] p-3">
                  {blackVariants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={v.pageId}
                        onChange={(e) => {
                          const next = [...blackVariants];
                          next[idx] = { ...next[idx], pageId: e.target.value };
                          setBlackVariants(next);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-sm text-zinc-100"
                      >
                        <option value="">{t('campaigns.blackPageOption')}</option>
                        {blackPages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={v.weight}
                        onChange={(e) => {
                          const next = [...blackVariants];
                          next[idx] = { ...next[idx], weight: Number(e.target.value) };
                          setBlackVariants(next);
                        }}
                        className="w-20 px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-sm text-zinc-100"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  {t('campaigns.displayModeLabel')}
                </label>
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value as 'IFRAME' | 'REDIRECT')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
                >
                  <option value="REDIRECT">{t('campaigns.displayRedirect')}</option>
                  <option value="IFRAME">{t('campaigns.displayIframe')}</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('campaigns.allowedCountriesLabel')}
                  placeholder="BR, US, PT"
                  value={allowedCountriesStr}
                  onChange={(e) => setAllowedCountriesStr(e.target.value)}
                />
                <Input
                  label={t('campaigns.blockedCountriesLabel')}
                  placeholder="CN, RU"
                  value={blockedCountriesStr}
                  onChange={(e) => setBlockedCountriesStr(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('campaigns.allowedLangLabel')}
                  placeholder="pt, en"
                  value={allowedLanguagesStr}
                  onChange={(e) => setAllowedLanguagesStr(e.target.value)}
                />
                <Input
                  label={t('campaigns.allowedOsLabel')}
                  placeholder="Android, iOS"
                  value={allowedOSStr}
                  onChange={(e) => setAllowedOSStr(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  {t('campaigns.deviceLabel')}
                </label>
                <select
                  value={deviceFilter}
                  onChange={(e) => setDeviceFilter(e.target.value as 'ALL' | 'MOBILE' | 'DESKTOP')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
                >
                  <option value="ALL">{t('campaigns.deviceAll')}</option>
                  <option value="MOBILE">{t('campaigns.deviceMobile')}</option>
                  <option value="DESKTOP">{t('campaigns.deviceDesktop')}</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockBots}
                    onChange={(e) => setBlockBots(e.target.checked)}
                    className="rounded accent-[#f97316]"
                  />
                  <span>{t('campaigns.blockBotsLabel')}</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockDatacenter}
                    onChange={(e) => setBlockDatacenter(e.target.checked)}
                    className="rounded accent-[#f97316]"
                  />
                  <span>{t('campaigns.blockDcLabel')}</span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('campaigns.allowedIpsLabel')}
                  placeholder="177.55.12.1"
                  value={allowedIPsStr}
                  onChange={(e) => setAllowedIPsStr(e.target.value)}
                />
                <Input
                  label={t('campaigns.blockedIpsLabel')}
                  placeholder="66.220.144.0"
                  value={blockedIPsStr}
                  onChange={(e) => setBlockedIPsStr(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('campaigns.requiredTokensLabel')}
                  placeholder="fbclid, utm_source"
                  value={requiredTokensStr}
                  onChange={(e) => setRequiredTokensStr(e.target.value)}
                />
                <Input
                  label={t('campaigns.blockedTokensLabel')}
                  placeholder="debug, preview"
                  value={blockedTokensStr}
                  onChange={(e) => setBlockedTokensStr(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('campaigns.warmupLabel')}
                  type="number"
                  value={warmupClicks}
                  onChange={(e) => setWarmupClicks(Number(e.target.value))}
                />
                <Input
                  label={t('campaigns.whiteUntilLabel')}
                  type="number"
                  placeholder="Ex: 8"
                  value={whiteUntilHour}
                  onChange={(e) => setWhiteUntilHour(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <div>
              {step > 0 && (
                <Button variant="secondary" type="button" onClick={() => setStep(step - 1)}>
                  {t('campaigns.wizardBack')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={() => setStep(step + 1)}>
                  {t('campaigns.wizardContinue')}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={saveMutation.isPending || !name.trim() || !whitePageId}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending
                    ? t('campaigns.saving')
                    : editTarget
                    ? t('campaigns.saveChanges')
                    : t('campaigns.createSubmit')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t('campaigns.deleteModalTitle')}
        description={
          deleteTarget ? t('campaigns.deleteModalDesc', { name: deleteTarget.name }) : ''
        }
        confirmLabel={t('campaigns.deleteConfirm')}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
