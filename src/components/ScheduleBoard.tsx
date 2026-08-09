/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ScheduleRow, Server, SocComRole, ScheduleSlot, ScheduleAuditRecord, SubAdminAttendanceAlert, Announcement, ServiceReceipt } from '../types';
import { Search, Calendar, Award, Info, BookOpen, Plus, Radio, Check, Trash2, Edit3, X, UserCheck, Mail, CheckCircle2, AlertCircle, ShieldAlert, BookOpenText } from 'lucide-react';
import { generateScheduleEmailData, ScheduleEmailDispatchResult } from '../lib/emailNotifier';
import { ScheduleEmailModal } from './ScheduleEmailModal';
import { isSlotFinished } from '../lib/scheduleAudit';

interface ScheduleBoardProps {
  schedules: ScheduleRow[];
  servers: Server[];
  currentUser: Server;
  onUpdateSchedule?: (row: ScheduleRow) => void;
  onAddSchedule?: (row: ScheduleRow) => void;
  onDeleteSchedule?: (id: string) => void;
  onAddAnnouncement?: (ann: Announcement) => void;
  onOpenReflectionModal?: () => void;
  onOpenSwapModal?: () => void;
  auditRecords?: ScheduleAuditRecord[];
  subAdminAlerts?: SubAdminAttendanceAlert[];
  onOpenSubAdminAudit?: () => void;
  onSubmitReceipt?: (receiptData: Omit<ServiceReceipt, 'id' | 'timestamp'>) => void;
}


const ScheduleDeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  if (confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          onDelete();
          setConfirming(false);
        }}
        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 animate-pulse flex items-center gap-1.5 shadow-md"
        title="Confirm deletion"
      >
        <Trash2 className="w-4 h-4" />
        <span>Confirm Delete</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="p-2.5 bg-red-950/40 text-red-400 border border-red-900/40 rounded-xl hover:bg-red-900/60 transition-colors cursor-pointer shrink-0"
      title="Delete Schedule"
    >
      <Trash2 className="w-4.5 h-4.5" />
    </button>
  );
};

function checkIsSlotLiveNow(slotTime: string): boolean {
  try {
    const now = new Date();
    const dayMap: Record<string, number> = {
      Sun: 0, Sunday: 0,
      Mon: 1, Monday: 1,
      Tue: 2, Tuesday: 2,
      Wed: 3, Wednesday: 3,
      Thu: 4, Thursday: 4,
      Fri: 5, Friday: 5,
      Sat: 6, Saturday: 6,
    };

    const currentDay = now.getDay();
    let matchesDay = false;
    for (const [dayStr, dayNum] of Object.entries(dayMap)) {
      if (slotTime.toLowerCase().includes(dayStr.toLowerCase())) {
        if (dayNum === currentDay) {
          matchesDay = true;
        }
      }
    }

    if (!matchesDay) return false;

    const timeMatch = slotTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return false;

    let hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const slotTotalMinutes = hour * 60 + minute;
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    return (
      currentTotalMinutes >= slotTotalMinutes - 10 &&
      currentTotalMinutes <= slotTotalMinutes + 90
    );
  } catch {
    return false;
  }
}

