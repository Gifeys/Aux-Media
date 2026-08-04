/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Server, ScheduleRow, Announcement, SocComOfTheMonth, SiteSettings, SubAdminAttendanceAlert, ScheduleAuditRecord } from '../types';
import { DEFAULT_SITE_SETTINGS } from '../initialData';
import { compressImage } from '../lib/imageUtils';

interface DashboardViewProps {
  currentUser: Server;
  servers: Server[];
  schedules: ScheduleRow[];
  announcements: Announcement[];
  soccomOfMonth: SocComOfTheMonth;
  onUpdateSoccomOfMonth?: (updated: SocComOfTheMonth) => void;
  siteSettings?: SiteSettings;
  onUpdateSiteSettings?: (updated: Partial<SiteSettings>) => void;
  onAddAnnouncement?: (ann: Announcement) => void;
  onUpdateAnnouncement?: (updated: Announcement) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onOpenReflectionModal: () => void;
  onOpenSwapModal: () => void;
  onNavigateToSchedule: () => void;
  subAdminAlerts?: SubAdminAttendanceAlert[];
  auditRecords?: ScheduleAuditRecord[];
  onOpenSubAdminAudit?: () => void;
}

export default function DashboardView({
  currentUser,
  servers,
  schedules,
  announcements,
  soccomOfMonth,
  onUpdateSoccomOfMonth,
  siteSettings,
  onUpdateSiteSettings,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onOpenReflectionModal,
  onOpenSwapModal,
  onNavigateToSchedule,
  subAdminAlerts = [],
  auditRecords = [],
  onOpenSubAdminAudit
}: DashboardViewProps) {

  const [tableWeekOffset, setTableWeekOffset] = useState(0);

  // Member Spotlight Edit State
  const [showEditSpotlightModal, setShowEditSpotlightModal] = useState(false);
  const [spotlightName, setSpotlightName] = useState(soccomOfMonth?.name || '');
  const [spotlightRole, setSpotlightRole] = useState(soccomOfMonth?.role || '');
  const [spotlightAvatar, setSpotlightAvatar] = useState(soccomOfMonth?.avatar || '');
  const [spotlightDesc, setSpotlightDesc] = useState(soccomOfMonth?.description || '');
  const [spotlightImg1, setSpotlightImg1] = useState(soccomOfMonth?.workImages?.[0] || '');
  const [spotlightImg2, setSpotlightImg2] = useState(soccomOfMonth?.workImages?.[1] || '');
  const [spotlightImg3, setSpotlightImg3] = useState(soccomOfMonth?.workImages?.[2] || '');

  const openSpotlightModal = () => {
    setSpotlightName(soccomOfMonth?.name || '');
    setSpotlightRole(soccomOfMonth?.role || '');
    setSpotlightAvatar(soccomOfMonth?.avatar || '');
    setSpotlightDesc(soccomOfMonth?.description || '');
    setSpotlightImg1(soccomOfMonth?.workImages?.[0] || '');
    setSpotlightImg2(soccomOfMonth?.workImages?.[1] || '');
    setSpotlightImg3(soccomOfMonth?.workImages?.[2] || '');
    setShowEditSpotlightModal(true);
  };

  const handleSpotlightAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.75);
        setSpotlightAvatar(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image file.');
      }
    }
  };

  const handleSaveSpotlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSoccomOfMonth) {
      onUpdateSoccomOfMonth({
        id: soccomOfMonth?.id || `soccom-${Date.now()}`,
        name: spotlightName,
        role: spotlightRole,
        avatar: spotlightAvatar,
        description: spotlightDesc,
        workImages: [
          spotlightImg1 || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
          spotlightImg2 || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
          spotlightImg3 || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
        ]
      });
      setShowEditSpotlightModal(false);
    }
  };

  // Announcement & SocCom of the Month Slider State
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [showUploadAnnModal, setShowUploadAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'birthday' | 'reminder' | 'bible_verse' | 'event' | 'general'>('general');
  const [annDate, setAnnDate] = useState(new Date().toISOString().split('T')[0]);
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [isCompressingAnnImg, setIsCompressingAnnImg] = useState(false);

  // Edit announcement slide state
  const [editingAnnSlide, setEditingAnnSlide] = useState<Announcement | null>(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');
  const [editAnnType, setEditAnnType] = useState<'birthday' | 'reminder' | 'bible_verse' | 'event' | 'general'>('general');
  const [editAnnDate, setEditAnnDate] = useState('');
  const [editAnnImageUrl, setEditAnnImageUrl] = useState('');
  const [isCompressingEditAnnImg, setIsCompressingEditAnnImg] = useState(false);

  // Combined slides: SocCom Server of the Month Spotlight + Announcements
  // Daily Verse calculation (Rotates every calendar day 1-31)
  const defaultVerses = siteSettings?.dailyVersesList && siteSettings.dailyVersesList.length > 0
    ? siteSettings.dailyVersesList
    : DEFAULT_SITE_SETTINGS.dailyVersesList || [];

  const dayOfMonth = new Date().getDate(); // 1-31
  const autoVerseIndex = (dayOfMonth - 1) % defaultVerses.length;
  const currentAutoVerse = defaultVerses[autoVerseIndex] || {
    quote: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus...",
    reference: "Colossians 3:17",
    authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg",
    authorName: "Saint Paul the Apostle writing Epistles"
  };

  const isCustomVerseSet = Boolean(siteSettings?.customDailyVerseQuote);
  const activeVerseQuote = siteSettings?.customDailyVerseQuote || currentAutoVerse.quote;
  const activeVerseReference = siteSettings?.customDailyVerseReference || currentAutoVerse.reference;
  const activeVerseImageUrl = siteSettings?.dailyVerseImageUrl || currentAutoVerse.authorPaintingUrl || "/src/assets/images/st_paul_painting_1785043748004.jpg";
  const activeVerseAuthorName = siteSettings?.dailyVerseAuthorName || currentAutoVerse.authorName || "Classical Oil Painting of Bible Author";

  const allSlides = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle?: string;
      content: string;
      typeBadge: string;
      date: string;
      imageUrl?: string;
      isSocComSpotlight?: boolean;
      rawAnnId?: string;
      soccomData?: typeof soccomOfMonth;
    }> = [];

    // 1. SocCom of the Month Slide
    if (soccomOfMonth && soccomOfMonth.name) {
      items.push({
        id: 'soccom-month-slide',
        title: `🏆 SocCom Server of the Month`,
        subtitle: soccomOfMonth.name,
        content: `Role: ${soccomOfMonth.role || 'Media Volunteer'} • "${soccomOfMonth.description || 'Outstanding service in media ministry.'}"`,
        typeBadge: '⭐ SocCom Spotlight',
        date: 'Current Month',
        imageUrl: soccomOfMonth.avatar || (soccomOfMonth.workImages && soccomOfMonth.workImages[0]) || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8Svj41Q3Y0O1TZayIExCB4qqrcY0XCOw5d86SEGE-mKiol8YbciAcQzezCSZNgVmu6GLBaFtO-XAMDU23Lkv-N-9zwECXhNstd2OZglhxIWZJunrC0mf10U78OoLM75OVFo2uVTojzYG7jIz5NsyzSvIjXq1FFrbBSz0rJ8Nee7nBF2c3bLhATeDoMipIxNG-lc0GcEAXranIC_FuIdVFVigSV-8MhurWNeUILFeHJqVKuDg1EnaQ",
        isSocComSpotlight: true,
        soccomData: soccomOfMonth
      });
    }

    // 2. Regular Announcements
    let hasDailyWordSlide = false;
    if (announcements) {
      announcements.forEach((ann) => {
        let badge = '📢 Announcement';
        let slideTitle = ann.title;
        let slideSubtitle = '';
        let slideContent = ann.content;
        let slideImageUrl = ann.imageUrl;

        if (ann.type === 'birthday') badge = '🎉 Birthday';
        if (ann.type === 'reminder') badge = '⛪ Reminder';
        if (ann.type === 'event') badge = '✨ Special Event';
        if (ann.type === 'bible_verse' || ann.type === 'daily_word') {
          badge = '📖 Daily Word';
          hasDailyWordSlide = true;
          slideTitle = '📖 Daily Bible Verse';
          slideSubtitle = activeVerseAuthorName;
          slideContent = `"${activeVerseQuote}" — ${activeVerseReference}`;
          slideImageUrl = activeVerseImageUrl;
        }

        items.push({
          id: ann.id,
          title: slideTitle,
          subtitle: slideSubtitle,
          content: slideContent,
          typeBadge: badge,
          date: ann.date,
          imageUrl: slideImageUrl,
          isSocComSpotlight: false,
          rawAnnId: ann.id
        });
      });
    }

    // 3. Fallback: If no daily_word announcement exists in DB, automatically add daily rotating slide
    if (!hasDailyWordSlide) {
      items.push({
        id: 'daily-word-auto-slide',
        title: '📖 Daily Bible Verse',
        subtitle: activeVerseAuthorName,
        content: `"${activeVerseQuote}" — ${activeVerseReference}`,
        typeBadge: '📖 Daily Word',
        date: new Date().toISOString().split('T')[0],
        imageUrl: activeVerseImageUrl,
        isSocComSpotlight: false
      });
    }

    return items;
  }, [announcements, soccomOfMonth, activeVerseAuthorName, activeVerseQuote, activeVerseReference, activeVerseImageUrl]);

  // Auto-slide effect
  useEffect(() => {
    if (allSlides.length <= 1 || isSliderPaused) return;
    const timer = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % allSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [allSlides.length, isSliderPaused]);

  const activeSlide = allSlides.length > 0
    ? allSlides[sliderIndex % allSlides.length]
    : null;

  const handleNextSlide = () => {
    if (allSlides.length === 0) return;
    setSliderIndex((prev) => (prev + 1) % allSlides.length);
  };

  const handlePrevSlide = () => {
    if (allSlides.length === 0) return;
    setSliderIndex((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingAnnImg(true);
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        setAnnImageUrl(compressed);
      } catch (err) {
        console.error('Failed to compress image:', err);
        alert('Failed to process image file. Please try another photo.');
      } finally {
        setIsCompressingAnnImg(false);
      }
    }
  };

  const handleEditImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingEditAnnImg(true);
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        setEditAnnImageUrl(compressed);
      } catch (err) {
        console.error('Failed to compress image:', err);
        alert('Failed to process image file. Please try another photo.');
      } finally {
        setIsCompressingEditAnnImg(false);
      }
    }
  };

  const handleOpenEditAnnSlide = (annId: string) => {
    const found = announcements.find(a => a.id === annId);
    if (found) {
      setEditingAnnSlide(found);
      setEditAnnTitle(found.title);
      setEditAnnContent(found.content);
      setEditAnnType((found.type as any) || 'general');
      setEditAnnDate(found.date);
      setEditAnnImageUrl(found.imageUrl || '');
    }
  };

  const handleSaveEditAnnSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnSlide || !editAnnTitle.trim()) return;

    if (onUpdateAnnouncement) {
      onUpdateAnnouncement({
        ...editingAnnSlide,
        title: editAnnTitle,
        content: editAnnContent,
        type: editAnnType,
        date: editAnnDate || editingAnnSlide.date,
        imageUrl: editAnnImageUrl || undefined
      });
    }
    setEditingAnnSlide(null);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: annTitle,
      content: annContent,
      type: annType,
      date: annDate || new Date().toISOString().split('T')[0],
      imageUrl: annImageUrl || undefined
    };
    if (onAddAnnouncement) {
      onAddAnnouncement(newAnn);
    }
    setAnnTitle('');
    setAnnContent('');
    setAnnImageUrl('');
    setShowUploadAnnModal(false);
  };

  // Modal state for editing Daily Verse
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [editVerseQuote, setEditVerseQuote] = useState(activeVerseQuote);
  const [editVerseRef, setEditVerseRef] = useState(activeVerseReference);
  const [editVerseImgUrl, setEditVerseImgUrl] = useState(activeVerseImageUrl);
  const [editVerseAuthorName, setEditVerseAuthorName] = useState(activeVerseAuthorName);

  const PRESET_PAINTINGS = [
    { name: 'Saint Paul Writing Epistles', url: '/src/assets/images/st_paul_painting_1785043748004.jpg' },
    { name: 'King David Composing Psalms', url: '/src/assets/images/king_david_painting_1785043769405.jpg' },
    { name: 'Saint John Writing the Gospel', url: '/src/assets/images/st_john_painting_1785043780425.jpg' },
    { name: 'Prophet / Apostle Writing Holy Scripture', url: '/src/assets/images/bible_author_painting_1785043734856.jpg' }
  ];

  const handleOpenVerseModal = () => {
    setEditVerseQuote(activeVerseQuote);
    setEditVerseRef(activeVerseReference);
    setEditVerseImgUrl(activeVerseImageUrl);
    setEditVerseAuthorName(activeVerseAuthorName);
    setShowVerseModal(true);
  };

  const handleSaveCustomVerse = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings({
        customDailyVerseQuote: editVerseQuote,
        customDailyVerseReference: editVerseRef,
        dailyVerseImageUrl: editVerseImgUrl,
        dailyVerseAuthorName: editVerseAuthorName
      });
    }
    setShowVerseModal(false);
  };

  const handleResetToAutoVerse = () => {
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings({
        customDailyVerseQuote: '',
        customDailyVerseReference: '',
        dailyVerseImageUrl: '',
        dailyVerseAuthorName: ''
      });
    }
    setShowVerseModal(false);
  };

  // Derive user's firstname
  const firstName = currentUser.name.split(' ')[0] || 'Media';

  // Map of server ID to server object for easy lookup
  const serverMap = useMemo(() => {
    const map: Record<string, Server> = {};
    servers.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [servers]);

  // Compute actual assigned events for current user across all schedules
  const userAssignments = useMemo(() => {
    const result: {
      scheduleId: string;
      dayName: string;
      date: string;
      specialService?: string;
      time: string;
      roles: string[];
      isLive?: boolean;
    }[] = [];

    schedules.forEach((sched) => {
      sched.slots.forEach((slot) => {
        const roles: string[] = [];
        if (slot.ppt?.includes(currentUser.id)) roles.push('PPT');
        if (slot.live_server?.includes(currentUser.id)) roles.push('Live Broadcast');
        if (slot.documentation?.includes(currentUser.id)) roles.push('Documentation');
        if (slot.reels_editor?.includes(currentUser.id)) roles.push('Reels Editor');

        if (roles.length > 0) {
          result.push({
            scheduleId: sched.id,
            dayName: sched.dayName,
            date: sched.date,
            specialService: sched.specialService,
            time: slot.time,
            roles,
            isLive: sched.isLive || slot.isGoingLive
          });
        }
      });
    });

    return result;
  }, [schedules, currentUser.id]);

  // Active schedule selected for the weekly schedule preview table
  const activeSchedule = useMemo(() => {
    if (!schedules || schedules.length === 0) return null;
    const idx = Math.abs(tableWeekOffset) % schedules.length;
    return schedules[idx] || schedules[0];
  }, [schedules, tableWeekOffset]);

  const renderSlotRoleCell = (assignedIds: string[] | undefined) => {
    if (!assignedIds || assignedIds.length === 0) {
      return <span className="text-[#909096]/50 italic">Unassigned</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {assignedIds.map((id) => {
          const isSelf = id === currentUser.id;
          const server = serverMap[id];
          const name = isSelf ? `${currentUser.name} (You)` : (server?.name || 'Member');
          return (
            <span
              key={id}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                isSelf
                  ? 'bg-[#0b57d0] text-white font-bold shadow-sm'
                  : 'bg-white/5 text-[#d4e4fa] border border-white/10'
              }`}
            >
              {server?.picture && (
                <img
                  src={server.picture}
                  alt=""
                  className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <span>{name}</span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            className="w-16 h-16 rounded-full border-2 border-[#c3c6d7] object-cover shadow-lg" 
            src={currentUser.picture} 
            alt={currentUser.name} 
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#d4e4fa]">
              Peace be with you, {firstName}!
            </h1>
            <p className="text-sm text-[#909096] mt-0.5">
              Your heart is in the right place today.
            </p>
          </div>
        </div>

      </section>

      {/* 🌟 MEMBER SPOTLIGHT BANNER */}
      <div className="relative w-full overflow-hidden glass-surface border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl bg-gradient-to-r from-amber-950/40 via-[#0d1c2d] to-gold-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            <img
              src={soccomOfMonth?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
              alt={soccomOfMonth?.name || 'Member Spotlight'}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-400 shadow-xl ring-4 ring-amber-500/20"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full border border-amber-300 shadow">
              ⭐
            </span>
          </div>

          <div className="space-y-0.5 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                🏆 MEMBER SPOTLIGHT
              </span>
              <span className="text-xs font-bold text-amber-300 font-serif">
                {soccomOfMonth?.role || 'SocCom Steward of the Month'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-amber-100 font-serif truncate">
              {soccomOfMonth?.name || 'SocCom Hero'}
            </h3>
            <p className="text-xs text-amber-200/80 italic line-clamp-1">
              "{soccomOfMonth?.description || 'Recognized for exceptional dedication in managing parish media and livestreaming.'}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(currentUser.isAdmin || currentUser.isSubAdmin) && (
            <button
              type="button"
              onClick={openSpotlightModal}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-black font-mono font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span>✏️ Edit Spotlight</span>
            </button>
          )}
        </div>
      </div>


      {/* Grid Layout (12 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Announcements, Assignments & Table (8 cols) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* SLIDER ANNOUNCEMENT COMPONENT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold flex items-center gap-2 text-[#d4e4fa]">
                <span className="material-symbols-outlined text-amber-400">
                  campaign
                </span>
                <span>Ministry Announcements</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadAnnModal(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                <span>Upload Announcement</span>
              </button>
            </div>

            {/* Slider Container Card */}
            <div 
              onMouseEnter={() => setIsSliderPaused(true)}
              onMouseLeave={() => setIsSliderPaused(false)}
              className="glass-surface p-6 rounded-2xl border border-white/10 relative overflow-hidden group shadow-md hover:border-amber-500/30 transition-all min-h-[220px] flex flex-col justify-between"
            >
              {activeSlide ? (
                <div key={activeSlide.id} className="animate-fade-in flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  {/* Text Content */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                        activeSlide.isSocComSpotlight
                          ? 'bg-amber-400 text-black shadow-md font-extrabold animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {activeSlide.typeBadge}
                      </span>
                      <span className="text-[11px] text-[#909096] font-mono">
                        {activeSlide.date}
                      </span>
                      {allSlides.length > 1 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#c3c6d7] border border-white/10">
                          {sliderIndex + 1} / {allSlides.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#d4e4fa] leading-tight flex items-center gap-2">
                        <span>{activeSlide.title}</span>
                      </h4>
                      {activeSlide.subtitle && (
                        <p className="text-sm font-bold text-amber-300 font-serif">
                          {activeSlide.subtitle}
                        </p>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#c3c6d7] leading-relaxed line-clamp-3">
                      {activeSlide.content}
                    </p>
                  </div>

                  {/* Image Preview / Banner if uploaded or SocCom Photo */}
                  {activeSlide.imageUrl ? (
                    <div className="w-full sm:w-64 md:w-72 lg:w-80 aspect-square shrink-0 rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl group-hover:scale-[1.02] transition-transform bg-black/40 relative">
                      <img 
                        src={activeSlide.imageUrl} 
                        alt={activeSlide.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {activeSlide.isSocComSpotlight && (
                        <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-amber-300 border border-amber-500/50 shadow-md">
                          ⭐ Member Spotlight
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full sm:w-56 md:w-64 aspect-square shrink-0 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1c2b3c] to-[#0b1928] flex flex-col items-center justify-center text-amber-300/40 p-4">
                      <span className="material-symbols-outlined text-5xl mb-2">
                        {activeSlide.isSocComSpotlight ? 'workspace_premium' : 'campaign'}
                      </span>
                      <span className="text-xs font-mono text-center">Auxiliadora Media</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 text-[#909096]">
                  <span className="material-symbols-outlined text-3xl">campaign</span>
                  <p className="text-xs italic">No active announcements available.</p>
                </div>
              )}

              {/* Slider Controls (Arrows, Dots, Delete) */}
              <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {allSlides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSliderIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === sliderIndex 
                          ? slide.isSocComSpotlight ? 'w-6 bg-amber-300' : 'w-6 bg-amber-400' 
                          : 'w-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                      title={`Go to slide ${idx + 1}: ${slide.title}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {activeSlide && !activeSlide.isSocComSpotlight && activeSlide.rawAnnId && Boolean(currentUser) && (
                    <div className="flex items-center gap-1.5 mr-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAnnSlide(activeSlide.rawAnnId!)}
                        className="text-[11px] text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all font-mono cursor-pointer flex items-center gap-1 border border-amber-500/30"
                        title="Edit this announcement slide"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>Edit Slide</span>
                      </button>

                      {onDeleteAnnouncement && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this announcement slide?')) {
                              onDeleteAnnouncement(activeSlide.rawAnnId!);
                            }
                          }}
                          className="text-[11px] text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all font-mono cursor-pointer flex items-center gap-1 border border-red-500/20"
                          title="Delete Announcement"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsSliderPaused(!isSliderPaused)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#c3c6d7] hover:text-white transition-all cursor-pointer"
                    title={isSliderPaused ? "Resume Auto Slide" : "Pause Auto Slide"}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isSliderPaused ? 'play_arrow' : 'pause'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#c3c6d7] hover:text-white transition-all cursor-pointer"
                    title="Previous Slide"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#c3c6d7] hover:text-white transition-all cursor-pointer"
                    title="Next Slide"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* UPLOAD ANNOUNCEMENT MODAL */}
          {showUploadAnnModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0b1928] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">add_photo_alternate</span>
                    <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">Post New Announcement & Image</h3>
                  </div>
                  <button
                    onClick={() => setShowUploadAnnModal(false)}
                    className="text-[#909096] hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono">Announcement Title</label>
                    <input
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Easter Mass Livestream & Volunteer Duty"
                      className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-sm text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-serif"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#c3c6d7] font-mono">Category Type</label>
                      <select
                        value={annType}
                        onChange={(e) => setAnnType(e.target.value as any)}
                        className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-mono"
                      >
                        <option value="general">📢 General Announcement</option>
                        <option value="event">✨ Special Event</option>
                        <option value="reminder">⛪ Reminder</option>
                        <option value="birthday">🎉 Birthday</option>
                        <option value="daily_word">📖 Daily Word</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#c3c6d7] font-mono">Effective Date</label>
                      <input
                        type="date"
                        value={annDate}
                        onChange={(e) => setAnnDate(e.target.value)}
                        className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono">Announcement Details / Message</label>
                    <textarea
                      rows={3}
                      required
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Enter details about this announcement..."
                      className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 leading-relaxed"
                    />
                  </div>

                  {/* Image Upload File Picker (PNG, JPG, SVG, WebP) */}
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono flex items-center justify-between">
                      <span>Upload Banner / Photo (PNG, JPG, SVG)</span>
                      <span className="text-[10px] text-amber-300 font-normal">File upload directly supported</span>
                    </label>

                    <div className="flex flex-col gap-3">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        onChange={handleImageFileChange}
                        className="text-xs text-[#c3c6d7] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                      />

                      {isCompressingAnnImg && (
                        <p className="text-[10px] text-amber-300 font-mono animate-pulse">Compressing photo for fast upload...</p>
                      )}

                      {annImageUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-black/50 max-h-40 flex items-center justify-center p-2">
                          <img
                            src={annImageUrl}
                            alt="Uploaded preview"
                            className="max-h-36 rounded object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setAnnImageUrl('')}
                            className="absolute top-2 right-2 bg-red-950/80 hover:bg-red-900 text-red-200 p-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowUploadAnnModal(false)}
                      className="px-4 py-2 bg-[#273647] hover:bg-[#32455a] text-[#d4e4fa] text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCompressingAnnImg}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>Publish Announcement</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ✏️ Edit Announcement Slide Modal */}
          {editingAnnSlide && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-[#172433] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
                <button
                  type="button"
                  onClick={() => setEditingAnnSlide(null)}
                  className="absolute top-4 right-4 text-[#c3c6d7] hover:text-white p-1"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>

                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">Edit Announcement Slide</h3>
                    <p className="text-xs text-[#c3c6d7]">Update title, details, date, category, and slide photo.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveEditAnnSlide} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono">Announcement Title</label>
                    <input
                      type="text"
                      required
                      value={editAnnTitle}
                      onChange={(e) => setEditAnnTitle(e.target.value)}
                      className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-sm text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-serif"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#c3c6d7] font-mono">Category Type</label>
                      <select
                        value={editAnnType}
                        onChange={(e) => setEditAnnType(e.target.value as any)}
                        className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-mono"
                      >
                        <option value="general">📢 General Announcement</option>
                        <option value="event">✨ Special Event</option>
                        <option value="reminder">⛪ Reminder</option>
                        <option value="birthday">🎉 Birthday</option>
                        <option value="daily_word">📖 Daily Word</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#c3c6d7] font-mono">Date Text</label>
                      <input
                        type="text"
                        value={editAnnDate}
                        onChange={(e) => setEditAnnDate(e.target.value)}
                        className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono">Announcement Message</label>
                    <textarea
                      rows={3}
                      required
                      value={editAnnContent}
                      onChange={(e) => setEditAnnContent(e.target.value)}
                      className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 leading-relaxed"
                    />
                  </div>

                  {/* Photo Upload / Edit */}
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono flex items-center justify-between">
                      <span>Update Banner / Photo</span>
                      <span className="text-[10px] text-amber-300 font-normal">Auto-compressed</span>
                    </label>

                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageFileChange}
                        className="text-xs text-[#c3c6d7] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                      />

                      {isCompressingEditAnnImg && (
                        <p className="text-[10px] text-amber-300 font-mono animate-pulse">Compressing photo...</p>
                      )}

                      {editAnnImageUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-black/50 max-h-40 flex items-center justify-center p-2">
                          <img
                            src={editAnnImageUrl}
                            alt="Uploaded preview"
                            className="max-h-36 rounded object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setEditAnnImageUrl('')}
                            className="absolute top-2 right-2 bg-red-950/80 hover:bg-red-900 text-red-200 p-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                          >
                            ✕ Remove Photo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingAnnSlide(null)}
                      className="px-4 py-2 bg-[#273647] hover:bg-[#32455a] text-[#d4e4fa] text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCompressingEditAnnImg}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Save Slide Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Your Assignments */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold flex items-center gap-2 text-[#d4e4fa]">
              <span className="material-symbols-outlined text-[#c3c6d7]">
                assignment_turned_in
              </span>
              <span>Your Assignments</span>
            </h3>

            {userAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userAssignments.map((assignment, idx) => (
                  <div key={`${assignment.scheduleId}-${idx}`} className="glass-surface p-6 rounded-2xl border border-white/10 relative overflow-hidden group shadow-md">
                    {assignment.isLive && (
                      <div className="absolute top-0 right-0 p-3">
                        <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          <span>Live Broadcast</span>
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-[#c3c6d7] font-bold text-xs tracking-widest font-mono uppercase truncate pr-20">
                        {assignment.dayName}
                      </p>
                      <h4 className="font-serif text-xl font-bold text-[#d4e4fa]">
                        {assignment.roles.join(' & ')}
                      </h4>
                      {assignment.specialService && (
                        <p className="text-xs text-amber-300/80 font-mono">
                          ✨ {assignment.specialService}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[#909096]">
                        <span className="flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-sm">schedule</span> 
                          {assignment.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span> 
                          Main Sanctuary
                        </span>
                      </div>

                      <div className="pt-4 flex gap-2">
                        <button 
                          onClick={onOpenSwapModal}
                          className="flex-1 bg-[#273647] py-2 rounded-lg border border-[#46464c]/30 text-xs font-bold text-[#d4e4fa] hover:bg-[#10b981]/10 hover:text-[#10b981] hover:border-[#10b981]/30 transition-all cursor-pointer"
                        >
                          Decline / Swap
                        </button>
                        <button 
                          onClick={onNavigateToSchedule}
                          className="px-6 bg-[#3e495d] py-2 rounded-lg text-xs font-bold text-white hover:bg-[#4a5870] transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-surface p-8 rounded-2xl border border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#273647] border border-white/10 flex items-center justify-center text-[#c3c6d7] mx-auto">
                  <span className="material-symbols-outlined text-2xl">event_busy</span>
                </div>
                <h4 className="font-serif text-lg font-bold text-[#d4e4fa]">No Scheduled Assignments</h4>
                <p className="text-xs text-[#909096] max-w-md mx-auto leading-relaxed">
                  You currently have no scheduled shifts or media duties in the active liturgical schedule.
                </p>
                <button
                  onClick={onNavigateToSchedule}
                  className="mt-2 px-5 py-2 bg-[#3e495d] hover:bg-[#4a5870] text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  <span>View Schedule Board</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Weekly Schedule View Table */}
          <div className="glass-surface p-6 rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#d4e4fa]">
                  Weekly Schedule View
                </h3>
                {activeSchedule && (
                  <p className="text-xs text-[#909096] font-mono mt-0.5">
                    {activeSchedule.dayName} {activeSchedule.date ? `(${activeSchedule.date})` : ''}
                  </p>
                )}
              </div>
              
              {schedules.length > 1 && (
                <div className="flex gap-1 items-center">
                  <button 
                    onClick={() => setTableWeekOffset(prev => prev - 1)}
                    className="p-1 hover:bg-[#273647]/50 rounded-full transition-colors text-[#c3c6d7] cursor-pointer"
                    title="Previous Schedule"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className="text-xs text-[#909096] font-mono px-1">
                    Week {((Math.abs(tableWeekOffset) % schedules.length) + 1)} of {schedules.length}
                  </span>
                  <button 
                    onClick={() => setTableWeekOffset(prev => prev + 1)}
                    className="p-1 hover:bg-[#273647]/50 rounded-full transition-colors text-[#c3c6d7] cursor-pointer"
                    title="Next Schedule"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="border-b border-[#46464c]/20 bg-[#010f1f]/50 text-xs text-[#909096] uppercase tracking-wider font-mono">
                  <tr>
                    <th className="px-4 py-3">Time Slot</th>
                    <th className="px-4 py-3">PPT</th>
                    <th className="px-4 py-3">Documentation</th>
                    <th className="px-4 py-3">Reels</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#46464c]/10 text-xs">
                  {activeSchedule && activeSchedule.slots.length > 0 ? (
                    activeSchedule.slots.map((slot) => (
                      <tr key={slot.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-mono text-[#c3c6d7] font-semibold whitespace-nowrap">
                          {slot.time}
                        </td>
                        <td className="px-4 py-4">
                          {renderSlotRoleCell(slot.ppt)}
                        </td>
                        <td className="px-4 py-4">
                          {renderSlotRoleCell(slot.documentation)}
                        </td>
                        <td className="px-4 py-4">
                          {renderSlotRoleCell(slot.reels_editor)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-[#909096] italic">
                        No scheduled slots available for this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Community & Daily Word (4 cols) */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Daily Word */}
          <div className="bg-[#1c2b3c] rounded-2xl border-l-4 border-amber-500/80 shadow-xl overflow-hidden relative group">
            
            {/* Classical Painting Banner Frame */}
            {activeVerseImageUrl && (
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-black/40 border-b border-amber-500/20">
                <img
                  src={activeVerseImageUrl}
                  alt={activeVerseAuthorName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c2b3c] via-[#1c2b3c]/40 to-transparent" />
                
                {/* Artwork Title Badge */}
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-amber-200/90 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-xs text-amber-400">palette</span>
                    <span className="truncate">{activeVerseAuthorName}</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 shrink-0 font-sans italic">Classical Fine Art</span>
                </div>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-[#c3c6d7] font-bold uppercase tracking-widest font-mono flex items-center gap-1">
                    <span>📖</span>
                    <span>Daily Word</span>
                  </p>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#010f1f]/80 text-amber-300 border border-amber-500/30 font-semibold">
                    {isCustomVerseSet ? '✨ Custom Daily Word' : '📖 Word of the Day'}
                  </span>
                </div>

                {(currentUser.isAdmin || currentUser.isSubAdmin) && (
                  <button
                    onClick={handleOpenVerseModal}
                    className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Edit Daily Word"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                    <span>Edit Daily Word</span>
                  </button>
                )}
              </div>

              <blockquote className="font-serif italic text-base sm:text-lg leading-relaxed text-[#d4e4fa] border-l-2 border-amber-400/50 pl-3">
                "{activeVerseQuote}"
              </blockquote>
              <p className="text-xs text-amber-300/90 text-right font-mono font-semibold">— {activeVerseReference}</p>
            </div>
          </div>

          {/* Edit Daily Verse Modal */}
          {showVerseModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0b1928] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">auto_awesome</span>
                    <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">Edit Daily Word</h3>
                  </div>
                  <button
                    onClick={() => setShowVerseModal(false)}
                    className="text-[#909096] hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSaveCustomVerse} className="space-y-4">
                  <div className="bg-[#010f1f]/80 p-3 rounded-xl border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-mono">
                    💡 <strong>Automatic Rotation:</strong> Daily Word and artwork rotate every day. Customize the word reflection and artwork below to override.
                  </div>

                  {/* Painting Preview & Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-400 text-sm">palette</span>
                      Select Featured Artwork / Painting
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_PAINTINGS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEditVerseImgUrl(p.url);
                            setEditVerseAuthorName(p.name);
                          }}
                          className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            editVerseImgUrl === p.url 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200' 
                              : 'bg-[#1c2b3c] border-[#46464c] hover:border-amber-500/50 text-[#909096]'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg shrink-0 border border-amber-500/30"
                          />
                          <span className="text-[11px] font-sans font-medium line-clamp-2 leading-tight">
                            {p.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[11px] text-[#909096] font-mono">Custom Painting Image URL</label>
                      <input
                        type="url"
                        value={editVerseImgUrl}
                        onChange={(e) => setEditVerseImgUrl(e.target.value)}
                        className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-2.5 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-mono"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-[#909096] font-mono">Painting Title / Artwork Caption</label>
                      <input
                        type="text"
                        value={editVerseAuthorName}
                        onChange={(e) => setEditVerseAuthorName(e.target.value)}
                        className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-2.5 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-sans"
                        placeholder="e.g. Saint Paul the Apostle writing Epistles"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono">Daily Word Quote / Reflection</label>
                    <textarea
                      rows={3}
                      value={editVerseQuote}
                      onChange={(e) => setEditVerseQuote(e.target.value)}
                      className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-sm text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-serif"
                      placeholder="Enter daily word reflection or quote..."
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#c3c6d7] font-mono">Scripture / Reflection Reference</label>
                    <input
                      type="text"
                      value={editVerseRef}
                      onChange={(e) => setEditVerseRef(e.target.value)}
                      className="w-full bg-[#1c2b3c] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-mono"
                      placeholder="e.g. Colossians 3:17"
                      required
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/10">
                    {isCustomVerseSet ? (
                      <button
                        type="button"
                        onClick={handleResetToAutoVerse}
                        className="px-4 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/40 text-xs font-bold rounded-xl transition-all cursor-pointer font-mono"
                      >
                        Reset Auto Rotation
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#909096] italic font-mono">Auto rotation active</span>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowVerseModal(false)}
                        className="px-4 py-2 bg-[#273647] hover:bg-[#32455a] text-[#d4e4fa] text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        Save Daily Word
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SocCom of the Month */}
          <div className="glass-surface p-6 rounded-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#d4e4fa]">SocCom of the Month</h3>
              <span className="material-symbols-outlined text-[#c3c6d7]">
                workspace_premium
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <img 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 shadow-sm" 
                src={soccomOfMonth.workImages[0] || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8Svj41Q3Y0O1TZayIExCB4qqrcY0XCOw5d86SEGE-mKiol8YbciAcQzezCSZNgVmu6GLBaFtO-XAMDU23Lkv-N-9zwECXhNstd2OZglhxIWZJunrC0mf10U78OoLM75OVFo2uVTojzYG7jIz5NsyzSvIjXq1FFrbBSz0rJ8Nee7nBF2c3bLhATeDoMipIxNG-lc0GcEAXranIC_FuIdVFVigSV-8MhurWNeUILFeHJqVKuDg1EnaQ"} 
                alt="Camera work" 
                referrerPolicy="no-referrer"
              />
              <img 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 shadow-sm" 
                src={soccomOfMonth.workImages[1] || "https://lh3.googleusercontent.com/aida-public/AB6AXuBt26Qd3eulF2jmL0l299blf3vgV48yH6a_URdrmLK6-4cAJmurBf-Tc3O6iUcR9-UKZQsPgfq-tTCt_vNbOSI97d0fK0tHQ7GZFtK_z5pW0bpvy1xP6iPzl8B2lu7pSJP7KIboXBdJtpq7eOMVwA4U_ZNrkZSSkNeolKTNw0THt_rSLUun789SoVbEKLDK5Rp-lOmwpjBjN6VL37AoPJoscjK88xhZS9xwzB9hEekTd6xdaSv-E3aM"} 
                alt="Console engineering" 
                referrerPolicy="no-referrer"
              />
              <img 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 shadow-sm" 
                src={soccomOfMonth.workImages[2] || "https://lh3.googleusercontent.com/aida-public/AB6AXuCw4mg_cFo35G4M2QmSmlwboTVb4eq1GHgF62vyoDgzReRq1M9fNVpzS_ZKyahhqyiQVUpgBzmkoknsYa6hQuvM6OSLK1uRY7DKzsoIB-xWo7Qtee5IycTn2ih27SGslG3lcj4DzxCN495Z9CSO-KNiJKjUXJ_b6ILVSazsE4k5zdgyy-tjK4LcdUH-IW24BStcHpNBklhF9P_xG8hmM87f78Hb3MrPiMcpfaeNdZj2PSiXizDmG8qR"} 
                alt="Altar documentation" 
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <h4 className="font-bold text-[#c3c6d7] font-serif text-lg">
                {soccomOfMonth.name || "Maria Clara"}
              </h4>
              <p className="text-xs text-[#909096] leading-relaxed mt-1">
                {soccomOfMonth.description || "Recognized for exceptional dedication in managing the Easter Vigil Livestream, ensuring a seamless experience for 5,000+ online viewers."}
              </p>
            </div>
          </div>

          {/* Announcements Bulletin */}
          <div className="glass-surface p-6 rounded-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2 text-[#d4e4fa]">
                <span className="material-symbols-outlined text-amber-400">
                  notifications_active
                </span>
                <span>Ministry Bulletin</span>
              </h3>
              {Boolean(currentUser) && (
                <button
                  type="button"
                  onClick={() => {
                    const formEl = document.getElementById('announcement-upload-form');
                    if (formEl) {
                      formEl.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">add</span>
                  <span>Post Announcement</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-xs italic text-[#909096] p-4 text-center">No active announcements available.</p>
              ) : (
                announcements.map((a) => {
                  const isDailyWordType = a.type === 'daily_word' || a.type === 'bible_verse';
                  const displayTitle = isDailyWordType ? '📖 Daily Bible Verse' : a.title;
                  const displayContent = isDailyWordType ? `"${activeVerseQuote}" — ${activeVerseReference}` : a.content;

                  return (
                    <div key={a.id} className="p-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all flex items-start justify-between gap-3 group relative">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0 mt-0.5">
                          {a.type === 'birthday' ? 'cake' : isDailyWordType ? 'menu_book' : a.type === 'event' ? 'event' : 'campaign'}
                        </span>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#d4e4fa] truncate">{displayTitle}</p>
                            <span className="text-[9px] text-amber-300/80 uppercase font-mono font-bold shrink-0">{a.date}</span>
                          </div>
                          <p className="text-[11px] text-[#909096] leading-snug line-clamp-2">{displayContent}</p>
                        </div>
                      </div>

                      {Boolean(currentUser) && (
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAnnSlide(a.id)}
                            className="p-1 text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Edit announcement"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                          {onDeleteAnnouncement && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete announcement "${a.title}"?`)) {
                                  onDeleteAnnouncement(a.id);
                                }
                              }}
                              className="p-1 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Delete announcement"
                            >
                              <span className="material-symbols-outlined text-xs">delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 🏆 Edit Member Spotlight / SocCom of the Month Modal */}
      {showEditSpotlightModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#051424] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setShowEditSpotlightModal(false)}
              className="absolute top-4 right-4 text-amber-300 hover:text-white p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-500/30 shrink-0">
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-100 font-serif">Edit Member Spotlight (SocCom of the Month)</h3>
                <p className="text-xs text-amber-300/70">Update the featured member spotlight title, photo & portfolio</p>
              </div>
            </div>

            <form onSubmit={handleSaveSpotlight} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-amber-300 font-mono">Member Full Name</label>
                <input
                  type="text"
                  required
                  value={spotlightName}
                  onChange={(e) => setSpotlightName(e.target.value)}
                  placeholder="e.g. Jose Rizal"
                  className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-amber-100 focus:outline-none focus:border-amber-400 font-serif text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-amber-300 font-mono">Role / Title</label>
                <input
                  type="text"
                  required
                  value={spotlightRole}
                  onChange={(e) => setSpotlightRole(e.target.value)}
                  placeholder="e.g. Lead Reels Editor & Technical Liturgy Steward"
                  className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-2 bg-[#0b1928] p-3 rounded-xl border border-white/10">
                <label className="font-bold text-amber-300 font-mono text-xs flex items-center justify-between">
                  <span>Profile Avatar Photo</span>
                  <span className="text-[10px] text-emerald-400 font-normal">File upload supported</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSpotlightAvatarFileUpload}
                  className="w-full text-xs text-amber-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                />
                <input
                  type="text"
                  value={spotlightAvatar}
                  onChange={(e) => setSpotlightAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/... or upload file above"
                  className="w-full bg-[#051424] border border-[#46464c] rounded-xl p-2 text-amber-100 font-mono text-xs mt-1"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-amber-300 font-mono">Spotlight Description / Citation</label>
                <textarea
                  rows={3}
                  value={spotlightDesc}
                  onChange={(e) => setSpotlightDesc(e.target.value)}
                  placeholder="e.g. Thank you for creating exceptional parish Reels and providing faithful technical liturgy support!"
                  className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2.5 text-amber-100 focus:outline-none focus:border-amber-400 italic"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-amber-300 font-mono block">Work Portfolio Image URLs (3 items)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={spotlightImg1}
                    onChange={(e) => setSpotlightImg1(e.target.value)}
                    placeholder="Work image URL 1..."
                    className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2 text-amber-100 font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={spotlightImg2}
                    onChange={(e) => setSpotlightImg2(e.target.value)}
                    placeholder="Work image URL 2..."
                    className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2 text-amber-100 font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={spotlightImg3}
                    onChange={(e) => setSpotlightImg3(e.target.value)}
                    placeholder="Work image URL 3..."
                    className="w-full bg-[#0b1928] border border-[#46464c] rounded-xl p-2 text-amber-100 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditSpotlightModal(false)}
                  className="px-4 py-2 bg-church-900 hover:bg-church-800 text-amber-300 rounded-xl font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-black font-mono font-bold text-xs rounded-xl shadow-lg cursor-pointer uppercase tracking-wider"
                >
                  💾 Save Member Spotlight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
