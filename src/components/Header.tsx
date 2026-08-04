/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Server, SiteSettings, Announcement, ScheduleRow, Applicant } from '../types';
import { LogOut, Sun, Moon, Search, Bell, Settings, ShieldAlert, CheckCircle, Menu, X, Shield, CheckCheck, Calendar, Megaphone, UserPlus } from 'lucide-react';

interface HeaderProps {
  servers: Server[];
  currentUser: Server;
  siteSettings?: SiteSettings;
  announcements?: Announcement[];
  schedules?: ScheduleRow[];
  applicants?: Applicant[];
  activeUserIds?: string[];
  onUserChange: (user: Server) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
  onOpenReflectionModal: () => void;
}

export default function Header({
  servers,
  currentUser,
  siteSettings,
  announcements = [],
  schedules = [],
  applicants = [],
  activeUserIds = [],
  onUserChange,
  activeTab,
  setActiveTab,
  theme,
  onThemeChange,
  onLogout,
  onOpenReflectionModal
}: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  // Build Notification List dynamically
  const notifList: { id: string; title: string; subtitle: string; time: string; icon: string; type: 'announcement' | 'schedule' | 'system' | 'applicant'; linkTab?: string }[] = [];

  // Add pending applicants for Admin & Sub-Admin
  if (currentUser.isAdmin || currentUser.isSubAdmin) {
    const pendingApps = applicants.filter(a => a.status === 'pending' || a.status === 'under_review');
    pendingApps.forEach(app => {
      notifList.push({
        id: `applicant-${app.id}`,
        title: `🔔 Join Request: ${app.name}`,
        subtitle: `${app.preferredMinistry} • Account join request submitted (${app.email})`,
        time: app.submittedAt || 'Recent',
        icon: 'person_add',
        type: 'applicant',
        linkTab: 'admin'
      });
    });
  }

  // Add announcements to notification list
  announcements.forEach((a) => {
    notifList.push({
      id: `ann-${a.id}`,
      title: a.title,
      subtitle: a.content || 'New announcement posted on the bulletin.',
      time: a.date || 'Today',
      icon: 'campaign',
      type: 'announcement',
      linkTab: 'dashboard'
    });
  });

  // Add user schedule assignments
  schedules.forEach((sched) => {
    sched.slots.forEach((slot) => {
      const isUserInPpt = Array.isArray(slot.ppt) ? slot.ppt.includes(currentUser.id) : slot.ppt === currentUser.id;
      const isUserInLive = Array.isArray(slot.live_server) ? slot.live_server.includes(currentUser.id) : slot.live_server === currentUser.id;
      const isUserInDoc = Array.isArray(slot.documentation) ? slot.documentation.includes(currentUser.id) : slot.documentation === currentUser.id;
      const isUserInReels = Array.isArray(slot.reels_editor) ? slot.reels_editor.includes(currentUser.id) : slot.reels_editor === currentUser.id;

      if (isUserInPpt || isUserInLive || isUserInDoc || isUserInReels) {
        let roleName = 'Liturgy Duty';
        if (isUserInPpt) roleName = 'PPT Operator';
        if (isUserInLive) roleName = 'Live Stream Server';
        if (isUserInDoc) roleName = 'Documentation/Photo';
        if (isUserInReels) roleName = 'Reels Editor';

        notifList.push({
          id: `sched-${sched.id}-${slot.id}`,
          title: `Assigned: ${roleName}`,
          subtitle: `${sched.dayName} (${sched.date}) at ${slot.time}`,
          time: 'Upcoming Duty',
          icon: 'calendar_month',
          type: 'schedule',
          linkTab: 'schedule'
        });
      }
    });
  });

  // Default system notification if empty
  if (notifList.length === 0) {
    notifList.push(
      {
        id: 'sys-welcome',
        title: 'Welcome to Auxiliadora Media',
        subtitle: 'All notification feeds & schedule alerts are up to date.',
        time: 'Just now',
        icon: 'verified',
        type: 'system'
      },
      {
        id: 'sys-roster',
        title: 'Weekly Roster Published',
        subtitle: 'Check your assigned Mass slots under the Schedule tab.',
        time: 'This Week',
        icon: 'event_available',
        type: 'schedule',
        linkTab: 'schedule'
      }
    );
  }

  const unreadCount = notifList.filter(n => !readNotifIds.includes(n.id)).length;

  const handleMarkAllRead = () => {
    setReadNotifIds(notifList.map(n => n.id));
  };

  const handleToggleNotifRead = (id: string) => {
    if (!readNotifIds.includes(id)) {
      setReadNotifIds(prev => [...prev, id]);
    }
  };

  return (
    <header className="flex justify-between items-center w-full px-4 sm:px-6 h-16 sticky top-0 z-50 bg-[#122131] border-b border-[#46464c]/30 backdrop-blur-md">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-[#c3c6d7] p-1.5 rounded-lg hover:bg-[#273647]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          {siteSettings?.logoUrl ? (
            <img
              src={siteSettings.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover border border-gold-500/30 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="p-1.5 rounded-lg bg-[#0b57d0]/20 text-[#b2c5ff] border border-[#0b57d0]/40">
              <Shield className="w-5 h-5 text-gold-400" />
            </div>
          )}
          <span className="font-serif text-xl sm:text-2xl font-bold text-[#d4e4fa] tracking-tight">
            {siteSettings?.appName || 'Auxiliadora Media'}
          </span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="relative hidden md:block w-72">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#909096]">
          search
        </span>
        <input 
          className="w-full bg-[#0d1c2d] border border-[#46464c]/30 rounded-full pl-9 pr-4 py-1.5 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0] placeholder-[#909096] transition-all" 
          placeholder="Search resources, media, schedules..." 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Active Devices Online Indicator */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-inner"
          title={`${activeUserIds.length} device(s) currently connected across ministry members`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{activeUserIds.length > 0 ? activeUserIds.length : 1} Device{activeUserIds.length === 1 ? '' : 's'} Online</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationDropdown(!showNotificationDropdown);
              setShowProfileDropdown(false);
            }}
            className="text-[#c3c6d7] p-2 hover:bg-[#273647]/50 transition-colors rounded-full relative cursor-pointer focus:outline-none"
            title="Notifications & Bulletin Alerts"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-[#0b57d0] text-white text-[10px] font-mono font-extrabold rounded-full flex items-center justify-center animate-pulse border border-[#122131]">
                {unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500/80 rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#122131] border border-[#46464c]/50 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#46464c]/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400">notifications_active</span>
                  <h3 className="font-serif font-bold text-sm text-[#d4e4fa]">Notifications & Bulletin</h3>
                  {unreadCount > 0 && (
                    <span className="bg-[#0b57d0]/30 text-[#b2c5ff] text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-[#0b57d0]/40">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-mono text-gold-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {notifList.map((item) => {
                  const isRead = readNotifIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleToggleNotifRead(item.id);
                        if (item.linkTab) {
                          setActiveTab(item.linkTab);
                          setShowNotificationDropdown(false);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                        isRead
                          ? 'bg-[#0d1c2d]/50 border-[#46464c]/20 text-[#909096] opacity-75'
                          : 'bg-[#1c2b3c] border-amber-500/30 text-[#d4e4fa] shadow-sm hover:border-amber-400/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        item.type === 'announcement'
                          ? 'bg-amber-500/20 text-amber-300'
                          : item.type === 'schedule'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        <span className="material-symbols-outlined text-sm block">
                          {item.icon}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`font-bold text-xs truncate ${!isRead ? 'text-[#d4e4fa]' : 'text-[#c3c6d7]'}`}>
                            {item.title}
                          </h4>
                          <span className="text-[9px] font-mono text-[#909096] shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-[#c3c6d7] leading-tight line-clamp-2">
                          {item.subtitle}
                        </p>
                      </div>

                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5"></span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#46464c]/30 flex items-center justify-between text-[10px] font-mono text-[#909096]">
                <span>Member: {currentUser.name}</span>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setShowNotificationDropdown(false);
                  }}
                  className="text-amber-300 hover:underline font-bold cursor-pointer"
                >
                  View Bulletin Board →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Switcher Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#273647]/40 transition-colors cursor-pointer focus:outline-none"
          >
            <img 
              className="w-8 h-8 rounded-full border border-[#c3c6d7]/30 object-cover" 
              src={currentUser.picture} 
              alt={currentUser.name} 
              referrerPolicy="no-referrer" 
            />
            <span className="material-symbols-outlined text-xs text-[#909096] hidden sm:inline">
              expand_more
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-[#122131] border border-[#46464c]/50 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in text-xs">
              <div className="p-2 border-b border-[#46464c]/30 mb-2">
                <p className="font-bold text-[#d4e4fa]">{currentUser.name}</p>
                <p className="text-[10px] text-[#909096] uppercase tracking-wider font-mono">
                  {currentUser.role.replace('_', ' ')} • {currentUser.isAdmin ? 'Admin' : currentUser.isSubAdmin ? 'Sub-Admin' : 'Media'}
                </p>
              </div>

              <div className="border-t border-[#46464c]/30 pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    onThemeChange(theme === 'light' ? 'dark' : 'light');
                  }}
                  className="p-1.5 text-[#909096] hover:text-[#d4e4fa] flex items-center gap-1 font-mono text-[11px]"
                >
                  {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-red-400 hover:text-red-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-[#051424] border-b border-[#46464c]/40 p-4 shadow-2xl z-40 flex flex-col gap-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-[#3e495d] text-white' : 'text-[#909096]'}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab('schedule'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'schedule' ? 'bg-[#3e495d] text-white' : 'text-[#909096]'}`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Master Schedule</span>
          </button>
          <button 
            onClick={() => { setActiveTab('workspace'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'workspace' ? 'bg-[#3e495d] text-white' : 'text-[#909096]'}`}
          >
            <span className="material-symbols-outlined">dns</span>
            <span>Media Directory</span>
          </button>
          <button 
            onClick={() => { setActiveTab('community'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'community' ? 'bg-[#3e495d] text-white' : 'text-[#909096]'}`}
          >
            <span className="material-symbols-outlined">campaign</span>
            <span>Announcements</span>
          </button>
          <button 
            onClick={() => { setActiveTab('notes'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'notes' ? 'bg-[#3e495d] text-white' : 'text-[#909096]'}`}
          >
            <span className="material-symbols-outlined">sticky_note_2</span>
            <span>Server Notes</span>
          </button>
          {(currentUser.isAdmin || currentUser.isSubAdmin) && (
            <button 
              onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'admin' ? 'bg-[#3e495d] text-red-300' : 'text-[#909096]'}`}
            >
              <span className="material-symbols-outlined">shield</span>
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
