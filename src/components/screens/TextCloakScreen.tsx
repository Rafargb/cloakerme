'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useLocale } from '@/context/LocaleContext';
import { Button, Card } from '@/components/ui/Primitives';

export function TextCloakScreen() {
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [intensity, setIntensity] = useState<number>(0.4);
  const [result, setResult] = useState('');
  const [stats, setStats] = useState<{
    originalLength: number;
    cloakedLength: number;
    replacedChars: number;
    zeroWidthInserted: number;
  } | null>(null);

  const cloakMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/api/v1/text-cloak', { text, intensity });
      return data;
    },
    onSuccess: (data) => {
      setResult(data.cloaked);
      if (data.stats) setStats(data.stats);
      toast.success(t('textCloak.toastProcessed'));
    },
    onError: () => {
      toast.error(t('textCloak.errProcess'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error(t('textCloak.errEmpty'));
      return;
    }
    cloakMutation.mutate();
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success(t('textCloak.copied'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('textCloak.title')}</h1>
        <p className="text-zinc-500 text-sm mt-1">{t('textCloak.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('textCloak.cardInput')}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('textCloak.placeholder')}
              rows={8}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]/50 resize-y"
            />
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                {t('textCloak.intensity', { pct: Math.round(intensity * 100) })}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-[#f97316] cursor-pointer"
              />
              <p className="text-xs text-zinc-500 mt-1">{t('textCloak.intensityHint')}</p>
            </div>
            <Button type="submit" disabled={cloakMutation.isPending || !text.trim()}>
              {cloakMutation.isPending ? t('textCloak.processing') : t('textCloak.submit')}
            </Button>
          </form>
        </Card>

        <Card title={t('textCloak.cardResult')}>
          <div className="space-y-4">
            <textarea
              readOnly
              value={result}
              placeholder={t('textCloak.resultPlaceholder')}
              rows={8}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e0e0e] border border-white/[0.08] text-zinc-100 placeholder-zinc-500 resize-y"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {result && (
                <Button variant="secondary" onClick={handleCopy}>
                  {t('textCloak.copyResult')}
                </Button>
              )}
              {stats && (
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span>Substituídos: <strong className="text-orange-300">{stats.replacedChars}</strong></span>
                  <span>Zero-Width: <strong className="text-emerald-300">{stats.zeroWidthInserted}</strong></span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
