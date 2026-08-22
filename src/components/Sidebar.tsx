/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Server, SiteSettings, Applicant } from '../types';

interface SidebarProps {
  currentUser: Server;
  siteSettings?: SiteSettings;
  applicants?: Applicant[];
  pendingContributionsCount?: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewScheduleModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenSupportModal: () => void;
}

export default function Sidebar({
  currentUser,
  siteSettings,
  applicants = [],
  pendingContributionsCount = 0,
  activeTab,
  setActiveTab,
  onOpenNewScheduleModal,
  onOpenSettingsModal,
  onOpenSupportModal
}: SidebarProps) {
  const pendingAppsCount = applicants.filter(a => {
    const st = (a.status || 'pending').toLowerCase();
    return st === 'pending' || st === 'under_review';
  }).length;
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] w-[280px] p-5 gap-2 border-r border-[#46464c]/30 bg-[#051424] z-40">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-3">
        {siteSettings?.logoUrl ? (
          <img
            src={siteSettings.logoUrl}
            alt="Logo"
            className="w-10 h-10 rounded-xl object-cover border border-gold-500/40 shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div>
          <h2 className="font-serif text-xl font-bold text-[#c3c6d7] leading-tight">
            {siteSettings?.appName || 'Auxiliadora Media'}
          </h2>
          <p className="text-[10px] text-[#909096] uppercase tracking-wider font-mono font-semibold mt-0.5">
            {siteSettings?.appSubtitle || 'Media Ministry'}
          </p>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav className="flex flex-col gap-1.5 flex-grow">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#3e495d] text-[#aeb9d0] shadow-sm'
              : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
          }`}
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-[#3e495d] text-[#aeb9d0] shadow-sm'
              : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
          }`}
        >
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <span>Master Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
            activeTab === 'workspace'
              ? 'bg-[#3e495d] text-[#aeb9d0] shadow-sm'
              : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
          }`}
        >
          <span className="material-symbols-outlined text-xl">dns</span>
          <span>Media Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
            activeTab === 'community'
              ? 'bg-[#3e495d] text-[#aeb9d0] shadow-sm'
              : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
          }`}
        >
          <span className="material-symbols-outlined text-xl">campaign</span>
          <span>Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('reflections')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
            activeTab === 'reflections'
              ? 'bg-[#3e495d] text-[#aeb9d0] shadow-sm'
              : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
          }`}
        >
          <span className="material-symbols-outlined text-xl">auto_stories</span>
          <span>Reflections</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-[#3e495d] text-[#aeb9d0] shadow-sm'
              : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
          }`}
        >
          <span className="material-symbols-outlined text-xl">sticky_note_2</span>
          <span>Server Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('resibo')}
          className={`flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
            activeTab === 'resibo'
              ? 'bg-[#3e495d] text-amber-300 shadow-sm'
              : 'text-[#909096] hover:text-amber-300 hover:bg-[#1c2b3c]'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-xl">receipt_long</span>
            <span>Resibo (Finances)</span>
          </div>
          {(currentUser.isAdmin || currentUser.isSubAdmin || currentUser.isFinanceAdmin) && pendingContributionsCount > 0 && (
            <span className="bg-amber-500 text-church-950 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
              {pendingContributionsCount}
            </span>
          )}
        </button>

        {(currentUser.isAdmin || currentUser.isSubAdmin) && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm font-semibold cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[#3e495d] text-red-300 shadow-sm'
                : 'text-[#909096] hover:text-red-300 hover:bg-[#1c2b3c]'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-xl">shield</span>
              <span>Admin Panel</span>
            </div>
            {pendingAppsCount > 0 && (
              <span className="bg-amber-500 text-church-950 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {pendingAppsCount}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Footer Navigation */}
      <div className="flex flex-col gap-1 pt-3 border-t border-[#46464c]/30">
        <button
          onClick={onOpenSettingsModal}
          className="flex items-center gap-4 px-4 py-1.5 text-[#909096] hover:text-[#d4e4fa] text-xs font-mono text-left cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          <span>Settings</span>
        </button>

        <button
          onClick={onOpenSupportModal}
          className="flex items-center gap-4 px-4 py-1.5 text-[#909096] hover:text-[#d4e4fa] text-xs font-mono text-left cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          <span>Support</span>
        </button>
      </div>
    </aside>
  );
}
