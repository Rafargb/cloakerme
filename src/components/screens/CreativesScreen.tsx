'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useLocale } from '@/context/LocaleContext';
import { Button, Card, ConfirmModal } from '@/components/ui/Primitives';
import {
  Upload,
  Film,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface CreativeItem {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  type: 'video' | 'image';
  mimeType: string;
  url: string;
  size: number;
  sha256?: string;
  options?: Record<string, unknown>;
  createdAt: string;
}

const OPTION_KEYS = [
  'noise_start',
  'noise_end',
  'overlay',
  'flashes',
  'color_shift',
  'audio_cloak',
  'distractor_overlay',
  'audio_replace',
  'micro_crop',
  'speed_shift',
  'flip_h',
  'tiktok',
] as const;

export function CreativesScreen() {
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const distractorInputRef = useRef<HTMLInputElement>(null);

  const [protection, setProtection] = useState<'basic' | 'white_overlay' | 'advanced'>('basic');
  const [intensity, setIntensity] = useState<number>(5);
  const [options, setOptions] = useState<Record<string, boolean>>({
    noise_start: true,
    noise_end: true,
    overlay: true,
    flashes: false,
    color_shift: true,
    audio_cloak: true,
    distractor_overlay: false,
    audio_replace: false,
    micro_crop: true,
    speed_shift: true,
    flip_h: false,
    tiktok: false,
  });

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deleteTarget, setDeleteTarget] = useState<CreativeItem | null>(null);

  // Fetch Creatives
  const { data: creatives = [], isLoading } = useQuery<CreativeItem[]>({
    queryKey: ['creatives'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/creatives');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  // Fetch Distractor Status
  const { data: distractorStatus } = useQuery<{ configured: boolean; url: string | null }>({
    queryKey: ['creatives-distractor'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/creatives/distractor');
      return data;
    },
  });

  // Upload Creative Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('intensity', String(intensity));
      formData.append('protection', protection);
      for (const key of OPTION_KEYS) {
        formData.append(key, options[key] ? 'true' : 'false');
      }

      setUploadProgress(5);
      const { data } = await axios.post('/api/v1/creatives', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.min(95, Math.round((evt.loaded * 100) / evt.total));
            setUploadProgress(pct);
          }
        },
      });
      setUploadProgress(100);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      toast.success(t('creatives.toastProcessed'));
      setTimeout(() => setUploadProgress(0), 600);
    },
    onError: (err: unknown) => {
      setUploadProgress(0);
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : t('creatives.errUpload');
      toast.error(msg);
    },
  });

  // Upload Distractor Image Mutation
  const distractorMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/api/v1/creatives/distractor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives-distractor'] });
      toast.success(t('creatives.toastDistractorOk'));
    },
    onError: () => {
      toast.error(t('creatives.errDistractor'));
    },
  });

  // Delete Creative Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/creatives/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
      setDeleteTarget(null);
      toast.success(t('creatives.toastDeleted'));
    },
    onError: () => {
      toast.error(t('creatives.errDelete'));
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    e.target.value = '';
  };

  const handleDistractorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    distractorMutation.mutate(file);
    e.target.value = '';
  };

  const toggleOption = (key: string) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownload = async (item: CreativeItem) => {
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = item.originalName || item.name || `creative-${item.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error(t('creatives.errDownload'));
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const optionLabels: Record<string, { label: string; desc: string }> = {
    noise_start: { label: t('creatives.opt.noise_start.label'), desc: t('creatives.opt.noise_start.desc') },
    noise_end: { label: t('creatives.opt.noise_end.label'), desc: t('creatives.opt.noise_end.desc') },
    overlay: { label: t('creatives.opt.overlay.label'), desc: t('creatives.opt.overlay.desc') },
    flashes: { label: t('creatives.opt.flashes.label'), desc: t('creatives.opt.flashes.desc') },
    color_shift: { label: t('creatives.opt.color_shift.label'), desc: t('creatives.opt.color_shift.desc') },
    audio_cloak: { label: t('creatives.opt.audio_cloak.label'), desc: t('creatives.opt.audio_cloak.desc') },
    distractor_overlay: {
      label: t('creatives.opt.distractor_overlay.label'),
      desc: t('creatives.opt.distractor_overlay.desc'),
    },
    audio_replace: {
      label: t('creatives.opt.audio_replace.label'),
      desc: t('creatives.opt.audio_replace.desc'),
    },
    micro_crop: { label: t('creatives.opt.micro_crop.label'), desc: t('creatives.opt.micro_crop.desc') },
    speed_shift: { label: t('creatives.opt.speed_shift.label'), desc: t('creatives.opt.speed_shift.desc') },
    flip_h: { label: t('creatives.opt.flip_h.label'), desc: t('creatives.opt.flip_h.desc') },
    tiktok: { label: t('creatives.opt.tiktok.label'), desc: t('creatives.opt.tiktok.desc') },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('creatives.title')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('creatives.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            <span>
              {uploadMutation.isPending ? t('creatives.processing') : t('creatives.uploadFile')}
            </span>
          </Button>
        </div>
      </div>

      {/* 2-Column Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Processamento */}
        <Card title={t('creatives.cardProcessing')}>
          <div className="space-y-4">
            {/* Protection Mode Select */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                {t('creatives.protectionLabel')}
              </label>
              <select
                value={protection}
                onChange={(e) => setProtection(e.target.value as 'basic' | 'white_overlay' | 'advanced')}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:border-[#f97316]/50"
              >
                <option value="basic">{t('creatives.protBasic')}</option>
                <option value="white_overlay">{t('creatives.protWhite')}</option>
                <option value="advanced">{t('creatives.protAdvanced')}</option>
              </select>
              <p className="text-xs text-zinc-500 mt-1">{t('creatives.protectionHint')}</p>
            </div>

            {/* Intensity Slider */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                {t('creatives.intensityLabel', { n: intensity })}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-[#f97316] cursor-pointer"
              />
              <p className="text-xs text-zinc-500 mt-1">{t('creatives.intensityHint')}</p>
            </div>

            {/* Processing Engine Info Box */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400 space-y-1">
              <p className="text-zinc-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#f97316]" />
                {t('creatives.engineTitle')}
              </p>
              <p>{t('creatives.engineBody')}</p>
            </div>

            {/* 12 Processing Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
              {OPTION_KEYS.map((key) => {
                const info = optionLabels[key];
                return (
                  <label
                    key={key}
                    className="flex items-start gap-2 cursor-pointer text-sm p-1.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(options[key])}
                      onChange={() => toggleOption(key)}
                      className="mt-1 rounded border-white/20 bg-[#141414] text-[#f97316] focus:ring-[#f97316]/30 accent-[#f97316]"
                    />
                    <span>
                      <span className="text-zinc-300">{info.label}</span>
                      <span className="block text-xs text-zinc-500">{info.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Card 2: Imagem Distratora */}
        <Card title={t('creatives.cardDistractor')}>
          <p className="text-xs text-zinc-500 mb-3">
            {t('creatives.distractorIntroBefore')}
            <strong className="text-zinc-400">{t('creatives.distractorIntroStrong')}</strong>
            {t('creatives.distractorIntroAfter')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={distractorInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleDistractorChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={distractorMutation.isPending}
              onClick={() => distractorInputRef.current?.click()}
            >
              {distractorMutation.isPending
                ? t('creatives.distractorSending')
                : distractorStatus?.configured
                ? t('creatives.distractorChange')
                : t('creatives.distractorSend')}
            </Button>
            {distractorStatus?.configured && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('creatives.distractorConfigured')}
              </span>
            )}
          </div>

          {distractorStatus?.configured && distractorStatus.url && (
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#0e0e0e] p-3">
              <p className="text-[11px] font-medium text-zinc-400 mb-2">Preview da imagem distratora ativa:</p>
              <img
                src={distractorStatus.url}
                alt="Distractor"
                className="h-36 w-auto rounded-lg object-cover border border-white/[0.06]"
              />
            </div>
          )}

          {/* Extra Local Engine Status Box */}
          <div className="mt-6 rounded-xl border border-[#f97316]/20 bg-gradient-to-br from-[#f97316]/[0.06] to-transparent p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-300">
                <Sparkles className="h-3.5 w-3.5 text-[#f97316]" />
                FFmpeg Local Engine (Hash & Metadata Buster)
              </span>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                ONLINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Todos os vídeos e imagens enviados passam pelo pipeline local FFmpeg com remoção total de metadados
              (`-map_metadata -1`), recodificação H.264/AAC, modulação de cor/velocidade/crop e geração de hash
              SHA-256 exclusivo a cada execução.
            </p>
          </div>
        </Card>
      </div>

      {/* Upload Progress Bar */}
      {uploadMutation.isPending && (
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-[#f97316] transition-all duration-300"
            style={{ width: `${uploadProgress || 50}%` }}
          />
        </div>
      )}

      {/* Creatives Grid / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-zinc-800/40 animate-pulse" />
          ))}
        </div>
      ) : creatives.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-zinc-500">
            <p className="font-medium text-zinc-400 mb-1">{t('creatives.emptyTitle')}</p>
            <p className="text-sm mb-4">{t('creatives.emptyDesc')}</p>
            <Button onClick={() => fileInputRef.current?.click()}>{t('creatives.sendFirst')}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {creatives.map((item) => (
            <Card key={item.id} className="overflow-hidden p-0">
              <div className="aspect-video bg-[#0c0c0c] relative flex items-center justify-center overflow-hidden">
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-contain max-h-48"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-contain max-h-48"
                  />
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-black/75 text-zinc-300 border border-white/10 inline-flex items-center gap-1">
                  {item.type === 'video' ? (
                    <>
                      <Film className="h-3 w-3 text-[#f97316]" />
                      {t('creatives.badgeVideo')}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3 w-3 text-[#f97316]" />
                      {t('creatives.badgeImage')}
                    </>
                  )}
                </span>
              </div>
              <div className="p-3">
                <p className="font-medium text-zinc-200 truncate text-sm" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-zinc-500">{formatDate(item.createdAt)}</p>
                  {item.sha256 && (
                    <span
                      className="font-mono text-[10px] text-zinc-500 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.06]"
                      title={`SHA-256: ${item.sha256}`}
                    >
                      #{item.sha256.slice(0, 8)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#f97316] hover:text-orange-300 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t('creatives.open')}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="text-xs text-[#f97316] hover:text-orange-300 inline-flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    {t('creatives.download')}
                  </button>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => setDeleteTarget(item)}
                    className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t('creatives.delete')}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t('creatives.deleteModalTitle')}
        description={
          deleteTarget
            ? t('creatives.deleteModalDesc', { name: deleteTarget.name })
            : ''
        }
        confirmLabel={t('creatives.deleteConfirm')}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
