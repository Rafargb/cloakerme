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
  htmlContent?: string;
  createdAt: string;
}

export function PagesScreen() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'WHITE' | 'BLACK'>('WHITE');
  const [mode, setMode] = useState<'url' | 'html'>('url');
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PageItem | null>(null);

  const { data: pages = [], isLoading } = useQuery<PageItem[]>({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/pages');
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        type,
        url: mode === 'url' ? url.trim() : undefined,
        htmlContent: mode === 'html' ? htmlContent : undefined,
      };
      const { data } = await axios.post('/api/v1/pages', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setModalOpen(false);
      setName('');
      setUrl('');
      setHtmlContent('');
      toast.success(t('pages.toastCreated'));
    },
    onError: () => {
      toast.error(t('pages.errCreate'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setDeleteTarget(null);
      toast.success(t('pages.toastDeleted'));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('pages.title')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('pages.subtitle')}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>{t('pages.new')}</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-800/40 animate-pulse" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-zinc-500">
            <p className="font-medium text-zinc-400 mb-1">{t('pages.emptyTitle')}</p>
            <p className="text-sm mb-4">{t('pages.emptyDesc')}</p>
            <Button onClick={() => setModalOpen(true)}>{t('pages.createFirst')}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <Card key={p.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      p.type === 'WHITE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-zinc-600/30 text-zinc-300 border border-zinc-500/30'
                    }`}
                  >
                    {p.type}
                  </span>
                  <h3 className="font-semibold text-white truncate">{p.name}</h3>
                </div>
                {p.url && <p className="text-sm text-zinc-500 mt-1 truncate">{p.url}</p>}
                {p.htmlContent && !p.url && (
                  <p className="text-xs text-zinc-600 mt-1">{t('pages.customHtml')}</p>
                )}
              </div>
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(p)}>
                {t('pages.delete')}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('pages.modalTitle')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label={t('pages.nameLabel')}
            placeholder={t('pages.namePh')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              {t('pages.typeLabel')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'WHITE' | 'BLACK')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm"
            >
              <option value="WHITE">{t('pages.typeWhite')}</option>
              <option value="BLACK">{t('pages.typeBlack')}</option>
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'url'}
                onChange={() => setMode('url')}
                className="accent-[#f97316]"
              />
              <span>{t('pages.modeUrl')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'html'}
                onChange={() => setMode('html')}
                className="accent-[#f97316]"
              />
              <span>{t('pages.modeHtml')}</span>
            </label>
          </div>
          {mode === 'url' ? (
            <Input
              label="URL"
              type="url"
              placeholder={t('pages.urlPh')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                {t('pages.htmlLabel')}
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={5}
                placeholder="<html>...</html>"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#141414] border border-white/[0.08] text-zinc-100 text-sm font-mono"
                required
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('pages.creating') : t('pages.create')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t('pages.deleteModalTitle')}
        description={deleteTarget ? t('pages.deleteModalDesc', { name: deleteTarget.name }) : ''}
        confirmLabel={t('pages.deleteConfirm')}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
