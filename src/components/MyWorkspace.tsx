/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Server, ScheduleRow, SubstitutionRequest, ServiceReceipt, SocComRole, ScheduleAuditRecord } from '../types';
import { formatBirthdayForDisplay, formatBirthdayForInput } from '../lib/birthdayUtils';
import { compressImage } from '../lib/imageUtils';
import { isSlotFinished, isPastTenPmCutoff } from '../lib/scheduleAudit';
import { 
  User, 
  Upload, 
  CalendarClock, 
  XCircle, 
  CheckCircle, 
  ClipboardCheck, 
  MessageSquareHeart, 
  ArrowLeftRight, 
  Heart,
  Search,
  Check,
  AlertTriangle,
  FlameKindling
} from 'lucide-react';

interface MyWorkspaceProps {
  currentUser: Server;
  schedules: ScheduleRow[];
  servers: Server[];
  subRequests: SubstitutionRequest[];
  auditRecords?: ScheduleAuditRecord[];
  receipts?: ServiceReceipt[];
  onUpdateProfile: (picture: string) => void;
  onUpdateServer?: (server: Server) => void;
  onUpdateWorkImages?: (images: string[]) => void;
  onSendSubRequest: (req: Omit<SubstitutionRequest, 'id' | 'timestamp' | 'status'>) => void;
  onRespondSubRequest: (requestId: string, accept: boolean) => void;
  onSubmitReceipt: (receipt: Omit<ServiceReceipt, 'id' | 'timestamp'>) => void;
}

