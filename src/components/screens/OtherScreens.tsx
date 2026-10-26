'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input, ConfirmModal } from '@/components/ui/Primitives';
import {
  Globe,
  CheckCircle2,
  CreditCard,
  BookOpen,
  Video,
  Share2,
  Trophy,
  RotateCcw,
  Settings,
  Users,
  Activity,
  Server,
} from 'lucide-react';

// ============================================================================
// 1. Domains Screen (/dashboard/dominios)
// ============================================================================
export function DomainsScreen() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [hostname, setHostname] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; hostname: string } | null>(null);

  const { data: domains = [], isLoading } = useQuery<
    Array<{
      id: string;
      hostname: string;
      status: string;
      cnameTarget: string;
      verifiedAt: string | null;
      lastError: string | null;
      createdAt: string;
    }>
  >({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/domains');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/api/v1/domains', { hostname: hostname.trim() });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setHostname('');
      toast.success(t('domains.toastAdded'));
    },
    onError: () => toast.error(t('domains.errAdd')),
  });

  const provisionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post(`/api/v1/domains/${id}/provision`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success(t('domains.toastVerified'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/domains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setDeleteTarget(null);
      toast.success(t('domains.toastRemoved'));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('domains.title')}</h1>
        <p className="text-zinc-500 text-sm mt-1">{t('domains.subtitle')}</p>
      </div>

      <Card title={t('domains.howTitle')}>
        <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-2 leading-relaxed">
          <li>{t('domains.how1')}</li>
          <li>{t('domains.how2')}</li>
          <li>{t('domains.how3')}</li>
        </ol>
      </Card>

      <Card title={t('domains.addCardTitle')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!hostname.trim()) return;
            createMutation.mutate();
          }}
          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
        >
          <div className="flex-1">
            <Input
              label={t('domains.hostnameLabel')}
              placeholder={t('domains.hostnamePh')}
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('domains.saving') : t('domains.addBtn')}
          </Button>
        </form>
      </Card>

      <Card title={t('domains.yourDomains')}>
        {isLoading ? (
          <div className="h-24 rounded-lg bg-zinc-800/40 animate-pulse" />
        ) : domains.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('domains.empty')}</p>
        ) : (
          <div className="space-y-3">
            {domains.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-white/[0.08] bg-[#141414]/80 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Globe className="h-4 w-4 text-[#f97316]" />
                    <span className="font-mono text-sm font-semibold text-white break-all">
                      {d.hostname}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded border text-emerald-400 bg-emerald-500/15 border-emerald-500/30 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('domains.statusActive')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    CNAME → <code className="text-orange-200 font-mono">{d.cnameTarget}</code>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => provisionMutation.mutate(d.id)}
                  >
                    {t('domains.recheckDns')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: d.id, hostname: d.hostname })}
                  >
                    {t('domains.remove')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t('domains.removeModalTitle')}
        description={
          deleteTarget ? t('domains.removeModalDesc', { host: deleteTarget.hostname }) : ''
        }
        confirmLabel={t('domains.removeConfirm')}
        variant="danger"
      />
    </div>
  );
}