export default function ScheduleBoard({
  schedules,
  servers,
  currentUser,
  onUpdateSchedule,
  onAddSchedule,
  onDeleteSchedule,
  onAddAnnouncement,
  onOpenReflectionModal,
  onOpenSwapModal,
  auditRecords = [],
  subAdminAlerts = [],
  onOpenSubAdminAudit,
  onSubmitReceipt
}: ScheduleBoardProps) {

  const isAdmin = Boolean(currentUser.isAdmin || currentUser.isSubAdmin);

  // Reflection submission modal state
  const [reflectionModalData, setReflectionModalData] = useState<{
    date: string;
    time: string;
    dayName: string;
    serverId: string;
    serverName: string;
    role: SocComRole;
  } | null>(null);
  const [reflectionInputText, setReflectionInputText] = useState<string>('');

  // Separate schedules into regular and special
  const regularSchedules = useMemo(() => schedules.filter(s => !s.isSpecial), [schedules]);
  const specialSchedules = useMemo(() => schedules.filter(s => s.isSpecial), [schedules]);

  // Selected schedule rows for both tables
  const [selectedRegId, setSelectedRegId] = useState<string>('');
  const [selectedSpecId, setSelectedSpecId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Special Service Modal State
  const [showSpecialModal, setShowSpecialModal] = useState<boolean>(false);
  const [specialTitle, setSpecialTitle] = useState<string>('');
  const [specialDate, setSpecialDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [specialTime, setSpecialTime] = useState<string>('05:30 PM');
  const [specialPpt, setSpecialPpt] = useState<string[]>([]);
  const [specialDoc, setSpecialDoc] = useState<string[]>([]);
  const [specialReels, setSpecialReels] = useState<string[]>([]);

  // Quick Slot Edit Modal State
  const [editingSlot, setEditingSlot] = useState<{ slot: ScheduleSlot; schedule: ScheduleRow } | null>(null);
  const [editSlotTime, setEditSlotTime] = useState<string>('');
  const [editSlotLive, setEditSlotLive] = useState<boolean>(false);
  const [editSlotPpt, setEditSlotPpt] = useState<string[]>([]);
  const [editSlotDoc, setEditSlotDoc] = useState<string[]>([]);
  const [editSlotReels, setEditSlotReels] = useState<string[]>([]);

  // Schedule Email Notification Modal State
  const [emailModalData, setEmailModalData] = useState<ScheduleEmailDispatchResult | null>(null);

  const handleTriggerScheduleEmailAlerts = async (schedule: ScheduleRow) => {
    const dispatch = generateScheduleEmailData(schedule, servers);
    setEmailModalData(dispatch);

    // Auto-dispatch email via server API route if assigned recipients exist
    if (dispatch.batchEmails.length > 0) {
      try {
        const resp = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dispatch.individualDispatches.length > 0 ? dispatch.individualDispatches : {
            from: currentUser.email || 'adrich.glife.abelon@gmail.com',
            to: dispatch.batchEmails.join(','),
            subject: dispatch.subject,
            text: dispatch.body
          })
        });
        const resData = await resp.json().catch(() => ({}));
        if (!resp.ok || !resData.success) {
          alert(`⚠️ Email Dispatch Notice: ${resData.error || 'Failed to send email. Please check Vercel environment variables.'}`);
        }
      } catch (err) {
        console.error('Failed to auto-dispatch schedule email:', err);
      }
    }

    // Always create an announcement so Community Hub & Master Schedule announcements are updated
    if (onAddAnnouncement) {
      onAddAnnouncement({
        id: `ann-sched-${Date.now()}`,
        title: `⛪ Schedule Updated: ${schedule.dayName}`,
        content: `Master schedule for ${schedule.dayName} (${schedule.date}) has been updated! ${dispatch.batchEmails.length > 0 ? `${dispatch.notifiedCount} assigned server(s) notified via email.` : 'Schedule changes published to portal.'}`,
        type: 'reminder',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }
  };

  const openEditSlotModal = (slot: ScheduleSlot, schedule: ScheduleRow) => {
    setEditingSlot({ slot, schedule });
    setEditSlotTime(slot.time);
    setEditSlotLive(!!slot.isGoingLive);
    setEditSlotPpt(Array.isArray(slot.ppt) ? slot.ppt : []);
    setEditSlotDoc(Array.isArray(slot.documentation) ? slot.documentation : []);
    setEditSlotReels(Array.isArray(slot.reels_editor) ? slot.reels_editor : []);
  };

  const handleSaveSlotEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !onUpdateSchedule) return;

    const { slot, schedule } = editingSlot;
    const updatedSlots = schedule.slots.map(s => {
      if (s.id === slot.id) {
        return {
          ...s,
          time: editSlotTime,
          isGoingLive: editSlotLive,
          ppt: editSlotPpt,
          documentation: editSlotDoc,
          reels_editor: editSlotReels
        };
      }
      return s;
    });

    const updatedSchedule = {
      ...schedule,
      slots: updatedSlots
    };

    onUpdateSchedule(updatedSchedule);
    handleTriggerScheduleEmailAlerts(updatedSchedule);

    setEditingSlot(null);
  };

  // Synchronize initial selections
  useEffect(() => {
    if (!selectedRegId && regularSchedules.length > 0) {
      setSelectedRegId(regularSchedules[0].id);
    }
  }, [regularSchedules, selectedRegId]);

  useEffect(() => {
    if (!selectedSpecId && specialSchedules.length > 0) {
      setSelectedSpecId(specialSchedules[0].id);
    }
  }, [specialSchedules, selectedSpecId]);

  // Find currently selected schedules
  const currentRegSchedule = useMemo(() => {
    return regularSchedules.find(s => s.id === selectedRegId) || regularSchedules[0];
  }, [regularSchedules, selectedRegId]);

  const currentSpecSchedule = useMemo(() => {
    return specialSchedules.find(s => s.id === selectedSpecId) || specialSchedules[0];
  }, [specialSchedules, selectedSpecId]);

  // Map server ID to Server object for rendering pictures & names
  const serverMap = useMemo(() => {
    const map: Record<string, Server> = {};
    servers.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [servers]);

  // Check if a server name matches search query
  const isServerHighlighted = (serverId: string | null) => {
    if (!searchQuery || !serverId) return false;
    const server = serverMap[serverId];
    if (!server) return false;
    return server.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Helper to render Server Badge with picture, name, and service status email buttons
  const renderServerBadges = (
    serverIds: string[] | string | undefined,
    role: SocComRole,
    slotTime: string = 'Mass Slot',
    dayName: string = 'Liturgy Day',
    scheduleRowDate?: string,
    slotId?: string
  ) => {
    const actualIds = Array.isArray(serverIds)
      ? serverIds
      : (typeof serverIds === 'string' && serverIds ? [serverIds] : []);

    if (actualIds.length === 0) {
      return (
        <span className="text-[#909096]/70 italic text-xs block py-1 font-sans font-medium">
          No server
        </span>
      );
    }

    const slotFinished = scheduleRowDate ? isSlotFinished(scheduleRowDate, slotTime) : false;

    return (
      <div className="flex flex-col gap-1.5 py-1">
        {actualIds.map((serverId) => {
          const server = serverMap[serverId];
          if (!server) return null;
          const isMatch = isServerHighlighted(serverId);

          // Find audit record if finished
          const auditRec = slotFinished && slotId
            ? auditRecords.find(r => r.slotId === slotId && r.serverId === serverId && r.role === role)
            : null;

          return (
            <div
              key={serverId}
              className={`flex flex-col gap-1 p-2 rounded-xl border transition-all duration-300 ${
                isMatch
                  ? 'bg-[#0b57d0]/30 border-[#0b57d0] ring-2 ring-[#0b57d0]/50 scale-[1.02] text-white'
                  : 'bg-[#0d1c2d] border-[#46464c]/40 hover:border-white/20 text-[#d4e4fa]'
              }`}
            >
              <div className="flex items-center gap-2">
                <img
                  src={server.picture}
                  alt={server.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-white/20 shadow-sm shrink-0"
                />
                <span className="text-xs font-bold truncate">
                  {server.name}
                </span>
              </div>

              {/* Status Indicator Badge for Finished Mass Services */}
              {slotFinished && (
                <div className="text-[10px] font-mono font-bold pt-0.5 space-y-1">
                  {auditRec?.status === 'attended' && (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      🟢 Attended & Reflected
                    </span>
                  )}
                  {auditRec?.status === 'unresponsive_absent' && (
                    <span className="inline-flex items-center gap-1 text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/40">
                      🔴 Unresponsive / Absent Notice
                    </span>
                  )}
                  {auditRec?.status === 'substituted' && (
                    <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      🟡 Substituted
                    </span>
                  )}
                  {auditRec?.status === 'excused' && (
                    <span className="inline-flex items-center gap-1 text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/30">
                      🔵 Excused
                    </span>
                  )}
                  {!auditRec && (
                    <span className="inline-flex items-center gap-1 text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                      ⌛ Service Concluded
                    </span>
                  )}

                  {/* Reflection Submission Action Button - Only the assigned server can submit their own reflection */}
                  {currentUser.id === server.id && auditRec?.status !== 'attended' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReflectionModalData({
                          date: scheduleRowDate || '',
                          time: slotTime,
                          dayName: dayName || 'Liturgical Mass Service',
                          serverId: server.id,
                          serverName: server.name,
                          role: role
                        });
                        setReflectionInputText('');
                      }}
                      className="mt-1 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer w-full justify-center shadow-sm"
                      title="Submit spiritual reflection & record attendance"
                    >
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span>✍️ Add Reflection</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };


  // Handle submitting Special Service form
  const handleSaveSpecialService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialTitle || !specialDate) return;

    const newSlot: ScheduleSlot = {
      id: `slot-spec-${Date.now()}`,
      time: specialTime,
      ppt: specialPpt,
      live_server: [],
      documentation: specialDoc,
      reels_editor: specialReels,
      isGoingLive: true
    };

    const newSpecialRow: ScheduleRow = {
      id: `sched-spec-${Date.now()}`,
      dayName: specialTitle,
      date: specialDate,
      specialService: 'Special Liturgy',
      isLive: true,
      isSpecial: true,
      slots: [newSlot]
    };

    if (onAddSchedule) {
      onAddSchedule(newSpecialRow);
      handleTriggerScheduleEmailAlerts(newSpecialRow);
    }

    setSpecialTitle('');
    setSpecialPpt([]);
    setSpecialDoc([]);
    setSpecialReels([]);
    setShowSpecialModal(false);
    alert('Special Service published successfully and presented on the servers board!');
  };

  // Helper to check if a schedule date matches today
  const isScheduleDateToday = (dateStr: string) => {
    if (!dateStr) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return true;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const todayDate = new Date();
      return (
        parsed.getFullYear() === todayDate.getFullYear() &&
        parsed.getMonth() === todayDate.getMonth() &&
        parsed.getDate() === todayDate.getDate()
      );
    }
    return false;
  };

  // Render Schedule Table with strictly 3 roles: PPT, Documentation, Reels
  const renderScheduleTable = (currentSchedule: ScheduleRow | undefined) => {
    if (!currentSchedule) {
      return (
        <div className="text-center py-12 glass-surface rounded-2xl border border-white/10">
          <BookOpen className="w-8 h-8 text-[#909096] mx-auto mb-2" />
          <p className="text-xs text-[#909096] font-serif">No liturgy schedules published here yet.</p>
        </div>
      );
    }

    const isAdmin = currentUser.isAdmin || currentUser.isSubAdmin;
    const isToday = isScheduleDateToday(currentSchedule.date);

    return (
      <div
        id={`schedule-card-${currentSchedule.id}`}
        className="overflow-hidden rounded-2xl border border-white/10 glass-surface shadow-xl"
      >
        {/* Header Bar */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 bg-[#051424]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase font-bold bg-[#0b57d0]/20 text-[#b2c5ff] px-2.5 py-0.5 rounded-full border border-[#0b57d0]/30">
                {currentSchedule.date} {isToday ? '• TODAY' : ''}
              </span>
              {currentSchedule.specialService && (
                <span className="text-[10px] font-sans font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  {currentSchedule.specialService}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#d4e4fa] tracking-tight font-serif">
              {currentSchedule.dayName}
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="text-right">
              <span className="text-xs font-mono text-[#909096] block">
                Mass Slots: {currentSchedule.slots.length}
              </span>
              <span className="text-[10px] text-[#909096] block font-serif italic mt-0.5">
                Mary Help of Christians Parish SocCom
              </span>
            </div>
            {isAdmin && onDeleteSchedule && (
              <ScheduleDeleteButton onDelete={() => onDeleteSchedule(currentSchedule.id)} />
            )}
          </div>
        </div>

        {/* Desktop Table View - 3 Ministry Columns: PPT, Documentation, Reels */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#051424]/80 border-b border-white/10 text-[#909096] text-[10px] font-mono uppercase tracking-widest">
                <th className="py-4 px-6 font-bold w-[25%]">LITURGICAL MASS TIME</th>
                <th className="py-4 px-4 font-bold w-[25%]">
                  <span className="text-[#b2c5ff]">❖</span> PPT
                </th>
                <th className="py-4 px-4 font-bold w-[25%]">
                  <span className="text-emerald-400">❖</span> DOCUMENTATION
                </th>
                <th className="py-4 px-4 font-bold w-[25%]">
                  <span className="text-amber-400">❖</span> REELS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentSchedule.slots.map((slot) => {
                const isSlotLive = !!slot.isGoingLive || !!currentSchedule.isLive;

                // Check if current day & time matches slot time
                const isLiveNow = checkIsSlotLiveNow(slot.time);

                return (
                  <tr
                    key={slot.id}
                    className={`transition-all duration-300 ${
                      isSlotLive
                        ? 'bg-red-950/30 border-l-4 border-l-red-500 border border-red-500/40 shadow-md'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Liturgical Mass Time + Red Live Banner if Live */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className={`font-bold text-sm block ${isSlotLive ? 'text-red-200' : 'text-[#d4e4fa]'}`}>
                            {slot.time}
                          </span>
                          
                          {/* Live indicator / Admin toggle */}
                          <div className="mt-1 flex items-center gap-2">
                            {/* If flagged live, mark red and show LIVE badge when scheduled, LIVE NOW when time matches */}
                            {isSlotLive && (
                              isLiveNow ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-lg shadow-red-600/60 animate-pulse border border-red-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                  LIVE NOW
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-red-900/80 text-red-100 px-2.5 py-0.5 rounded-full border border-red-500/80">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                  LIVE
                                </span>
                              )
                            )}

                            {/* Edit Slot Button: VISIBLE TO ADMINS */}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => openEditSlotModal(slot, currentSchedule)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-gold-300 hover:text-white bg-gold-500/10 hover:bg-gold-500/20 px-2.5 py-1 rounded-lg border border-gold-500/30 transition-all cursor-pointer"
                                title="Edit slot text and assignments"
                              >
                                <Edit3 className="w-3 h-3 text-gold-400" />
                                <span>Edit Text</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 1. PPT */}
                    <td className="py-3 px-4">
                      {renderServerBadges(slot.ppt, 'ppt', slot.time, currentSchedule.dayName, currentSchedule.date, slot.id)}
                    </td>

                    {/* 2. DOCUMENTATION */}
                    <td className="py-3 px-4">
                      {renderServerBadges(slot.documentation, 'documentation', slot.time, currentSchedule.dayName, currentSchedule.date, slot.id)}
                    </td>

                    {/* 3. REELS */}
                    <td className="py-3 px-4">
                      {renderServerBadges(slot.reels_editor, 'reels_editor', slot.time, currentSchedule.dayName, currentSchedule.date, slot.id)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden p-4 space-y-4 divide-y divide-white/10">
          {currentSchedule.slots.map((slot, index) => {
            const isSlotLive = !!slot.isGoingLive || !!currentSchedule.isLive;
            const isLiveNow = checkIsSlotLiveNow(slot.time);

            return (
              <div
                key={slot.id}
                className={`pt-4 ${index === 0 ? 'pt-0' : ''} p-3.5 rounded-2xl transition-all ${
                  isSlotLive ? 'bg-red-950/30 border-2 border-red-500/80 shadow-md' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className={`font-bold text-sm ${isSlotLive ? 'text-red-200' : 'text-[#d4e4fa]'}`}>
                    {slot.time}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    {isSlotLive && (
                      isLiveNow ? (
                        <span className="bg-red-600 text-white text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full animate-pulse shadow-md shadow-red-600/50 border border-red-400">
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="bg-red-900/80 text-red-100 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-red-500/80">
                          LIVE
                        </span>
                      )
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => openEditSlotModal(slot, currentSchedule)}
                        className="text-[10px] font-bold text-gold-300 font-mono flex items-center gap-1 cursor-pointer bg-gold-500/10 hover:bg-gold-500/20 px-2 py-1 rounded-lg border border-gold-500/30"
                        title="Edit slot text and assignments"
                      >
                        <Edit3 className="w-3 h-3 text-gold-400" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* PPT */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase text-[#b2c5ff] block tracking-wider font-bold">1. PPT</span>
                    {renderServerBadges(slot.ppt, 'ppt', slot.time, currentSchedule.dayName, currentSchedule.date, slot.id)}
                  </div>

                  {/* Documentation */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase text-emerald-400 block tracking-wider font-bold">2. Documentation</span>
                    {renderServerBadges(slot.documentation, 'documentation', slot.time, currentSchedule.dayName, currentSchedule.date, slot.id)}
                  </div>

                  {/* Reels */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase text-amber-400 block tracking-wider font-bold">3. Reels</span>
                    {renderServerBadges(slot.reels_editor, 'reels_editor', slot.time, currentSchedule.dayName, currentSchedule.date, slot.id)}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-[#051424] border-t border-white/10 flex items-center gap-2.5 text-xs text-[#909096]">
          <Info className="w-4 h-4 text-[#0b57d0] shrink-0" />
          <p className="leading-relaxed font-sans">
            To view assigned media: type a server name in the Spotlight Filter above to highlight their mass shifts instantly.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Spotlight Filter Panel */}
      <div className="glass-surface p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#0b57d0]/20 p-2.5 rounded-xl border border-[#0b57d0]/30 text-[#b2c5ff]">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#d4e4fa] uppercase tracking-wider">Spotlight Filter</h4>
            <p className="text-[11px] text-[#909096]">Instantly highlight mass slots for a specific server</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Type server's name to spotlight..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#051424] text-[#d4e4fa] text-xs font-semibold rounded-xl pl-10 pr-4 py-3 border border-[#46464c]/40 focus:outline-none focus:border-[#0b57d0] placeholder-[#909096]"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#909096]" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-[#909096] hover:text-white text-xs px-2.5 py-1 rounded bg-[#273647]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Schedule Boards Grid */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* TABLE 1: Sunday Liturgy Schedule Board */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-surface p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#b2c5ff]" />
              <h3 className="font-bold text-sm text-[#d4e4fa] uppercase tracking-wider font-mono">
                1. Regular Sunday Liturgies
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#909096] font-bold whitespace-nowrap">Selected Weekend:</label>
              <select
                value={selectedRegId}
                onChange={(e) => setSelectedRegId(e.target.value)}
                className="bg-[#051424] text-[#d4e4fa] text-xs font-semibold rounded-xl px-3 py-2 border border-[#46464c]/40 focus:outline-none cursor-pointer"
              >
                {regularSchedules.map((sched) => (
                  <option key={sched.id} value={sched.id}>
                    {sched.dayName} ({sched.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderScheduleTable(currentRegSchedule)}
        </div>

        {/* TABLE 2: Special Feast Services Schedule */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-surface p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-[#d4e4fa] uppercase tracking-wider font-mono flex items-center gap-1.5">
                2. Special Services & Feast Liturgies <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">FIESTA</span>
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#909096] font-bold whitespace-nowrap">Selected Feast:</label>
              <select
                value={selectedSpecId}
                onChange={(e) => setSelectedSpecId(e.target.value)}
                className="bg-[#051424] text-[#d4e4fa] text-xs font-semibold rounded-xl px-3 py-2 border border-[#46464c]/40 focus:outline-none cursor-pointer"
              >
                {specialSchedules.map((sched) => (
                  <option key={sched.id} value={sched.id}>
                    {sched.dayName} ({sched.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderScheduleTable(currentSpecSchedule)}
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 🌟 DOWN BUTTON / BOTTOM ACTION BAR: SPECIAL SERVICE BUTTON */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#051424]/80 p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div>
          <h4 className="font-serif text-xl font-bold text-[#d4e4fa] flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Special Service Presentation</span>
          </h4>
          <p className="text-xs text-[#909096] mt-0.5">
            Fill out a special liturgy entry (Fiesta Mass, Holy Day, Wedding, Funeral) and present it directly on the servers schedule board.
          </p>
        </div>

        <button
          onClick={() => setShowSpecialModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer shrink-0 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Special Service</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SPECIAL SERVICE FORM MODAL */}
      {/* ------------------------------------------------------------- */}
      {showSpecialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-surface max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#d4e4fa]">Special Service Form</h3>
                  <p className="text-xs text-[#909096]">Fill out and present on the servers schedule board</p>
                </div>
              </div>

              <button
                onClick={() => setShowSpecialModal(false)}
                className="text-[#909096] hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSpecialService} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#c3c6d7] uppercase mb-1">
                  Special Service Title / Event
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parish Fiesta Mass & Procession"
                  value={specialTitle}
                  onChange={(e) => setSpecialTitle(e.target.value)}
                  className="w-full bg-[#051424] border border-[#46464c]/40 rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#c3c6d7] uppercase mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={specialDate}
                    onChange={(e) => setSpecialDate(e.target.value)}
                    className="w-full bg-[#051424] border border-[#46464c]/40 rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#c3c6d7] uppercase mb-1">
                    Mass Service Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:30 PM"
                    value={specialTime}
                    onChange={(e) => setSpecialTime(e.target.value)}
                    className="w-full bg-[#051424] border border-[#46464c]/40 rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Assignments for the 3 Roles */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-mono font-bold text-amber-300 uppercase">Assign Ministry Media (3 Roles):</p>
                
                {/* PPT */}
                <div>
                  <label className="block text-[11px] font-bold text-[#b2c5ff] mb-1">1. PPT Assigned Media:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-[#051424] rounded-xl border border-white/5">
                    {servers.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSpecialPpt(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          specialPpt.includes(s.id)
                            ? 'bg-[#0b57d0] text-white border-[#0b57d0]'
                            : 'bg-[#122131] text-[#909096] border-white/5 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Documentation */}
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">2. Documentation Assigned Media:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-[#051424] rounded-xl border border-white/5">
                    {servers.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSpecialDoc(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          specialDoc.includes(s.id)
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-[#122131] text-[#909096] border-white/5 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reels */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1">3. Reels Assigned Media:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-[#051424] rounded-xl border border-white/5">
                    {servers.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSpecialReels(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          specialReels.includes(s.id)
                            ? 'bg-amber-500 text-black font-bold border-amber-400'
                            : 'bg-[#122131] text-[#909096] border-white/5 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowSpecialModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#46464c]/40 text-xs font-bold text-[#909096] hover:text-[#d4e4fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-lg shadow-amber-500/20 uppercase tracking-wider"
                >
                  Present Special Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ Quick Edit Slot Text & Assignments Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-church-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b1928] border border-gold-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setEditingSlot(null)}
              className="absolute top-4 right-4 text-gold-400/60 hover:text-gold-200 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gold-100 font-serif">Edit Mass Slot Text & Assignments</h3>
                <p className="text-xs text-gold-300/70">Modify liturgy time, assigned media servants, and broadcast status.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSlotEdit} className="space-y-4">
              
              {/* Mass Time Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gold-300">Liturgical Mass Slot Time / Title</label>
                <input
                  type="text"
                  required
                  value={editSlotTime}
                  onChange={(e) => setEditSlotTime(e.target.value)}
                  placeholder="e.g. Sunday 7:30 AM (High Mass)"
                  className="w-full bg-[#051424] border border-[#46464c] rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0] font-mono font-bold"
                />
              </div>

              {/* Go Live Toggle */}
              <div className="p-3 bg-[#051424] rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gold-200 font-mono">Live Broadcast Mode</p>
                  <p className="text-[10px] text-gold-400/60 font-mono">Enable red live stream indicator for this Mass</p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSlotLive}
                    onChange={(e) => setEditSlotLive(e.target.checked)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                  <span>{editSlotLive ? 'LIVE STREAMING' : 'OFF'}</span>
                </label>
              </div>

              {/* 1. PPT Team Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#b2c5ff]">1. PPT / Slide Operators:</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-2.5 bg-[#051424] rounded-xl border border-white/10">
                  {servers.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setEditSlotPpt(prev =>
                          prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                        editSlotPpt.includes(s.id)
                          ? 'bg-[#0b57d0] text-white font-bold border-[#0b57d0]'
                          : 'bg-[#122131] text-[#909096] border-white/5 hover:text-white'
                      }`}
                    >
                      {editSlotPpt.includes(s.id) ? '✓ ' : ''}{s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Documentation Team Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-emerald-400">2. Documentation / Photographers:</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-2.5 bg-[#051424] rounded-xl border border-white/10">
                  {servers.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setEditSlotDoc(prev =>
                          prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                        editSlotDoc.includes(s.id)
                          ? 'bg-emerald-600 text-white font-bold border-emerald-500'
                          : 'bg-[#122131] text-[#909096] border-white/5 hover:text-white'
                      }`}
                    >
                      {editSlotDoc.includes(s.id) ? '✓ ' : ''}{s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Reels Team Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-amber-400">3. Reels / Video Editors:</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-2.5 bg-[#051424] rounded-xl border border-white/10">
                  {servers.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setEditSlotReels(prev =>
                          prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                        editSlotReels.includes(s.id)
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-[#122131] text-[#909096] border-white/5 hover:text-white'
                      }`}
                    >
                      {editSlotReels.includes(s.id) ? '✓ ' : ''}{s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 text-xs font-semibold text-gold-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-gold-500 hover:bg-gold-400 text-church-950 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Slot Text & Assignments
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Reflection & Attendance Submission Modal */}
      {reflectionModalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c1a29] border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">Submit Reflection & Confirm Attendance</h3>
              </div>
              <button
                type="button"
                onClick={() => setReflectionModalData(null)}
                className="text-[#909096] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#08121e] rounded-xl border border-white/10 text-xs space-y-1">
              <p className="font-bold text-amber-200 text-sm">{reflectionModalData.serverName}</p>
              <p className="text-amber-400/80 font-mono text-[11px] font-semibold">{reflectionModalData.dayName} • {reflectionModalData.date} @ {reflectionModalData.time}</p>
              <p className="text-[#909096] uppercase text-[10px] font-mono font-bold pt-0.5">Assigned Role: {reflectionModalData.role.replace('_', ' ').toUpperCase()}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-100 flex items-center justify-between">
                <span>Spiritual Service Reflection:</span>
                <span className="text-[10px] font-mono text-amber-400/70 font-normal">Records attendance automatically</span>
              </label>
              <textarea
                rows={4}
                value={reflectionInputText}
                onChange={(e) => setReflectionInputText(e.target.value)}
                placeholder="Share your personal reflection on today's Mass service (e.g. homily insights, technical production stewardship, guiding the parish to prayer)..."
                className="w-full bg-[#08121e] border border-[#46464c] rounded-xl p-3 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-serif leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReflectionModalData(null)}
                className="px-4 py-2 text-xs font-bold text-[#909096] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reflectionInputText.trim()}
                onClick={() => {
                  if (onSubmitReceipt && reflectionInputText.trim()) {
                    onSubmitReceipt({
                      date: reflectionModalData.date,
                      time: reflectionModalData.time,
                      dayName: reflectionModalData.dayName,
                      serverId: reflectionModalData.serverId,
                      serverName: reflectionModalData.serverName,
                      role: reflectionModalData.role,
                      reflection: reflectionInputText.trim()
                    });
                    setReflectionModalData(null);
                    setReflectionInputText('');
                  }
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-church-950 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Attendance & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Email Dispatch Modal */}
      {emailModalData && (
        <ScheduleEmailModal
          dispatchResult={emailModalData}
          onClose={() => setEmailModalData(null)}
        />
      )}

    </div>
  );
}
