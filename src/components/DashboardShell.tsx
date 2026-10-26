'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  Megaphone,
  FileCode2,
  ScrollText,
  Film,
  Type,
  Globe,
  BookOpen,
  Video,
  Share2,
  Trophy,
  RotateCcw,
  Settings,
  Users,
  Activity,
  Server,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  MessageCircle,
  Shield,
} from 'lucide-react';

interface NavSubItem {
  href: string;
  labelKey?: string;
  labelLiteral?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  id: string;
  titleKey: string;
  items: NavSubItem[];
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const { locale, setLocale, t } = useLocale();
  const { user, logout, isAdmin } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    operation: true,
    tools: true,
    content: false,
    account: false,
    admin: false,
  });

  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('cloakby_sidebar_collapsed');
      if (savedCollapsed === '1') setCollapsed(true);
      const savedSections = localStorage.getItem('cloakby_sidebar_sections');
      if (savedSections) {
        setOpenSections((prev) => ({ ...prev, ...JSON.parse(savedSections) }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Automatically expand section containing active route
  useEffect(() => {
    if (
      pathname.startsWith('/dashboard/campaigns') ||
      pathname.startsWith('/dashboard/pages') ||
      pathname.startsWith('/dashboard/logs')
    ) {
      setOpenSections((p) => ({ ...p, operation: true }));
    } else if (
      pathname.startsWith('/dashboard/creatives') ||
      pathname.startsWith('/dashboard/text-cloak') ||
      pathname.startsWith('/dashboard/dominios')
    ) {
      setOpenSections((p) => ({ ...p, tools: true }));
    } else if (
      pathname.startsWith('/dashboard/tiktok') ||
      pathname.startsWith('/dashboard/guia') ||
      pathname.startsWith('/dashboard/tutoriais')
    ) {
      setOpenSections((p) => ({ ...p, content: true }));
    } else if (
      pathname.startsWith('/dashboard/afiliados') ||
      pathname.startsWith('/dashboard/conquistas') ||
      pathname.startsWith('/dashboard/reembolso') ||
      pathname.startsWith('/dashboard/settings')
    ) {
      setOpenSections((p) => ({ ...p, account: true }));
    } else if (pathname.startsWith('/dashboard/admin')) {
      setOpenSections((p) => ({ ...p, admin: true }));
    }
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cloakby_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('cloakby_sidebar_sections', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const sections: NavSection[] = [
    {
      id: 'operation',
      titleKey: 'sidebar.sectionOperation',
      items: [
        { href: '/dashboard/campaigns', labelKey: 'sidebar.campaigns', icon: Megaphone },
        { href: '/dashboard/pages', labelKey: 'sidebar.pages', icon: FileCode2 },
        { href: '/dashboard/logs', labelKey: 'sidebar.clickLogs', icon: ScrollText },
      ],
    },
    {
      id: 'tools',
      titleKey: 'sidebar.sectionTools',
      items: [
        { href: '/dashboard/creatives', labelKey: 'sidebar.creatives', icon: Film },
        { href: '/dashboard/text-cloak', labelKey: 'sidebar.textCloak', icon: Type },
        { href: '/dashboard/dominios', labelKey: 'sidebar.customDomain', icon: Globe },
      ],
    },
    {
      id: 'content',
      titleKey: 'sidebar.sectionContent',
      items: [
        { href: '/dashboard/tiktok', labelLiteral: 'TikTok Ads', icon: Shield },
        { href: '/dashboard/guia', labelKey: 'sidebar.guide', icon: BookOpen },
        { href: '/dashboard/tutoriais', labelKey: 'sidebar.tutorials', icon: Video },
      ],
    },
    {
      id: 'account',
      titleKey: 'sidebar.sectionAccount',
      items: [
        { href: '/dashboard/afiliados', labelKey: 'sidebar.affiliates', icon: Share2 },
        { href: '/dashboard/conquistas', labelKey: 'sidebar.achievements', icon: Trophy },
        { href: '/dashboard/reembolso', labelKey: 'sidebar.refund', icon: RotateCcw },
        { href: '/dashboard/settings', labelKey: 'sidebar.settings', icon: Settings },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      id: 'admin',
      titleKey: 'sidebar.sectionAdmin',
      items: [
        { href: '/dashboard/admin', labelKey: 'sidebar.adminUsers', icon: Users },
        { href: '/dashboard/admin/live-logs', labelKey: 'sidebar.adminLogs', icon: Activity },
        { href: '/dashboard/admin/dominios', labelKey: 'sidebar.adminDomains', icon: Server },
      ],
    });
  }

  const isExactActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/admin') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsedView = !isMobile && collapsed;

    return (
      <div className="flex h-full flex-col">
        {/* Brand Header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/[0.06] ${
            isCollapsedView ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c] shadow-[0_0_18px_-4px_rgba(249,115,22,0.7)]">
              <span className="font-display text-lg font-bold tracking-wider text-white">C</span>
            </div>
            {!isCollapsedView && (
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl tracking-[0.08em] text-white">CLOAKBY</span>
                <span className="rounded bg-[#f97316]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-orange-400 border border-[#f97316]/30">
                  LOCAL
                </span>
              </div>
            )}
          </Link>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {/* Standalone Top Items: Visão geral & Gateway */}
          {[
            { href: '/dashboard', label: t('sidebar.overview'), icon: LayoutDashboard },
            { href: '/dashboard/gateway', label: t('sidebar.gateway'), icon: CreditCard },
          ].map((topItem) => {
            const active = isExactActive(topItem.href);
            const Icon = topItem.icon;
            return (
              <Link
                key={topItem.href}
                href={topItem.href}
                onClick={() => isMobile && setMobileOpen(false)}
                title={isCollapsedView ? topItem.label : undefined}
                className={`group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isCollapsedView ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                } ${
                  active
                    ? 'bg-[#f97316]/15 text-orange-300 border border-[#f97316]/30'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? 'text-[#f97316]' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                {!isCollapsedView && <span className="truncate">{topItem.label}</span>}
              </Link>
            );
          })}

          <div className="my-2 border-t border-white/[0.05]" />

          {/* Collapsible Sections with Tree Connectors */}
          {sections.map((section) => {
            const isOpen = openSections[section.id] ?? true;
            const hasActiveChild = section.items.some((i) => isExactActive(i.href));

            if (isCollapsedView) {
              return (
                <div key={section.id} className="space-y-1 pt-1">
                  {section.items.map((item) => {
                    const active = isExactActive(item.href);
                    const Icon = item.icon;
                    const label = item.labelLiteral || (item.labelKey ? t(item.labelKey) : '');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={label}
                        className={`flex items-center justify-center rounded-lg px-2 py-2.5 transition-colors ${
                          active
                            ? 'bg-[#f97316]/15 text-orange-300 border border-[#f97316]/30'
                            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#f97316]' : 'text-zinc-500'}`} />
                      </Link>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={section.id} className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    hasActiveChild ? 'text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span>{t(section.titleKey)}</span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-1 ml-3 pl-2.5 border-l border-white/[0.08] space-y-0.5">
                    {section.items.map((item) => {
                      const active = isExactActive(item.href);
                      const Icon = item.icon;
                      const label = item.labelLiteral || (item.labelKey ? t(item.labelKey) : '');
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => isMobile && setMobileOpen(false)}
                          className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                            active
                              ? 'bg-[#f97316]/15 text-orange-300 border border-[#f97316]/30'
                              : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          <span
                            className={`pointer-events-none absolute -left-2.5 top-1/2 h-px w-2 -translate-y-1/2 ${
                              active ? 'bg-[#f97316]/60' : 'bg-white/[0.08]'
                            }`}
                          />
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              active ? 'text-[#f97316]' : 'text-zinc-500 group-hover:text-zinc-300'
                            }`}
                          />
                          <span className="truncate">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Plan / Engine Status */}
        {!isCollapsedView && (
          <div className="border-t border-white/[0.06] p-3">
            <div className="rounded-xl border border-[#f97316]/25 bg-gradient-to-br from-[#f97316]/10 via-[#121212] to-[#0c0c0c] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-300">
                  PLANO {user?.plan || 'GLOBAL'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  FFmpeg Ativo
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden lg:block border-r border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl transition-all duration-200 ${
          collapsed ? 'w-[4.5rem]' : 'w-60'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/[0.08] bg-[#0a0a0a]">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-60'}`}>
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#080808]/85 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('header.openMenu')}
              className="inline-flex lg:hidden items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-300 hover:bg-white/[0.06]"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')}
              className="hidden lg:inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Language Switcher PT / EN */}
            <div className="inline-flex items-center rounded-lg border border-white/[0.08] bg-[#111111] p-0.5">
              <button
                type="button"
                onClick={() => setLocale('pt')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  locale === 'pt'
                    ? 'bg-gradient-to-b from-[#f97316] to-[#ea580c] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                PT
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  locale === 'en'
                    ? 'bg-gradient-to-b from-[#f97316] to-[#ea580c] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* User Badge */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f97316]/20 text-xs font-bold text-orange-300 border border-[#f97316]/30">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-medium text-zinc-200 max-w-[160px] truncate">
                  {user?.email || 'paulo@aimedialab.online'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              title={t('header.signOut')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-zinc-200 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('header.signOut')}</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Floating Support Pill */}
      <a
        href="https://wa.me/5547996209128"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('whatsapp.aria')}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-[#0d1f17]/90 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] backdrop-blur-md hover:border-emerald-400/50 hover:bg-[#122b20] transition-all"
      >
        <MessageCircle className="h-4 w-4 text-emerald-400" />
        <span>{t('whatsapp.support')}</span>
      </a>
    </div>
  );
}