// ============================================================================
// 2. Gateway Screen (/dashboard/gateway)
// ============================================================================
export function GatewayScreen() {
  const { t } = useLocale();
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300 mb-3">
          <CreditCard className="h-3.5 w-3.5" />
          <span>{t('gateway.badge')}</span>
        </div>
        <h1 className="text-2xl font-bold text-white">{t('gateway.title')}</h1>
        <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{t('gateway.lead')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={t('gateway.featsTitle')}>
          <ul className="space-y-2.5 text-sm text-zinc-400">
            <li>• <strong className="text-zinc-200">{t('gateway.feat1Strong')}</strong>{t('gateway.feat1After')}</li>
            <li>• <strong className="text-zinc-200">{t('gateway.feat2Strong')}</strong>{t('gateway.feat2After')}</li>
            <li>• <strong className="text-zinc-200">{t('gateway.feat3Strong')}</strong>{t('gateway.feat3After')}</li>
            <li>• <strong className="text-zinc-200">{t('gateway.feat4Strong')}</strong>{t('gateway.feat4After')}</li>
          </ul>
        </Card>
        <Card title={t('gateway.feeCardTitle')}>
          <p className="text-4xl font-bold text-[#f97316] font-mono">{t('gateway.feeMain')}</p>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{t('gateway.feeSub')}</p>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// 3. Content Screen (/dashboard/tiktok & /dashboard/guia)
// ============================================================================
export function ContentScreen({ variant }: { variant: 'tiktok' | 'guia' }) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-1 text-xs font-semibold text-orange-300 mb-2">
          <BookOpen className="h-3.5 w-3.5" />
          {variant === 'tiktok' ? 'MÓDULO TIKTOK ADS' : 'MANUAL OPERACIONAL CLOAKBY'}
        </span>
        <h1 className="text-2xl font-bold text-white">
          {variant === 'tiktok'
            ? 'Guia Avançado de Contingência & Criativos no TikTok Ads'
            : 'Guia Completo de Operação Cloakby'}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Boas práticas de camuflagem de criativos, aquecimento de conta e filtragem de tráfego.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="1. Preparação dos Criativos (Hash Único)">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Sempre processe cada variação do seu vídeo na aba <strong className="text-white">Criativos</strong> antes de subir na conta de anúncios. Ative <strong className="text-orange-300">Ruído no início/fim</strong>, <strong className="text-orange-300">Micro-corte nas bordas</strong> e <strong className="text-orange-300">Camuflar áudio</strong> para garantir um hash SHA-256 inédito.
          </p>
        </Card>
        <Card title="2. Camuflagem de Copy (Homóglifos)">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Use a ferramenta <strong className="text-white">Camuflagem de texto</strong> em headlines e descrições sensíveis com intensidade entre <strong className="text-orange-300">30% e 50%</strong> para evitar bloqueios automáticos por palavras-chave.
          </p>
        </Card>
        <Card title="3. Configuração de Campanha e Aquecimento">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Configure os primeiros <strong className="text-orange-300">15 a 30 cliques</strong> no modo Aquecimento (Warmup) apontando para sua página White limpa enquanto o robô de revisão analisa o anúncio recém-publicado.
          </p>
        </Card>
        <Card title="4. Domínio Próprio & Parâmetros UTMify">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Utilize o gerador de URL integrada com UTMify na aba <strong className="text-white">Campanhas → Ver implementação completa</strong> para preservar 100% do rastreamento das vendas na página Black.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// 4. Tutorials Screen (/dashboard/tutoriais)
// ============================================================================
export function TutorialsScreen() {
  const { t } = useLocale();
  const videos = [
    { id: 1, title: t('tutoriais.v1Title'), desc: t('tutoriais.v1Desc'), duration: '06:42' },
    { id: 2, title: t('tutoriais.v2Title'), desc: t('tutoriais.v2Desc'), duration: '08:15' },
    { id: 3, title: t('tutoriais.v3Title'), desc: t('tutoriais.v3Desc'), duration: '05:30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('tutoriais.title')}</h1>
        <p className="text-zinc-500 text-sm mt-1">{t('tutoriais.lead')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((v) => (
          <Card key={v.id} className="flex flex-col justify-between gap-4">
            <div className="aspect-video rounded-lg bg-[#0c0c0c] border border-white/[0.06] flex flex-col items-center justify-center p-4 text-center">
              <Video className="h-8 w-8 text-[#f97316] mb-2" />
              <span className="text-xs font-mono text-zinc-400">Aula #{v.id} · {v.duration}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{v.title}</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{v.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 5. Affiliates Screen (/dashboard/afiliados)
// ============================================================================
export function AffiliatesScreen() {
  const { t } = useLocale();
  const { data } = useQuery({
    queryKey: ['affiliate'],
    queryFn: async () => (await axios.get('/api/v1/users/affiliate')).data,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-1 text-xs font-semibold text-orange-300 mb-2">
          <Share2 className="h-3.5 w-3.5" />
          {t('afiliados.badge')}
        </span>
        <h1 className="text-2xl font-bold text-white">{t('afiliados.title')}</h1>
        <p className="text-zinc-400 text-sm mt-1">{t('afiliados.lead')}</p>
      </div>

      <Card title={t('afiliados.linkCardTitle')}>
        <p className="text-xs text-zinc-400 mb-3">{t('afiliados.linkReadyHint')}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <code className="flex-1 rounded-lg bg-[#141414] border border-white/[0.08] px-3.5 py-2.5 text-xs font-mono text-orange-300">
            {data?.url || 'https://app.cloakbyco.com/?ref=CLOAKLOCAL'}
          </code>
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(data?.url || 'https://app.cloakbyco.com/?ref=CLOAKLOCAL');
              toast.success(t('afiliados.copied'));
            }}
          >
            {t('afiliados.copyLink')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// 6. Achievements Screen (/dashboard/conquistas)
// ============================================================================
export function AchievementsScreen() {
  const { t } = useLocale();
  const tiers = [
    { key: '10k', title: t('conquistas.tier.10k.title'), target: t('conquistas.tier.10k.target'), unlocked: true },
    { key: '50k', title: t('conquistas.tier.50k.title'), target: t('conquistas.tier.50k.target'), unlocked: true },
    { key: '100k', title: t('conquistas.tier.100k.title'), target: t('conquistas.tier.100k.target'), unlocked: true },
    { key: '500k', title: t('conquistas.tier.500k.title'), target: t('conquistas.tier.500k.target'), unlocked: true },
    { key: '1m', title: t('conquistas.tier.1m.title'), target: t('conquistas.tier.1m.target'), unlocked: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('conquistas.title')}</h1>
        <p className="text-zinc-500 text-sm mt-1">{t('conquistas.lead')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {tiers.map((tier) => (
          <Card key={tier.key} className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f97316]/15 border border-[#f97316]/30">
              <Trophy className="h-7 w-7 text-[#f97316]" />
            </div>
            <h3 className="font-semibold text-white text-sm">{tier.title}</h3>
            <p className="text-xs font-mono text-orange-300">{tier.target}</p>
            <span className="inline-block rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
              {t('conquistas.unlocked')}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 7. Refund Screen (/dashboard/reembolso)
// ============================================================================
export function RefundScreen() {
  const { t } = useLocale();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-[#f97316]" />
          {t('reembolso.title')}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">{t('reembolso.lead')}</p>
      </div>
      <Card>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Esta é a sua versão <strong className="text-white">Cloakby Local Completa</strong> rodando 100% na sua máquina com plano <strong className="text-orange-300">GLOBAL Vitalício</strong> sem cobranças ou mensalidades.
        </p>
      </Card>
    </div>
  );
}

// ============================================================================
// 8. Settings Screen (/dashboard/settings)
// ============================================================================
export function SettingsScreen() {
  const { t } = useLocale();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || 'Paulo');
  const [email, setEmail] = useState(user?.email || 'paulo@aimedialab.online');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch('/api/v1/users/me', { name, email });
      await refreshUser();
      toast.success(t('settings.profileUpdated'));
    } catch {
      toast.error(t('settings.errProfile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#f97316]" />
          {t('settings.title')}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      <Card title={t('settings.profileCard')}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('settings.name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('settings.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={saving}>
            {saving ? t('settings.saving') : t('settings.saveChanges')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// 9. Admin Screens (/dashboard/admin/*)
// ============================================================================
export function AdminUsersScreen() {
  const { t } = useLocale();
  const { data } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await axios.get('/api/v1/admin/users')).data,
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-[#f97316]" />
          {t('admin.title')}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{t('admin.subtitle')}</p>
      </div>
      <Card title={t('admin.usersCard')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-white/[0.06]">
                <th className="pb-3 pr-4">{t('admin.colEmail')}</th>
                <th className="pb-3 pr-4">{t('admin.colName')}</th>
                <th className="pb-3 pr-4">{t('admin.colPlan')}</th>
                <th className="pb-3 pr-4">{t('admin.colRole')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: { id: string; email: string; name: string; plan: string; role: string }) => (
                <tr key={u.id} className="border-b border-white/[0.04]">
                  <td className="py-3 pr-4 text-zinc-200">{u.email}</td>
                  <td className="py-3 pr-4 text-zinc-400">{u.name}</td>
                  <td className="py-3 pr-4 text-orange-300 font-semibold">{u.plan}</td>
                  <td className="py-3 pr-4 text-emerald-400">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function AdminLogsScreen() {
  const { t } = useLocale();
  const { data } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => (await axios.get('/api/v1/admin/live-logs')).data,
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-[#f97316]" />
          {t('adminLogs.title')}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{t('adminLogs.subtitle')}</p>
      </div>
      <Card title={t('adminLogs.cardTitle')}>
        <div className="space-y-2 font-mono text-xs">
          {logs.map((l: { id: string; timestamp: string; method: string; path: string; status: number; ip: string }) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg bg-[#0d0d0d] p-2.5 border border-white/[0.05]">
              <span className="text-zinc-500">{new Date(l.timestamp).toLocaleTimeString('pt-BR')}</span>
              <span className="text-orange-300 font-semibold">{l.method} {l.path}</span>
              <span className="text-emerald-400">{l.status}</span>
              <span className="text-zinc-500">{l.ip}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminDomainsScreen() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [hostname, setHostname] = useState('');

  const { data: domains = [] } = useQuery<Array<{ id: string; hostname: string; status: string }>>({
    queryKey: ['admin-domains'],
    queryFn: async () => (await axios.get('/api/v1/admin/platform-domains')).data,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/v1/admin/platform-domains', { hostname: hostname.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-domains'] });
      queryClient.invalidateQueries({ queryKey: ['platform-domains'] });
      setHostname('');
      toast.success(t('adminDom.toastAdded'));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Server className="h-6 w-6 text-[#f97316]" />
          {t('adminDom.title')}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{t('adminDom.subtitle')}</p>
      </div>

      <Card title={t('adminDom.addCard')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!hostname.trim()) return;
            addMutation.mutate();
          }}
          className="flex gap-3 items-end"
        >
          <div className="flex-1">
            <Input
              label={t('adminDom.hostLabel')}
              placeholder={t('adminDom.hostPh')}
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>
          <Button type="submit">{t('adminDom.addBtn')}</Button>
        </form>
      </Card>

      <Card title={t('adminDom.listCard')}>
        <div className="space-y-2">
          {domains.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg bg-[#141414] p-3 border border-white/[0.06]">
              <span className="font-mono text-sm text-white">{d.hostname}</span>
              <span className="text-xs text-emerald-400">{d.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
