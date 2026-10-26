'use client';

import React, { useEffect } from 'react';
import { Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/context/LocaleContext';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-[#f97316] to-[#ea580c] text-white shadow-[0_8px_28px_rgba(249,115,22,.25)] hover:brightness-110 border border-[#f97316]/40',
  secondary:
    'border border-white/10 bg-white/[.05] text-zinc-100 hover:bg-white/[.09] hover:border-white/15',
  danger:
    'border border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  ghost: 'text-zinc-400 hover:bg-white/[.05] hover:text-white border border-transparent',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-xs rounded-lg',
  md: 'min-h-10 px-4 py-2 text-sm rounded-xl',
  lg: 'min-h-11 px-5 py-2.5 text-sm rounded-xl',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = ''
) {
  return `inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({
  children,
  title,
  action,
  className = '',
  interactive = false,
}: {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  const hasCustomPadding = /\bp-\d|\bpx-\d|\bpy-\d/.test(className);
  return (
    <section
      className={[
        'cb-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101010]/90',
        interactive
          ? 'transition-all duration-300 hover:-translate-y-[2px] hover:border-white/[0.14]'
          : '',
        hasCustomPadding ? '' : 'p-5',
        className,
      ].join(' ')}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Input({
  label,
  error,
  id,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5 text-sm" htmlFor={inputId}>
      {label && <span className="block font-medium text-zinc-400">{label}</span>}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-white/[0.08] bg-[#141414] px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#f97316]/50 focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <span className="block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  busy,
  loading,
  variant = 'danger',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const isBusy = Boolean(busy || loading);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isBusy}>
            {t('common.cancel')}
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={isBusy}>
            {isBusy ? t('common.processing') : confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CopyButton({
  value,
  label,
  successMessage,
  className = '',
}: {
  value: string;
  label?: string;
  successMessage?: string;
  className?: string;
}) {
  const { t } = useLocale();
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage ?? t('common.copied'));
    } catch {
      toast.error(t('common.copyError'));
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
    >
      <Copy size={12} />
      {label ?? t('common.copy')}
    </button>
  );
}