export default function MyWorkspace({
  currentUser,
  schedules,
  servers,
  subRequests,
  auditRecords = [],
  receipts = [],
  onUpdateProfile,
  onUpdateServer,
  onUpdateWorkImages,
  onRespondSubRequest,
  onSendSubRequest,
  onSubmitReceipt
}: MyWorkspaceProps) {
  // Local state for profile image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Local state for bio text
  const [bioText, setBioText] = useState<string>(currentUser.bio || '');
  const [showBdayPicker, setShowBdayPicker] = useState<boolean>(false);

  // Local state for 3 work portfolio images
  const [workImages, setWorkImages] = useState<string[]>(
    currentUser.workImages && currentUser.workImages.length === 3
      ? currentUser.workImages
      : [
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
        ]
  );

  const handleWorkImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        const newImgs = [...workImages];
        newImgs[index] = compressed;
        setWorkImages(newImgs);
        if (onUpdateWorkImages) onUpdateWorkImages(newImgs);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image. Please try another photo.');
      }
    }
  };

  const handleWorkUrlChange = (index: number, url: string) => {
    const newImgs = [...workImages];
    newImgs[index] = url;
    setWorkImages(newImgs);
  };

  const handleSavePortfolioAndBio = () => {
    const updatedServer: Server = {
      ...currentUser,
      bio: bioText,
      workImages: workImages,
      picture: imagePreview || currentUser.picture
    };

    if (onUpdateServer) {
      onUpdateServer(updatedServer);
    }
    if (onUpdateWorkImages) {
      onUpdateWorkImages(workImages);
    }
    showToast('✨ Work portfolio and bio successfully saved to your profile!');
  };
  
  // State for Decline/Substitution modal
  const [decliningSlot, setDecliningSlot] = useState<{
    rowId: string;
    slotId: string;
    role: SocComRole;
    time: string;
    dayName: string;
  } | null>(null);
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');

  // State for Attendance/Reflection modal
  const [attendanceSlot, setAttendanceSlot] = useState<{
    rowId: string;
    slotId: string;
    role: SocComRole;
    time: string;
    dayName: string;
    date: string;
  } | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // State for notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger base64 conversion for uploaded file with auto-compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.75);
        setImagePreview(compressed);
        onUpdateProfile(compressed);
        showToast('Profile picture uploaded & optimized successfully!');
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image file. Please try another photo.');
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Find all schedule slots assigned to current user (separated into active/pending vs completed)
  const { myAssignedSlots, myCompletedSlots } = useMemo(() => {
    const activeList: Array<{
      row: ScheduleRow;
      slotId: string;
      time: string;
      role: SocComRole;
    }> = [];

    const completedList: Array<{
      row: ScheduleRow;
      slotId: string;
      time: string;
      role: SocComRole;
    }> = [];

    schedules.forEach(row => {
      row.slots.forEach(slot => {
        const roles: SocComRole[] = ['ppt', 'live_server', 'documentation', 'reels_editor'];
        roles.forEach(role => {
          const val = slot[role];
          const isAssigned = Array.isArray(val)
            ? val.includes(currentUser.id)
            : (typeof val === 'string' && val === currentUser.id);
          if (isAssigned) {
            const hasSubmittedReceipt = receipts.some(
              r => r.serverId === currentUser.id && r.date === row.date && r.role === role
            );

            if (hasSubmittedReceipt) {
              completedList.push({ row, slotId: slot.id, time: slot.time, role });
            } else {
              activeList.push({ row, slotId: slot.id, time: slot.time, role });
            }
          }
        });
      });
    });

    return { myAssignedSlots: activeList, myCompletedSlots: completedList };
  }, [schedules, currentUser.id, receipts]);

  // Helper to format comma-separated assigned server names for a slot role
  const getRoleServerNames = (slot: any, role: SocComRole) => {
    const val = slot?.[role];
    const ids: string[] = Array.isArray(val)
      ? val
      : (typeof val === 'string' && val ? [val] : []);
    return ids.map(id => serverMap[id]?.name).filter(Boolean).join(', ') || 'Unassigned';
  };

  // Find incoming sub requests sent to the current user
  const incomingRequests = useMemo(() => {
    return subRequests.filter(req => req.toServerId === currentUser.id && req.status === 'pending');
  }, [subRequests, currentUser.id]);

  // Find outgoing requests sent by current user
  const outgoingRequests = useMemo(() => {
    return subRequests.filter(req => req.fromServerId === currentUser.id);
  }, [subRequests, currentUser.id]);

  // Server mapping for names/pictures
  const serverMap = useMemo(() => {
    const map: Record<string, Server> = {};
    servers.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [servers]);

  // List of other servers who share or can substitute for this role, filtered by search query
  const eligibleSubstitutes = useMemo(() => {
    if (!decliningSlot) return [];
    
    return servers.filter(s => {
      if (s.id === currentUser.id) return false;
      const matchesSearch = s.name.toLowerCase().includes(subSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [servers, decliningSlot, currentUser.id, subSearchQuery]);

  // Submit substitution request
  const submitSubstitution = () => {
    if (!decliningSlot || !selectedSubstituteId) return;

    onSendSubRequest({
      scheduleRowId: decliningSlot.rowId,
      slotId: decliningSlot.slotId,
      role: decliningSlot.role,
      fromServerId: currentUser.id,
      toServerId: selectedSubstituteId
    });

    const subName = serverMap[selectedSubstituteId]?.name || 'the server';
    showToast(`Substitution request sent to ${subName}! Waiting for confirmation.`);
    setDecliningSlot(null);
    setSubSearchQuery('');
    setSelectedSubstituteId('');
  };

  // Submit attendance reflection
  const submitReflection = () => {
    if (!attendanceSlot || !reflectionText.trim()) return;

    onSubmitReceipt({
      date: attendanceSlot.date,
      time: attendanceSlot.time,
      dayName: attendanceSlot.dayName,
      serverId: currentUser.id,
      serverName: currentUser.name,
      role: attendanceSlot.role,
      reflection: reflectionText.trim()
    });

    showToast('Attendance & reflection submitted! Thank you for your service! 🙏');
    setAttendanceSlot(null);
    setReflectionText('');
  };

  // Drag and drop handler
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.75);
        setImagePreview(compressed);
        onUpdateProfile(compressed);
        showToast('Profile picture uploaded & optimized successfully via drag & drop!');
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image file.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-church-900 border-2 border-gold-400 text-gold-100 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5 text-gold-400 shrink-0" />
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Horizontal Media Directory Profile & Portfolio Showcase */}
      <div className="bg-church-900/60 p-6 rounded-2xl border border-church-700/60 relative overflow-hidden shadow-xl space-y-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-amber-600"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: Drag & Drop Profile Avatar and User Info */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-church-950/70 rounded-xl border border-church-750">
            <div className="relative group shrink-0">
              <img
                src={imagePreview || currentUser.picture}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-4 border-gold-500/30 shadow-xl group-hover:opacity-85 transition-opacity"
              />
              <label className="absolute bottom-0 right-0 bg-gold-600 hover:bg-gold-500 p-2 rounded-full border border-church-800 cursor-pointer shadow-lg transition-transform hover:scale-105">
                <Upload className="w-4 h-4 text-church-950" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <h3 className="text-lg font-bold text-gold-100 font-serif">{currentUser.name}</h3>
                <p className="text-xs text-gold-300/80 font-mono">{currentUser.email || 'media@auxiladora.org'}</p>
              </div>

              {/* Roles Badges */}
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {(currentUser?.roles && currentUser.roles.length > 0 ? currentUser.roles : [currentUser?.role || 'ppt']).filter(Boolean).map((r, idx) => (
                  <span key={`${r}-${idx}`} className="text-[10px] px-2.5 py-0.5 rounded-md bg-gold-500/15 text-gold-200 border border-gold-500/30 font-mono uppercase font-bold tracking-wider">
                    {String(r).replace('_', ' ')}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] font-mono text-gold-200/70">
                <span>Privilege: <strong className="text-gold-200">{currentUser.isAdmin ? 'Full Admin' : currentUser.isSubAdmin ? 'Sub-Admin' : 'SocCom Member'}</strong></span>
                <div className="flex items-center gap-1.5">
                  <span>🎂 <strong className="text-gold-200">{formatBirthdayForDisplay(currentUser.birthday)}</strong></span>
                  <button
                    type="button"
                    onClick={() => setShowBdayPicker(!showBdayPicker)}
                    className="text-[10px] text-amber-300 hover:text-amber-200 underline font-mono cursor-pointer flex items-center gap-0.5 ml-1"
                  >
                    <span>{showBdayPicker ? 'Close' : '📅 Calendar'}</span>
                  </button>
                </div>
              </div>

              {/* Calendar Date Picker Popup */}
              {showBdayPicker && (
                <div className="mt-2 p-2 bg-church-900 border border-amber-500/40 rounded-xl flex items-center gap-2 animate-fade-in max-w-xs">
                  <input
                    type="date"
                    value={formatBirthdayForInput(currentUser.birthday)}
                    onChange={(e) => {
                      if (e.target.value && onUpdateServer) {
                        const formatted = formatBirthdayForDisplay(e.target.value);
                        onUpdateServer({ ...currentUser, birthday: formatted });
                        alert(`🎂 Birthday updated to ${formatted}!`);
                        setShowBdayPicker(false);
                      }
                    }}
                    className="bg-church-950 text-gold-100 text-xs p-2 rounded-lg border border-church-700 font-mono w-full focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Drag & Drop Profile Dropzone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`mt-2 p-2.5 rounded-lg border border-dashed text-center text-[10px] transition-colors ${
                  dragActive 
                    ? 'border-gold-400 bg-gold-950/30 text-gold-200' 
                    : 'border-church-700 hover:border-gold-500/40 bg-church-900/40 text-gold-300/50'
                }`}
              >
                <p className="font-semibold">Drag & Drop new profile photo here</p>
              </div>
            </div>
          </div>

          {/* Right: Bio & 3 Horizontal Ministry Work Showcase Images */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Bio Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gold-400 font-mono flex items-center justify-between">
                <span>❖ Member Bio / Ministry Statement</span>
                <span className="text-[10px] text-gold-400/60 lowercase font-normal">{bioText.length}/300 chars</span>
              </label>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value.slice(0, 300))}
                placeholder="Share your personal bio, media experience, or spiritual reflection for our parish community..."
                rows={2}
                className="w-full bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40 resize-none shadow-inner"
              />
            </div>

            {/* Work Portfolio Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 font-mono flex items-center gap-2">
                  <span>❖</span> My Ministry Work Portfolio (3 Horizontal Media Images)
                </h4>
                <span className="text-[10px] text-gold-400/60 font-mono">Upload or paste Image URLs</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {workImages.map((imgUrl, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="relative group rounded-xl overflow-hidden border border-church-700/80 bg-church-950 aspect-video shadow-md">
                      <img
                        src={imgUrl}
                        alt={`Ministry Work ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-church-950/90 via-church-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <label className="bg-church-900/90 hover:bg-gold-500 hover:text-church-950 text-gold-200 p-1 rounded-lg border border-church-700 cursor-pointer shadow-md transition-all">
                            <Upload className="w-3 h-3" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleWorkImageChange(idx, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <span className="text-[8px] font-mono text-gold-200 font-bold uppercase tracking-wide">
                          {idx === 0 ? '1. Live Production' : idx === 1 ? '2. Media Booth' : '3. Documentation'}
                        </span>
                      </div>
                    </div>

                    <input
                      type="url"
                      value={imgUrl}
                      onChange={(e) => handleWorkUrlChange(idx, e.target.value)}
                      placeholder={`Image ${idx + 1} URL`}
                      className="w-full bg-church-950 text-[9px] font-mono text-gold-200/80 p-1.5 rounded-lg border border-church-800 focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Explicit SAVE WORK PORTFOLIO & BIO BUTTON */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSavePortfolioAndBio}
                className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-church-950 font-bold text-xs font-mono uppercase tracking-wider rounded-xl shadow-lg hover:shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer border border-gold-300/40"
              >
                <span>💾</span>
                <span>Save Work Portfolio & Bio</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Grid: Workspace Greeting Box & Stats */}
      <div className="bg-church-900/40 p-6 rounded-2xl border border-church-700/60 flex flex-col justify-between relative overflow-hidden shadow-lg">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gold-100 font-serif tracking-tight flex items-center gap-2">
            Peace be with you, {currentUser.name.split(' ')[0]}! <span className="text-xl">🙏</span>
          </h2>
          <p className="text-gold-200/80 text-xs md:text-sm leading-relaxed max-w-2xl font-medium">
            Welcome to your dedicated Social Communication ministry workspace. Track your assigned masses, coordinate with substitute servers, and record your spiritual service reflections to build our church's liturgical archive.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-church-950/80 p-4 rounded-xl border border-church-700/40">
              <span className="text-[10px] font-mono text-gold-400/60 uppercase tracking-wider">YOUR ASSIGNED SERVICES</span>
              <p className="text-2xl font-bold text-gold-300 mt-1 font-serif">{myAssignedSlots.length}</p>
            </div>
            <div className="bg-church-950/80 p-4 rounded-xl border border-church-700/40">
              <span className="text-[10px] font-mono text-gold-400/60 uppercase tracking-wider">COVER REQUEST OUTBOX</span>
              <p className="text-2xl font-bold text-gold-300 mt-1 font-serif">
                {outgoingRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-church-950/80 p-4 rounded-xl border border-church-700/40">
              <span className="text-[10px] font-mono text-gold-400/60 uppercase tracking-wider">INCOMING ALERTS</span>
              <p className="text-2xl font-bold text-gold-300 mt-1 font-serif">{incomingRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-church-700/40 flex items-center gap-2.5 text-xs text-gold-400/50 font-mono">
          <FlameKindling className="w-4 h-4 text-gold-400 animate-pulse" />
          <span>Dedicated Service of Auxiliadora Media Ministry • 2026 Liturgical Year</span>
        </div>
      </div>
         {/* 🔄 Substitution Coordination Hub - PLACED AT THE TOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Incoming requests (Left Column) */}
        <div className="bg-church-900/40 rounded-2xl border border-church-700/60 overflow-hidden shadow-md">
          <div className="p-5 border-b border-church-700/60 bg-church-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-gold-400" />
              <h3 className="font-bold text-gold-100 font-serif">Substitute Cover Invites</h3>
            </div>
            <span className="text-[10px] bg-gold-500/10 text-gold-300 font-mono px-2.5 py-0.5 rounded border border-gold-500/25 font-bold">
              {incomingRequests.length} ALERTS
            </span>
          </div>

          <div className="p-5 space-y-4">
            {incomingRequests.length > 0 ? (
              incomingRequests.map((req) => {
                const fromServer = serverMap[req.fromServerId];
                const row = schedules.find(s => s.id === req.scheduleRowId);
                const slot = row?.slots.find(s => s.id === req.slotId);

                if (!fromServer || !row || !slot) return null;

                return (
                  <div key={req.id} className="p-4 rounded-xl bg-church-950 border border-church-700/60 space-y-3">
                    <div className="flex items-start gap-3">
                      <img 
                        src={fromServer.picture} 
                        alt={fromServer.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-gold-500/20" 
                      />
                      <div>
                        <p className="text-xs font-bold text-gold-100">
                          {fromServer.name} <span className="text-gold-200/50 font-normal">needs a cover for</span>
                        </p>
                        <p className="text-xs font-bold text-gold-300 mt-0.5">{slot.time}</p>
                        <p className="text-[10px] text-gold-400/50 mt-0.5 font-mono">{row.dayName}</p>
                        <span className="inline-block text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-gold-500/10 text-gold-300 border border-gold-500/25 mt-2">
                          Role: {req.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-church-700/40">
                      <button
                        id={`btn-accept-req-${req.id}`}
                        onClick={() => {
                          onRespondSubRequest(req.id, true);
                          showToast('You accepted the substitute schedule! Thank you!');
                        }}
                        className="text-xs bg-gold-600 hover:bg-gold-500 text-church-950 font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        id={`btn-decline-req-${req.id}`}
                        onClick={() => {
                          onRespondSubRequest(req.id, false);
                          showToast('Cover request declined.');
                        }}
                        className="text-xs bg-church-900 hover:bg-church-800 text-gold-300 py-1.5 rounded-lg flex items-center justify-center gap-1 border border-church-700 transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gold-200/40 text-xs font-medium">
                No active substitute cover invitations received currently.
              </div>
            )}
          </div>
        </div>

        {/* Outgoing Requests History (Right Column) */}
        <div className="bg-church-900/40 rounded-2xl border border-church-700/60 overflow-hidden shadow-md">
          <div className="p-5 border-b border-church-700/60 bg-church-900/80">
            <h4 className="font-bold text-gold-100 font-serif">Requested Substitutes Outbox</h4>
          </div>
          <div className="p-5 space-y-3">
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map((req) => {
                const toServer = serverMap[req.toServerId];
                const row = schedules.find(s => s.id === req.scheduleRowId);
                const slot = row?.slots.find(s => s.id === req.slotId);

                if (!toServer || !row || !slot) return null;

                return (
                  <div key={req.id} className="flex items-center justify-between p-3.5 rounded-xl bg-church-950 border border-church-700/40 text-xs">
                    <div>
                      <p className="font-bold text-gold-100">{toServer.name}</p>
                      <p className="text-[10px] text-gold-400/50 mt-0.5">{slot.time} • {req.role.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase ${
                        req.status === 'accepted' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          : req.status === 'declined'
                          ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                          : 'bg-gold-950/40 text-gold-400 border border-gold-900/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-xs text-gold-200/40">You have sent no cover substitute requests.</p>
            )}
          </div>
        </div>

      </div>

      {/* Grid: Main Section */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Assigned Liturgical Masses Section */}
        <div className="space-y-6">
          <div className="bg-church-900/40 rounded-2xl border border-church-700/60 overflow-hidden shadow-md">
            <div className="p-5 border-b border-church-700/60 bg-church-900/80 flex items-center gap-2.5">
              <CalendarClock className="w-5 h-5 text-gold-400" />
              <h3 className="font-bold text-gold-100 font-serif">Your Assigned Liturgical Masses</h3>
            </div>

            <div className="p-5 space-y-4">
              {myAssignedSlots.length > 0 ? (
                <div className="space-y-4">
                  {myAssignedSlots.map(({ row, slotId, time, role }) => {
                    const isCoverPending = outgoingRequests.some(
                      req => req.scheduleRowId === row.id && req.slotId === slotId && req.role === role && req.status === 'pending'
                    );

                    const slotFinished = isSlotFinished(row.date, time);
                    const hasSubmittedReceipt = receipts.some(r => r.serverId === currentUser.id && r.date === row.date && r.role === role);

                    return (
                      <div 
                        key={`${row.id}-${slotId}-${role}`}
                        className={`p-4 rounded-xl border transition-all ${
                          row.isLive 
                            ? 'bg-red-950/10 border-red-500/30 shadow-sm' 
                            : 'bg-church-950/60 border-church-700/40 hover:border-gold-500/20'
                        }`}
                      >
                        {/* Service Finished Alert Banner */}
                        {slotFinished && (
                          <div className={`mb-3 p-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-between gap-2 ${
                            hasSubmittedReceipt
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : 'bg-red-950/50 border-red-500/50 text-red-200 animate-pulse'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              {hasSubmittedReceipt ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>🟢 Service Concluded • Reflection Submitted & Verified</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                  <span>
                                    {isPastTenPmCutoff(row.date)
                                      ? '⏰ 10:00 PM Cutoff Reached • Please submit reflection below to clear your attendance status!'
                                      : '🔴 Service Finished • Please Submit Reflection Below to clear sub-admin alert!'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-mono bg-gold-500/10 text-gold-300 px-2.5 py-0.5 rounded-full border border-gold-500/25 font-bold">
                                {row.date}
                              </span>
                              <span className="text-[10px] font-mono bg-church-800 text-gold-300 px-2.5 py-0.5 rounded-full border border-church-750 font-bold uppercase">
                                {role.replace('_', ' ')}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-gold-100 font-serif">{row.dayName}</h4>
                            <p className="text-xs text-gold-200/60 mt-0.5 font-medium flex items-center gap-1">
                              Liturgical Slot: <span className="text-gold-200 font-bold">{time}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {isCoverPending ? (
                              <span className="text-xs bg-gold-950/30 text-gold-400 border border-gold-900/30 px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping"></span>
                                Cover Pending
                              </span>
                            ) : (
                              <button
                                id={`btn-decline-${row.id}-${slotId}`}
                                onClick={() => setDecliningSlot({
                                  rowId: row.id,
                                  slotId,
                                  role,
                                  time,
                                  dayName: row.dayName
                                })}
                                className="text-xs bg-church-900 hover:bg-church-800 text-gold-300 hover:text-red-400 border border-church-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                                Request Substitute
                              </button>
                            )}

                            <button
                              id={`btn-done-${row.id}-${slotId}`}
                              onClick={() => setAttendanceSlot({
                                  rowId: row.id,
                                  slotId,
                                  role,
                                  time,
                                  dayName: row.dayName,
                                  date: row.date
                              })}
                              className="text-xs bg-gold-600 hover:bg-gold-500 text-church-950 font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Submit Reflection
                            </button>
                          </div>
                        </div>

                        {/* Schedule Team Display */}
                        <div className="mt-4 pt-3 border-t border-church-700/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[10px]">
                          {row.slots.find(s => s.id === slotId) && (
                            <>
                              {(() => {
                                const activeSlot = row.slots.find(s => s.id === slotId);
                                return (
                                  <>
                                    <div className="min-w-0 p-2 bg-church-900/60 rounded-lg border border-church-700/30">
                                      <span className="text-gold-400/50 block uppercase tracking-wider font-mono text-[9px] truncate">PPT Screen</span>
                                      <span className="font-semibold text-gold-200 truncate block mt-0.5">
                                        {getRoleServerNames(activeSlot, 'ppt')}
                                      </span>
                                    </div>
                                    <div className="min-w-0 p-2 bg-church-900/60 rounded-lg border border-church-700/30">
                                      <span className="text-gold-400/50 block uppercase tracking-wider font-mono text-[9px] truncate">Presentation</span>
                                      <span className="font-semibold text-gold-200 truncate block mt-0.5">
                                        {getRoleServerNames(activeSlot, 'live_server')}
                                      </span>
                                    </div>
                                    <div className="min-w-0 p-2 bg-church-900/60 rounded-lg border border-church-700/30">
                                      <span className="text-gold-400/50 block uppercase tracking-wider font-mono text-[9px] truncate">Documentation</span>
                                      <span className="font-semibold text-gold-200 truncate block mt-0.5">
                                        {getRoleServerNames(activeSlot, 'documentation')}
                                      </span>
                                    </div>
                                    <div className="min-w-0 p-2 bg-church-900/60 rounded-lg border border-church-700/30">
                                      <span className="text-gold-400/50 block uppercase tracking-wider font-mono text-[9px] truncate">Reels Editor</span>
                                      <span className="font-semibold text-gold-200 truncate block mt-0.5">
                                        {getRoleServerNames(activeSlot, 'reels_editor')}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-church-950/40 rounded-xl border border-church-700/40 border-dashed">
                  <div className="inline-flex bg-gold-500/10 p-3.5 rounded-full border border-gold-500/20 mb-3.5">
                    <Heart className="w-6 h-6 text-gold-400" />
                  </div>
                  <h4 className="text-gold-200 font-bold font-serif text-sm mb-1">Rest and Attend Holy Mass! ⛪</h4>
                  <p className="text-xs text-gold-200/50 max-w-sm mx-auto leading-relaxed">
                    You have no active services scheduled for this weekend. Go and participate in the Eucharist with the parish congregation, and support your fellow SocCom servers!
                  </p>
                </div>
              )}
            </div>

            {/* Completed & Reflected Services Archive */}
            {myCompletedSlots.length > 0 && (
              <div className="p-5 pt-0">
                <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 font-mono">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Completed Services & Submitted Reflections ({myCompletedSlots.length})</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 font-mono">Auto-removed from active schedule</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {myCompletedSlots.map(({ row, time, role }) => {
                      const matchingReceipt = receipts.find(
                        r => r.serverId === currentUser.id && r.date === row.date && r.role === role
                      );
                      return (
                        <div key={`${row.id}-${role}-completed`} className="p-3 bg-church-950/80 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gold-100">{row.dayName}</span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded font-bold uppercase">{role.replace('_', ' ')}</span>
                            </div>
                            <p className="text-[10px] text-gold-300/70 font-mono mt-0.5">{row.date} @ {time}</p>
                            {matchingReceipt && (
                              <p className="text-[11px] text-emerald-200/90 italic font-serif mt-1 bg-church-900/60 p-2 rounded border border-emerald-500/20">
                                "{matchingReceipt.reflection}"
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0 self-start sm:self-center flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>Done & Reflected</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Decline / Substitution Modal */}
      {decliningSlot && (
        <div className="fixed inset-0 bg-church-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-church-900 border border-church-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-church-700 flex items-center justify-between bg-church-900/80">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-gold-400" />
                <h3 className="font-bold text-gold-100 font-serif text-base">Request Liturgical Cover Substitute</h3>
              </div>
              <button 
                onClick={() => {
                  setDecliningSlot(null);
                  setSubSearchQuery('');
                  setSelectedSubstituteId('');
                }}
                className="text-gold-400 hover:text-gold-200 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-church-950 p-3.5 rounded-xl border border-church-700/60 text-xs text-gold-200">
                <p className="font-bold text-gold-400">Mass Schedule Slot:</p>
                <p className="text-gold-300 font-bold mt-1 text-sm">{decliningSlot.time}</p>
                <p className="text-[11px] text-gold-100/50 font-mono mt-0.5">{decliningSlot.dayName}</p>
                <p className="mt-2 text-[10px] text-gold-400 uppercase font-mono font-bold">Role: {decliningSlot.role.replace('_', ' ')}</p>
              </div>

              {/* Substitution selection scrollable button with search! */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gold-300">Choose substitute server:</label>
                
                {/* Search box */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search parish servers..."
                    value={subSearchQuery}
                    onChange={(e) => setSubSearchQuery(e.target.value)}
                    className="w-full bg-church-950 text-gold-100 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400 placeholder-gold-100/30"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gold-400/40" />
                </div>

                {/* List container */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-church-700/60 rounded-xl p-2 bg-church-950/40">
                  {eligibleSubstitutes.length > 0 ? (
                    eligibleSubstitutes.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSubstituteId(s.id)}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          selectedSubstituteId === s.id
                            ? 'bg-gold-500/20 border border-gold-400/40'
                            : 'hover:bg-church-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.picture}
                            alt={s.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover border border-gold-500/20"
                          />
                          <div>
                            <p className="text-xs font-bold text-gold-100">{s.name}</p>
                            <span className="text-[9px] uppercase font-mono text-gold-400/60 block">{s.role.replace('_', ' ')}</span>
                          </div>
                        </div>
                        {selectedSubstituteId === s.id && (
                          <Check className="w-4 h-4 text-gold-400" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-gold-100/40">No servers matched your search.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-church-950/40 border-t border-church-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDecliningSlot(null);
                  setSubSearchQuery('');
                  setSelectedSubstituteId('');
                }}
                className="text-xs text-gold-300 hover:text-white px-4 py-2 border border-church-700 hover:bg-church-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSubstituteId}
                onClick={submitSubstitution}
                className="text-xs bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-church-950 font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance & Reflection Modal */}
      {attendanceSlot && (
        <div className="fixed inset-0 bg-church-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-church-900 border border-church-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-church-700 flex items-center justify-between bg-church-900/80">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-gold-400" />
                <h3 className="font-bold text-gold-100 font-serif text-base">Service Attendance & Reflection</h3>
              </div>
              <button 
                onClick={() => {
                  setAttendanceSlot(null);
                  setReflectionText('');
                }}
                className="text-gold-400 hover:text-gold-200 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-church-950 p-3.5 rounded-xl border border-church-700/60 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-gold-500/10 text-gold-300 px-2 py-0.5 rounded border border-gold-500/25 font-bold">
                    Role: {attendanceSlot.role.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-gold-400/60 font-bold">{attendanceSlot.date}</span>
                </div>
                <h4 className="font-bold text-sm text-gold-100 font-serif">{attendanceSlot.dayName}</h4>
                <p className="text-gold-200 font-bold text-xs">Mass Time: {attendanceSlot.time}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gold-300 block">
                  Write your service reflection:
                </label>
                <textarea
                  placeholder="Share a short, meaningful reflection about your service at today's Mass (e.g. what was the focus of the homily? How did your production work help lead the congregation to prayer?)..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  rows={4}
                  className="w-full bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none placeholder-gold-100/20 leading-relaxed font-sans"
                />
                <p className="text-[10px] text-gold-400/40 leading-relaxed">
                  Your reflection represents the spiritual heart of our Social Communication ministry. It will be recorded securely in the SocCom Service archive.
                </p>
              </div>
            </div>

            <div className="p-4 bg-church-950/40 border-t border-church-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAttendanceSlot(null);
                  setReflectionText('');
                }}
                className="text-xs text-gold-300 hover:text-white px-4 py-2 border border-church-700 hover:bg-church-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reflectionText.trim()}
                onClick={submitReflection}
                className="text-xs bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-church-950 font-bold px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Submit Reflection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
