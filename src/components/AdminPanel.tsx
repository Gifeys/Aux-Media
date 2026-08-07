/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Server, ScheduleRow, ScheduleSlot, ServiceReceipt, SocComRole, Announcement, SocComOfTheMonth, Applicant, SiteSettings, SubAdminAttendanceAlert, ScheduleAuditRecord, ActiveSession } from '../types';
import { formatBirthdayForDisplay, formatBirthdayForInput } from '../lib/birthdayUtils';
import { compressImage } from '../lib/imageUtils';
import { generateScheduleEmailData, ScheduleEmailDispatchResult } from '../lib/emailNotifier';
import { ScheduleEmailModal } from './ScheduleEmailModal';
import { 
  Plus, 
  Trash2, 
  UserPlus, 
  CalendarDays, 
  BookOpenText, 
  Search, 
  Check, 
  Tv, 
  Info,
  UserCheck,
  RefreshCw,
  Award,
  Calendar,
  Sparkles,
  Edit3,
  X,
  Key,
  Lock,
  Mail,
  Upload,
  CheckCircle2,
  XCircle,
  UserCheck2,
  Eye,
  EyeOff,
  Palette,
  Image,
  Globe,
  Sliders,
  Shield,
  FileText,
  Settings,
  Loader2
} from 'lucide-react';

interface AdminPanelProps {
  servers: Server[];
  schedules: ScheduleRow[];
  receipts: ServiceReceipt[];
  soccomOfMonth?: SocComOfTheMonth;
  applicants?: Applicant[];
  siteSettings?: SiteSettings;
  subAdminAlerts?: SubAdminAttendanceAlert[];
  auditRecords?: ScheduleAuditRecord[];
  onOpenSubAdminAudit?: () => void;
  onAddSchedule: (row: ScheduleRow) => void;
  onUpdateSchedule: (row: ScheduleRow) => void;
  onDeleteSchedule: (id: string) => void;
  onAddServer: (server: Server) => void;
  onDeleteServer?: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onAddAnnouncement?: (ann: Announcement) => void;
  onUpdateSoccomOfMonth?: (updated: SocComOfTheMonth) => void;
  onApproveApplicant?: (applicant: Applicant) => void;
  onRejectApplicant?: (id: string) => void;
  onScheduleMeetingApplicant?: (applicantId: string, meetingInfo: { dateTime: string; location: string; notes?: string }) => void;
  onUpdatePassword?: (serverId: string, newPass: string) => void;
  onUpdateSiteSettings?: (updated: Partial<SiteSettings>) => void;
  onUpdateServer?: (updatedServer: Server) => void;
  currentUser: Server;
  activeSessions?: ActiveSession[];
}


const getRoleWorkImages = (role: string): [string, string] => {
  switch (role) {
    case 'ppt':
      return [
        'https://images.unsplash.com/photo-1460518451285-cd3ab4204667?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80'
      ];
    case 'live_server':
      return [
        'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=300&q=80'
      ];
    case 'documentation':
      return [
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=300&q=80'
      ];
    case 'reels_editor':
    default:
      return [
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=300&q=80'
      ];
  }
};

{/* 🎨 3-Row Picture with 120-degree dividing line (Row 1: Work 1, Row 2: Official Profile, Row 3: Work 2) */}
const ThreeRowDesignerAvatar = React.memo(({ server }: { server: Server }) => {
  const [work1, work2] = getRoleWorkImages(server.role);

  return (
    <div className="relative w-14 h-28 sm:w-16 sm:h-32 rounded-xl overflow-hidden border border-gold-500/40 shadow-md bg-church-950 shrink-0 group-hover:border-gold-400 transition-all flex flex-col">
      {/* 120-degree Angle Tag */}
      <span className="absolute top-0.5 left-0.5 z-20 text-[6px] font-mono uppercase bg-church-950/90 text-gold-300 px-1 py-0.5 rounded border border-gold-500/30">
        120°
      </span>

      {/* Row 1: Ministry Work 1 (Top) */}
      <div
        className="h-1/3 w-full relative overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)' // 120-degree slanted divider
        }}
      >
        <img
          src={work1}
          alt="Work sample 1"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-church-950/80 to-transparent flex items-end px-0.5 pb-0.5">
          <span className="text-[6px] text-gold-200 font-mono font-bold uppercase truncate">Work #1</span>
        </div>
      </div>

      {/* Row 2: Official Profile Picture (Middle) */}
      <div
        className="h-1/3 w-full relative overflow-hidden my-[-1px] z-10 border-y border-gold-400/80"
        style={{
          clipPath: 'polygon(0 15%, 100% 0%, 100% 85%, 0 100%)' // 120-degree slanted top & bottom divider
        }}
      >
        <img
          src={server.picture}
          alt={server.name}
          loading="lazy"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-transparent to-gold-500/10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 bg-church-950/80 text-center py-0.5">
          <span className="text-[6px] text-gold-100 font-bold font-mono uppercase truncate block">Official Profile</span>
        </div>
      </div>

      {/* Row 3: Ministry Work 2 (Bottom) */}
      <div
        className="h-1/3 w-full relative overflow-hidden"
        style={{
          clipPath: 'polygon(0 15%, 100% 0%, 100% 100%, 0 100%)' // 120-degree slanted top divider
        }}
      >
        <img
          src={work2}
          alt="Work sample 2"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-church-950 via-transparent to-transparent flex items-end px-0.5 pb-0.5">
          <span className="text-[6px] text-gold-200 font-mono font-bold uppercase truncate">Work #2</span>
        </div>
      </div>
    </div>
  );
});

const DeleteIconButton = ({ onDelete, title, className }: { onDelete: () => void; title?: string; className?: string }) => {
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
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 animate-pulse"
        title="Click to confirm deletion"
      >
        Confirm?
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setConfirming(true);
      }}
      className={className || "text-red-400/50 hover:text-red-400 p-1.5 hover:bg-red-950/40 rounded transition-colors cursor-pointer shrink-0"}
      title={title || "Delete"}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};

const ServerCardItem = React.memo(({
  server,
  currentUser,
  onDelete,
  onAddAnnouncement,
  onUpdatePassword,
  onUpdateServer
}: {
  server: Server;
  currentUser?: Server;
  onDelete?: (id: string) => void;
  onAddAnnouncement?: (ann: Announcement) => void;
  onUpdatePassword?: (serverId: string, newPass: string) => void;
  onUpdateServer?: (server: Server) => void;
}) => {
  const [postedToBulletin, setPostedToBulletin] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [showEditBday, setShowEditBday] = useState(false);
  const [editBday, setEditBday] = useState(formatBirthdayForInput(server.birthday));
  const [showPromoteMenu, setShowPromoteMenu] = useState(false);
  const [showEditPortfolio, setShowEditPortfolio] = useState(false);
  const [showEditPic, setShowEditPic] = useState(false);
  const [editPicUrl, setEditPicUrl] = useState<string>(server.picture || '');
  const [isProcessingPic, setIsProcessingPic] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [revealPass, setRevealPass] = useState(false);

  const isSelf = Boolean(currentUser && currentUser.id === server.id);

  const handleSaveBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBday) return;
    if (onUpdateServer) {
      const formatted = formatBirthdayForDisplay(editBday);
      onUpdateServer({ ...server, birthday: formatted });
      alert(`🎂 Birthday for ${server.name} updated to ${formatted}!`);
      setShowEditBday(false);
    }
  };

  const handleProfilePicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingPic(true);
        const compressed = await compressImage(file, 800, 800, 0.75);
        setEditPicUrl(compressed);
        if (onUpdateServer) {
          onUpdateServer({ ...server, picture: compressed });
          alert(`✅ Profile picture updated & optimized for ${server.name}!`);
        }
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image file. Please try another photo.');
      } finally {
        setIsProcessingPic(false);
      }
    }
  };

  const handleWorkImgUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        if (index === 0) setEditImg1(compressed);
        if (index === 1) setEditImg2(compressed);
        if (index === 2) setEditImg3(compressed);
      } catch (err) {
        console.error('Failed to process work image:', err);
        alert('Failed to process image file.');
      }
    }
  };

  // Editable bio & 3 work images for this server
  const [editBio, setEditBio] = useState<string>(server.bio || '');
  const [editImg1, setEditImg1] = useState<string>(server.workImages?.[0] || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80');
  const [editImg2, setEditImg2] = useState<string>(server.workImages?.[1] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80');
  const [editImg3, setEditImg3] = useState<string>(server.workImages?.[2] || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80');

  const firstName = server.name.split(' ')[0] || server.name;

  const handleSavePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateServer) {
      const updated: Server = {
        ...server,
        picture: editPicUrl || server.picture,
        bio: editBio,
        workImages: [editImg1, editImg2, editImg3]
      };
      onUpdateServer(updated);
      alert(`✅ Profile picture, work portfolio & bio saved for ${server.name}!`);
      setShowEditPortfolio(false);
      setShowEditPic(false);
    }
  };

  const handlePostBirthdayToBulletin = () => {
    if (onAddAnnouncement) {
      onAddAnnouncement({
        id: `ann-bday-${server.id}-${Date.now()}`,
        title: `🎂 Birthday Celebration: ${server.name}`,
        content: `Warm birthday blessings to our ${server.role.replace('_', ' ').toUpperCase()} servant, ${server.name}, celebrating on ${server.birthday}! Peace be with you! 🕊️`,
        type: 'birthday',
        date: new Date().toISOString().split('T')[0]
      });
      setPostedToBulletin(true);
      setTimeout(() => setPostedToBulletin(false), 3500);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 3) return;
    if (onUpdatePassword) {
      onUpdatePassword(server.id, newPass);
      alert(`Password updated for ${server.name}! New password: ${newPass}`);
      setNewPass('');
      setShowEditPass(false);
    }
  };

  const handleToggleSubAdmin = () => {
    if (onUpdateServer) {
      const updated = { ...server, isSubAdmin: !server.isSubAdmin };
      onUpdateServer(updated);
      alert(`${server.name} ${!server.isSubAdmin ? 'promoted to Sub-Admin' : 'demoted from Sub-Admin'}!`);
    }
  };

  const handleToggleAdmin = () => {
    if (onUpdateServer) {
      const updated = { ...server, isAdmin: !server.isAdmin };
      onUpdateServer(updated);
      alert(`${server.name} ${!server.isAdmin ? 'promoted to Admin' : 'demoted from Admin'}!`);
    }
  };

  const handleRoleChange = (newRole: SocComRole) => {
    if (onUpdateServer) {
      const existingRoles = server.roles || [server.role];
      const newRoles = existingRoles.includes(newRole) ? existingRoles : [...existingRoles, newRole];
      onUpdateServer({ ...server, role: newRole, roles: newRoles });
    }
  };

  const assignedRoles = server.roles && server.roles.length > 0 ? server.roles : [server.role];

  return (
    <div className="p-4 bg-church-950 rounded-2xl border border-church-750 flex flex-col justify-between gap-3 relative group hover:border-gold-500/40 transition-all shadow-md w-full">
      
      {/* Top Header Row: Profile Picture + Name & Member Details + Delete Button */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* 🖼️ Single Official Profile Picture */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-gold-500/40 shadow-sm bg-church-900 shrink-0">
            <img
              src={server.picture}
              alt={server.name}
              loading="lazy"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Name, Email, Role Badges */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gold-400 font-serif italic font-semibold leading-none">
                🕊️ {firstName}
              </span>
              {server.isAdmin && (
                <span className="text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60 shadow-sm">Admin</span>
              )}
              {server.isSubAdmin && (
                <span className="text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-sm">Sub-Admin</span>
              )}
            </div>

            <h5 className="font-extrabold text-sm sm:text-base text-gold-100 leading-snug break-words whitespace-normal tracking-tight">
              {server.name}
            </h5>

            <p className="text-[11px] text-gold-300/80 font-mono break-all">
              {server.email || `${server.name.toLowerCase().replace(/\s+/g, '')}@auxiladora.org`}
            </p>

            {/* Roles & Skills Badges */}
            <div className="flex items-center gap-1 flex-wrap pt-1">
              {assignedRoles.map((r, idx) => (
                <span key={idx} className="text-[9px] font-mono uppercase tracking-wider font-bold text-gold-300 px-2 py-0.5 rounded bg-church-900 border border-church-750">
                  {r.replace('_', ' ')}
                </span>
              ))}
              {server.skills && server.skills.map((skill, sIdx) => (
                <span key={`sk-${sIdx}`} className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                  ⚡ {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {onDelete && (
          <DeleteIconButton
            onDelete={() => onDelete(server.id)}
            title="Remove Member"
            className="text-red-400/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/30 transition-colors cursor-pointer shrink-0 mt-0.5"
          />
        )}
      </div>

      {/* Bottom Action Bar: Email, Promote & Skills, Photo & Portfolio */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-church-800/60 justify-start sm:justify-end">
        <a
          href={`mailto:${encodeURIComponent(server.email || `${server.name.toLowerCase().replace(/\s+/g, '')}@auxiladora.org`)}?subject=${encodeURIComponent(`✨ Greetings & Ministry Service Notice - Auxiliadora Media`)}&body=${encodeURIComponent(`Dear ${server.name},\n\nGreetings of peace and joy from Auxiliadora Media Ministry!\n\nThis is a friendly message and service update for your account:\n- Name: ${server.name}\n- Ministry Role: ${server.role}\n- Birthday: ${server.birthday}\n- Login Email: ${server.email || 'Registered Email'}\n\nThank you for your dedicated service in our liturgical media team!\n\nWarm regards,\nAuxiliadora Media Ministry Council`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono font-bold bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-600/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          title="Send Email Greetings & Service Notice"
        >
          <Mail className="w-3.5 h-3.5 text-blue-300" />
          <span>Email</span>
        </a>

        <button
          onClick={() => { setShowPromoteMenu(!showPromoteMenu); setShowEditPortfolio(false); }}
          className="text-[10px] font-mono font-bold bg-church-900 hover:bg-gold-500/20 text-gold-300 border border-church-750 hover:border-gold-400 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          title="Promote / Manage Member Roles & Skills"
        >
          <Shield className="w-3.5 h-3.5 text-gold-400" />
          <span>Promote & Skills</span>
        </button>

        <button
          onClick={() => { setShowEditPortfolio(!showEditPortfolio); setShowPromoteMenu(false); }}
          className="text-[10px] font-mono font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          title="Edit Work Portfolio, Profile Photo & Bio"
        >
          <Upload className="w-3.5 h-3.5 text-amber-300" />
          <span>Photo & Portfolio</span>
        </button>
      </div>

      {/* Role Promotion & Privilege Popup Controls */}
      {showPromoteMenu && (
        <div className="p-3 bg-church-900 rounded-xl border border-gold-500/50 space-y-2.5 text-xs font-mono animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-church-800 pb-1.5">
            <span className="text-[10px] font-bold text-gold-300 uppercase flex items-center gap-1">
              <Shield className="w-3 h-3 text-gold-400" /> Privileges & Skills: {firstName}
            </span>
            <button
              onClick={() => setShowPromoteMenu(false)}
              className="text-gold-400/50 hover:text-gold-200 text-[10px] font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={handleToggleSubAdmin}
              className={`p-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer text-center ${
                server.isSubAdmin
                  ? 'bg-amber-950/90 text-amber-200 border-amber-500/60'
                  : 'bg-church-950 hover:bg-amber-950/40 text-gold-200 border-church-750'
              }`}
            >
              {server.isSubAdmin ? '✓ Sub-Admin Active' : 'Promote Sub-Admin'}
            </button>

            <button
              onClick={handleToggleAdmin}
              className={`p-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer text-center ${
                server.isAdmin
                  ? 'bg-red-950/90 text-red-200 border-red-500/60'
                  : 'bg-church-950 hover:bg-red-950/40 text-gold-200 border-church-750'
              }`}
            >
              {server.isAdmin ? '✓ Admin Active' : 'Promote Admin'}
            </button>
          </div>

          <div className="space-y-1 pt-1 border-t border-church-800">
            <label className="text-[9px] text-gold-400 font-bold block">Primary Ministry Assignment</label>
            <select
              value={server.role}
              onChange={(e) => handleRoleChange(e.target.value as SocComRole)}
              className="w-full bg-church-950 text-gold-100 text-[10px] rounded p-1 border border-church-750 focus:outline-none focus:border-gold-400"
            >
              <option value="ppt">PPT Ministry</option>
              <option value="live_server">Live Broadcast Server</option>
              <option value="documentation">Documentation & Photography</option>
              <option value="reels_editor">Reels & Media Editor</option>
            </select>
          </div>

          {/* Multiple Skills Selection */}
          <div className="space-y-1.5 pt-1 border-t border-church-800">
            <label className="text-[9px] text-cyan-300 font-bold block">
              Member Multiple Skills / Capabilities:
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-church-950 p-2 rounded-lg border border-church-800">
              {[
                'PPT Projection',
                'Live Stream Broadcast',
                'Photography & Docu',
                'Reels & Video Editor',
                'Graphic Arts & Design',
                'Audio Engineering',
                'Social Media Mgmt'
              ].map((skillOpt) => {
                const currentSkillsList = server.skills || [];
                const isSelected = currentSkillsList.includes(skillOpt);

                return (
                  <label
                    key={skillOpt}
                    className={`flex items-center gap-1.5 text-[10px] p-1 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/80 text-cyan-200 font-bold border border-cyan-700/60' : 'text-gold-300/70 hover:text-gold-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (onUpdateServer) {
                          const updated = isSelected
                            ? currentSkillsList.filter(s => s !== skillOpt)
                            : [...currentSkillsList, skillOpt];
                          onUpdateServer({ ...server, skills: updated });
                        }
                      }}
                      className="w-3 h-3 accent-cyan-400 cursor-pointer"
                    />
                    <span className="truncate">{skillOpt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Work Portfolio, Profile Photo & Bio Edit Controls */}
      {showEditPortfolio && (
        <form onSubmit={handleSavePortfolio} className="p-3 bg-church-900 rounded-xl border border-amber-500/50 space-y-2.5 text-xs font-mono animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-church-800 pb-1.5">
            <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
              <Upload className="w-3 h-3 text-amber-400" /> Edit Photo, Portfolio & Bio: {firstName}
            </span>
            <button
              type="button"
              onClick={() => setShowEditPortfolio(false)}
              className="text-amber-400/50 hover:text-amber-200 text-[10px] font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Member Official Profile Photo Upload & Link */}
          <div className="space-y-1.5 p-2 bg-church-950/90 rounded-lg border border-amber-500/30">
            <label className="text-[9px] text-amber-300 font-bold block flex items-center justify-between">
              <span>🖼️ Official Profile Photo</span>
              {isProcessingPic && <span className="text-[9px] text-amber-400 animate-pulse">Compressing...</span>}
            </label>

            <div className="flex items-center gap-2">
              <img
                src={editPicUrl || server.picture}
                alt={server.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-amber-500/50 shrink-0"
              />
              <div className="flex-1 space-y-1">
                <label className="text-[9px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2 py-1 rounded cursor-pointer inline-flex items-center gap-1 font-bold">
                  <span>📷 Upload New Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicFileChange}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={editPicUrl}
                  onChange={(e) => setEditPicUrl(e.target.value)}
                  placeholder="Or paste profile picture URL..."
                  className="w-full bg-church-900 text-[9px] text-gold-100 p-1 rounded border border-church-750 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-amber-300 font-bold block">
              Member Bio / Ministry Statement
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder={`Write bio for ${server.name}...`}
              rows={2}
              className="w-full bg-church-950 text-gold-100 text-[10px] rounded p-2 border border-church-750 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="space-y-1.5 pt-1 border-t border-church-800">
            <label className="text-[9px] text-amber-300 font-bold block">
              3 Work Portfolio Showcase Photos (Upload or URL)
            </label>

            <div className="space-y-1.5">
              {[
                { val: editImg1, setVal: setEditImg1, label: 'Work Image 1' },
                { val: editImg2, setVal: setEditImg2, label: 'Work Image 2' },
                { val: editImg3, setVal: setEditImg3, label: 'Work Image 3' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <label className="text-[8px] bg-church-800 hover:bg-church-750 text-gold-200 px-1.5 py-1 rounded border border-church-700 cursor-pointer shrink-0">
                    <span>📁 Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleWorkImgUpload(idx, e)}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={item.val}
                    onChange={(e) => item.setVal(e.target.value)}
                    placeholder={`${item.label} URL...`}
                    className="w-full bg-church-950 text-[9px] text-gold-100 p-1 rounded border border-church-750 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* EXPLICIT SAVE BUTTON */}
          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-gold-600 hover:from-amber-400 hover:to-gold-500 text-church-950 font-bold text-[10px] rounded-lg shadow-md cursor-pointer flex items-center gap-1 uppercase tracking-wider"
            >
              <span>💾</span>
              <span>Save Portfolio & Bio for {firstName}</span>
            </button>
          </div>
        </form>
      )}
      <div className="pt-2 border-t border-church-800/60 flex items-center justify-between text-[10px] font-mono text-gold-300/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <Key className="w-3.5 h-3.5 text-gold-400 shrink-0" />
          <span className="shrink-0 font-bold">Pass:</span>
          {isSelf ? (
            <div className="inline-flex items-center gap-1.5 bg-church-900 px-2 py-0.5 rounded border border-church-700">
              <strong className="text-gold-100 font-mono">
                {revealPass ? (server.password || server.accessToken || 'media123') : '••••••••'}
              </strong>
              <button
                type="button"
                onClick={() => setRevealPass(!revealPass)}
                className="text-gold-400 hover:text-gold-200 transition-colors cursor-pointer"
                title={revealPass ? "Hide my password" : "Show my password"}
              >
                {revealPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-church-900/80 px-2 py-0.5 rounded border border-church-750">
              {(!server.password || server.password === 'media123') && (!server.accessToken || server.accessToken === 'media123') ? (
                <span className="text-amber-300/90 font-mono text-[9px] font-bold">Default (media123)</span>
              ) : (
                <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1 font-bold">
                  <span>🔒</span>
                  <span>Private Password Set</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowEditPass(!showEditPass); setShowEditBday(false); }}
            className="text-[9px] font-bold text-gold-400 hover:text-gold-200 underline cursor-pointer"
          >
            {showEditPass ? 'Cancel Pass' : isSelf ? 'Change Password' : 'Reset Password'}
          </button>

          <button
            onClick={() => { setShowEditBday(!showEditBday); setShowEditPass(false); }}
            className="text-[9px] font-mono font-bold text-amber-300 hover:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/40 cursor-pointer flex items-center gap-1"
            title="Pick Birthday from Calendar"
          >
            <Calendar className="w-3 h-3 text-amber-300" />
            <span>Edit Bday</span>
          </button>

          <button
            onClick={handlePostBirthdayToBulletin}
            className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
              postedToBulletin
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                : 'bg-church-900 hover:bg-gold-500/20 text-gold-200 border-church-750'
            }`}
            title="Post Birthday Notice"
          >
            🎂 {formatBirthdayForDisplay(server.birthday)}
          </button>
        </div>
      </div>

      {/* Inline Calendar Birthday Picker Form */}
      {showEditBday && (
        <form onSubmit={handleSaveBirthday} className="mt-2 p-2 bg-church-900/90 rounded-xl border border-amber-500/50 flex items-center gap-2 animate-fade-in">
          <input
            type="date"
            required
            value={editBday}
            onChange={(e) => setEditBday(e.target.value)}
            className="flex-1 bg-church-950 text-gold-100 text-xs px-2 py-1 rounded-lg border border-church-700 focus:outline-none font-mono"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-church-950 font-bold text-[10px] px-3 py-1 rounded-lg cursor-pointer shrink-0"
          >
            Save Date
          </button>
        </form>
      )}

      {/* Inline Password Change Form */}
      {showEditPass && (
        <form onSubmit={handleSavePassword} className="mt-2 p-2 bg-church-900/90 rounded-xl border border-gold-500/40 flex items-center gap-2 animate-fade-in">
          <input
            type="text"
            required
            placeholder="New password..."
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="flex-1 bg-church-950 text-gold-100 text-xs px-2.5 py-1 rounded-lg border border-church-700 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-gold-600 hover:bg-gold-500 text-church-950 font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer shrink-0"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
});

const ActiveMediaDirectory = React.memo(({
  servers,
  applicants = [],
  currentUser,
  onDeleteServer,
  onAddAnnouncement,
  onApproveApplicant,
  onRejectApplicant,
  onScheduleMeetingApplicant,
  onUpdatePassword,
  onUpdateServer
}: {
  servers: Server[];
  applicants?: Applicant[];
  currentUser?: Server;
  onDeleteServer?: (id: string) => void;
  onAddAnnouncement?: (ann: Announcement) => void;
  onApproveApplicant?: (applicant: Applicant) => void;
  onRejectApplicant?: (id: string) => void;
  onScheduleMeetingApplicant?: (applicantId: string, meetingInfo: { dateTime: string; location: string; notes?: string }) => void;
  onUpdatePassword?: (serverId: string, newPass: string) => void;
  onUpdateServer?: (updatedServer: Server) => void;
}) => {
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<string>('all');
  const [approvingApplicant, setApprovingApplicant] = useState<Applicant | null>(null);
  const [schedulingMeetingApplicant, setSchedulingMeetingApplicant] = useState<Applicant | null>(null);

  // Editable Applicant Approval Email State
  const [appEmailFrom, setAppEmailFrom] = useState<string>('adrich.glife.abelon@gmail.com');
  const [appEmailTo, setAppEmailTo] = useState<string>('');
  const [appEmailSubject, setAppEmailSubject] = useState<string>('');
  const [appEmailBody, setAppEmailBody] = useState<string>('');
  const [appSecretCopied, setAppSecretCopied] = useState<boolean>(false);
  const smtpSecretKey = "AUX_SMTP_SECRET_KEY_2026_88F9A21C_RELAY";

  // Editable Meeting Email & Schedule State
  const [meetEmailFrom, setMeetEmailFrom] = useState<string>('adrich.glife.abelon@gmail.com');
  const [meetEmailTo, setMeetEmailTo] = useState<string>('');
  const [meetEmailSubject, setMeetEmailSubject] = useState<string>('');
  const [meetEmailBody, setMeetEmailBody] = useState<string>('');
  const [meetDateTime, setMeetDateTime] = useState<string>('2026-08-01 14:00');
  const [meetLocation, setMeetLocation] = useState<string>('Auxiliadora Media Studio / Zoom Online');

  // Loading & Dispatching Protection States to prevent double-clicking & duplicate emails
  const [isDispatchingApproval, setIsDispatchingApproval] = useState<boolean>(false);
  const [isDispatchingMeeting, setIsDispatchingMeeting] = useState<boolean>(false);

  useEffect(() => {
    if (approvingApplicant) {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auxiliadora-media.web.app';
      const savedFrom = localStorage.getItem('aux_saved_approval_from') || 'adrich.glife.abelon@gmail.com';
      const savedSubject = localStorage.getItem('aux_saved_approval_subject') || `🎉 Welcome to Auxiliadora Media Ministry - Application Approved`;
      
      let defaultBody = `Greetings ${approvingApplicant.name}!\n\nWe are delighted to inform you that your registration application for ${approvingApplicant.preferredMinistry} has been officially approved!\n\nAccount Details:\n- Registered Email: ${approvingApplicant.email}\n- Default Access Password: ${approvingApplicant.password || 'media123'}\n\n🌐 AUXILIADORA MEDIA PORTAL WEBSITE:\n${siteUrl}\n\nPlease log in at the Auxiliadora Media Portal to view your master schedule and assignments.\n\nWarm regards,\nAdrich Glife Abelon\nLead Admin, Auxiliadora Media Ministry\nContact: adrich.glife.abelon@gmail.com`;

      const savedTemplate = localStorage.getItem('aux_saved_approval_body_template');
      if (savedTemplate) {
        defaultBody = savedTemplate
          .replace(/{name}/g, approvingApplicant.name)
          .replace(/{email}/g, approvingApplicant.email)
          .replace(/{ministry}/g, approvingApplicant.preferredMinistry)
          .replace(/{password}/g, approvingApplicant.password || 'media123')
          .replace(/{website}/g, siteUrl);
        if (!defaultBody.includes(siteUrl)) {
          defaultBody += `\n\n🌐 AUXILIADORA MEDIA PORTAL WEBSITE:\n${siteUrl}`;
        }
      }

      setAppEmailFrom(savedFrom);
      setAppEmailTo(approvingApplicant.email);
      setAppEmailSubject(savedSubject);
      setAppEmailBody(defaultBody);
    }
  }, [approvingApplicant]);

  useEffect(() => {
    if (schedulingMeetingApplicant) {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auxiliadora-media.web.app';
      const savedFrom = localStorage.getItem('aux_saved_meet_from') || 'adrich.glife.abelon@gmail.com';
      const savedSubject = localStorage.getItem('aux_saved_meet_subject') || `📅 Auxiliadora Media Ministry Application Under Review - Scheduled Interview Meeting`;

      let defaultBody = `Greetings ${schedulingMeetingApplicant.name}!\n\nThank you for submitting your application to the Auxiliadora Media Ministry as ${schedulingMeetingApplicant.preferredMinistry}.\n\nYour application status is currently UNDER REVIEW. We would like to invite you for a scheduled interview & orientation meeting.\n\nMeeting Details:\n- Scheduled Date & Time: Saturday, August 1, 2026 at 2:00 PM\n- Location / Link: Auxiliadora Media Studio / Zoom Online\n\n🌐 AUXILIADORA MEDIA PORTAL WEBSITE:\n${siteUrl}\n\nPlease reply directly to this email if you need to reschedule or have any questions.\n\nWarm regards,\nAdrich Glife Abelon\nLead Admin, Auxiliadora Media Ministry\nContact: adrich.glife.abelon@gmail.com`;

      const savedTemplate = localStorage.getItem('aux_saved_meet_body_template');
      if (savedTemplate) {
        defaultBody = savedTemplate
          .replace(/{name}/g, schedulingMeetingApplicant.name)
          .replace(/{email}/g, schedulingMeetingApplicant.email)
          .replace(/{ministry}/g, schedulingMeetingApplicant.preferredMinistry)
          .replace(/{website}/g, siteUrl);
        if (!defaultBody.includes(siteUrl)) {
          defaultBody += `\n\n🌐 AUXILIADORA MEDIA PORTAL WEBSITE:\n${siteUrl}`;
        }
      }

      setMeetEmailFrom(savedFrom);
      setMeetEmailTo(schedulingMeetingApplicant.email);
      setMeetDateTime('2026-08-01 14:00');
      setMeetLocation('Auxiliadora Media Studio / Zoom Online');
      setMeetEmailSubject(savedSubject);
      setMeetEmailBody(defaultBody);
    }
  }, [schedulingMeetingApplicant]);

  const [applicantFilter, setApplicantFilter] = useState<'pending' | 'all'>('pending');

  const pendingApplicants = useMemo(() => {
    return (applicants || []).filter(a => {
      const st = (a.status || 'pending').toLowerCase();
      return st === 'pending' || st === 'under_review';
    });
  }, [applicants]);

  const displayedApplicants = useMemo(() => {
    if (applicantFilter === 'pending') {
      return pendingApplicants;
    }
    return applicants || [];
  }, [applicants, pendingApplicants, applicantFilter]);

  const filteredDirectoryServers = useMemo(() => {
    const query = directorySearch.toLowerCase().trim();
    if (!query && directoryRoleFilter === 'all') return servers;

    return servers.filter(s => {
      const matchesSearch = !query ||
                            s.name.toLowerCase().includes(query) ||
                            s.role.toLowerCase().includes(query) ||
                            s.birthday.toLowerCase().includes(query);
      const matchesRole = directoryRoleFilter === 'all' || s.role === directoryRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [servers, directorySearch, directoryRoleFilter]);

  return (
    <div className="lg:col-span-8 space-y-6">
      
      {/* 📥 MEDIA JOIN REQUESTS & APPLICATIONS SECTION */}
      <div className="bg-church-900/60 p-5 rounded-2xl border border-gold-500/50 space-y-4 shadow-lg animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gold-500/30 gap-2">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gold-400" />
            <h4 className="font-bold text-gold-100 font-serif text-base">
              Account Join Requests & Applications
            </h4>
          </div>
          <div className="flex items-center gap-1.5 bg-church-950 p-1 rounded-xl border border-church-750">
            <button
              type="button"
              onClick={() => setApplicantFilter('pending')}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer font-mono ${
                applicantFilter === 'pending'
                  ? 'bg-amber-500 text-church-950 shadow-sm'
                  : 'text-gold-300 hover:text-white'
              }`}
            >
              Pending ({pendingApplicants.length})
            </button>
            <button
              type="button"
              onClick={() => setApplicantFilter('all')}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer font-mono ${
                applicantFilter === 'all'
                  ? 'bg-church-800 text-gold-200 shadow-sm'
                  : 'text-gold-300/70 hover:text-gold-100'
              }`}
            >
              All Requests ({(applicants || []).length})
            </button>
          </div>
        </div>

        {displayedApplicants.length === 0 ? (
          <div className="p-6 text-center space-y-2.5 bg-church-950/80 rounded-xl border border-church-800">
            <div className="w-12 h-12 rounded-full bg-church-900 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30 shadow-inner">
              <UserPlus className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-sm text-gold-200">No Pending Join Requests</h5>
            <p className="text-xs text-gold-300/70 max-w-md mx-auto leading-relaxed">
              When new members click <strong>"Apply to Join"</strong> on the login screen, their account requests will appear here in real-time for Lead Admin and Sub-Admin approval.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {displayedApplicants.map((app) => (
              <div key={app.id} className="p-4 bg-church-950 rounded-xl border border-church-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-sm text-gold-100">{app.name}</h5>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-church-900 text-gold-300 border border-church-750 font-semibold">
                      {app.preferredMinistry}
                    </span>
                    {app.status === 'under_review' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-600/50 flex items-center gap-1 font-bold">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        Under Review
                      </span>
                    )}
                    {app.status === 'approved' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Approved Member
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-800/50 font-bold">
                        Declined
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-gold-300/80">{app.email}</p>
                  {app.experience && (
                    <p className="text-xs text-gold-200/80 italic bg-church-900/40 p-2 rounded-lg border border-church-800/50 mt-1">
                      "{app.experience}"
                    </p>
                  )}
                  {app.meetingInfo && (
                    <p className="text-xs text-amber-300 font-mono flex items-center gap-1 pt-1 font-semibold">
                      📅 Interview Meeting: {app.meetingInfo.dateTime} ({app.meetingInfo.location})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap pt-2 sm:pt-0">
                  {app.status !== 'approved' && onApproveApplicant && (
                    <button
                      onClick={() => setApprovingApplicant(app)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve & Add
                    </button>
                  )}
                  {app.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => setSchedulingMeetingApplicant(app)}
                      className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                      title="Schedule interview meeting & notify applicant (Under Review)"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Schedule a Meeting
                    </button>
                  )}
                  {app.status !== 'rejected' && onRejectApplicant && (
                    <button
                      onClick={() => onRejectApplicant(app.id)}
                      className="text-xs bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

          {/* Automated Approval Email Confirmation Modal */}
          {approvingApplicant && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0c1a29] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">Automated Approval Email Dispatch</h3>
                  </div>
                  <button
                    onClick={() => setApprovingApplicant(null)}
                    className="text-[#909096] hover:text-white transition-colors cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Spam & Email Dispatch Notice Banner */}
                <div className="bg-amber-950/60 border border-amber-500/50 rounded-xl p-3 space-y-1.5 text-xs text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-amber-300">
                    <span className="material-symbols-outlined text-sm">mark_email_read</span>
                    <span>Direct Email & Greetings Dispatch</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    Clicking <strong>"Approve & Send Greetings Email"</strong> below will immediately approve the applicant, register their Auxiliadora Media account, and trigger the email dispatch with your personal welcome greetings directly to <strong>{appEmailTo}</strong>.
                  </p>
                </div>

                {/* Secret Key Header Box */}
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
                      🔑 SMTP Relay Email Secret Token:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(smtpSecretKey);
                        setAppSecretCopied(true);
                        setTimeout(() => setAppSecretCopied(false), 2500);
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      {appSecretCopied ? '✓ Copied Secret!' : '📋 Copy Secret Token'}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={smtpSecretKey}
                    className="w-full bg-[#051424] text-gold-300 font-mono text-[11px] px-2.5 py-1.5 rounded-lg border border-amber-500/30 select-all"
                  />
                </div>

                <div className="bg-[#051424] p-4 rounded-xl border border-amber-500/30 space-y-3 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[#909096] block font-bold">From Admin Sender Email:</label>
                    <input
                      type="email"
                      value={appEmailFrom}
                      onChange={(e) => setAppEmailFrom(e.target.value)}
                      className="w-full bg-[#102235] text-emerald-300 font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#909096] block font-bold">To Email Address (Applicant):</label>
                    <input
                      type="email"
                      value={appEmailTo}
                      onChange={(e) => setAppEmailTo(e.target.value)}
                      className="w-full bg-[#102235] text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#909096] block font-bold">Email Subject Line (Editable):</label>
                    <input
                      type="text"
                      value={appEmailSubject}
                      onChange={(e) => setAppEmailSubject(e.target.value)}
                      className="w-full bg-[#102235] text-[#d4e4fa] font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[#909096] block font-bold">Personal Welcome Greetings & Credentials Body:</label>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem('aux_saved_approval_from', appEmailFrom);
                            localStorage.setItem('aux_saved_approval_subject', appEmailSubject);
                            localStorage.setItem('aux_saved_approval_body_template', appEmailBody);
                            alert("💾 Default approval email template saved! Future applicant approval emails will use this sender & format with minimal editing required.");
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 cursor-pointer"
                          title="Save this text & sender as default template for future approvals"
                        >
                          <span>💾 Save as Default</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(appEmailBody);
                            alert("Personal Welcome Greetings text copied to clipboard!");
                          }}
                          className="text-[10px] text-amber-300 hover:underline font-mono"
                        >
                          📋 Copy Body
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={7}
                      value={appEmailBody}
                      onChange={(e) => setAppEmailBody(e.target.value)}
                      className="w-full bg-[#102235] text-[#c3c6d7] px-3 py-2 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs leading-relaxed font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setApprovingApplicant(null)}
                    className="px-4 py-2 bg-[#273647] hover:bg-[#32455a] text-xs font-bold rounded-xl text-[#d4e4fa] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDispatchingApproval}
                    onClick={async () => {
                      if (isDispatchingApproval) return;
                      if (onApproveApplicant && approvingApplicant) {
                        setIsDispatchingApproval(true);
                        try {
                          // Directly dispatch email via server API route
                          await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              from: appEmailFrom || 'adrich.glife.abelon@gmail.com',
                              to: appEmailTo,
                              subject: appEmailSubject,
                              text: appEmailBody,
                            }),
                          });
                        } catch (err) {
                          console.error('Email dispatch error:', err);
                        } finally {
                          onApproveApplicant(approvingApplicant);
                          alert(`✅ Email automatically sent from ${appEmailFrom || 'adrich.glife.abelon@gmail.com'} directly to ${appEmailTo}!\n\nApplicant ${approvingApplicant.name} has been officially approved.`);
                          setIsDispatchingApproval(false);
                          setApprovingApplicant(null);
                        }
                      }
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/60 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer disabled:cursor-wait transition-all"
                  >
                    {isDispatchingApproval ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approving & Sending Email...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Send Greetings Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Meeting & Under Review Modal */}
          {schedulingMeetingApplicant && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0c1a29] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">Schedule Interview Meeting & Under Review Email</h3>
                  </div>
                  <button
                    onClick={() => setSchedulingMeetingApplicant(null)}
                    className="text-[#909096] hover:text-white transition-colors cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-amber-950/60 border border-amber-500/50 rounded-xl p-3 space-y-1 text-xs text-amber-200">
                  <p className="font-bold font-mono text-amber-300 flex items-center gap-1">
                    <span>📧 Email Notice - Status Set to Under Review</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    This will set <strong>{schedulingMeetingApplicant.name}</strong>'s application status to <strong>Under Review</strong> and send an automated email invitation with your meeting schedule directly to <strong>{meetEmailTo}</strong>.
                  </p>
                </div>

                <div className="bg-[#051424] p-4 rounded-xl border border-amber-500/30 space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[#909096] block font-bold">Meeting Date & Time:</label>
                      <input
                        type="text"
                        value={meetDateTime}
                        onChange={(e) => setMeetDateTime(e.target.value)}
                        placeholder="e.g. 2026-08-01 14:00"
                        className="w-full bg-[#102235] text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#909096] block font-bold">Location / Link:</label>
                      <input
                        type="text"
                        value={meetLocation}
                        onChange={(e) => setMeetLocation(e.target.value)}
                        placeholder="Media Studio / Zoom Link"
                        className="w-full bg-[#102235] text-[#d4e4fa] font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#909096] block font-bold">To Email Address (Applicant):</label>
                    <input
                      type="email"
                      value={meetEmailTo}
                      onChange={(e) => setMeetEmailTo(e.target.value)}
                      className="w-full bg-[#102235] text-emerald-300 font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#909096] block font-bold">Email Subject Line:</label>
                    <input
                      type="text"
                      value={meetEmailSubject}
                      onChange={(e) => setMeetEmailSubject(e.target.value)}
                      className="w-full bg-[#102235] text-[#d4e4fa] font-bold px-3 py-1.5 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[#909096] block font-bold">Meeting Invitation Email Body:</label>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('aux_saved_meet_from', meetEmailFrom);
                          localStorage.setItem('aux_saved_meet_subject', meetEmailSubject);
                          localStorage.setItem('aux_saved_meet_body_template', meetEmailBody);
                          alert("💾 Default meeting email template saved! Future meeting invitations will use this sender & format with minimal editing required.");
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 cursor-pointer"
                        title="Save this text & sender as default template for future meeting invites"
                      >
                        <span>💾 Save as Default</span>
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={meetEmailBody}
                      onChange={(e) => setMeetEmailBody(e.target.value)}
                      className="w-full bg-[#102235] text-[#c3c6d7] px-3 py-2 rounded-lg border border-white/10 focus:border-amber-400 outline-none text-xs leading-relaxed font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSchedulingMeetingApplicant(null)}
                    className="px-4 py-2 bg-[#273647] hover:bg-[#32455a] text-xs font-bold rounded-xl text-[#d4e4fa] transition-all cursor-pointer font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDispatchingMeeting}
                    onClick={async () => {
                      if (isDispatchingMeeting) return;
                      if (schedulingMeetingApplicant) {
                        setIsDispatchingMeeting(true);
                        try {
                          await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              from: meetEmailFrom || 'adrich.glife.abelon@gmail.com',
                              to: meetEmailTo,
                              subject: meetEmailSubject,
                              text: meetEmailBody,
                            }),
                          });
                        } catch (err) {
                          console.error('Email dispatch error:', err);
                        } finally {
                          if (onScheduleMeetingApplicant) {
                            onScheduleMeetingApplicant(schedulingMeetingApplicant.id, {
                              dateTime: meetDateTime,
                              location: meetLocation,
                              notes: 'Interview meeting requested.'
                            });
                          }

                          alert(`✅ Under Review status email & meeting schedule automatically sent directly to ${meetEmailTo}!\n\nApplicant ${schedulingMeetingApplicant.name} has been set to Under Review.`);
                          setIsDispatchingMeeting(false);
                          setSchedulingMeetingApplicant(null);
                        }
                      }
                    }}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/60 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer disabled:cursor-wait transition-all font-mono"
                  >
                    {isDispatchingMeeting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Meeting Email...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        Send Under Review & Schedule Meeting Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* ACTIVE MEDIA MEMBERS DIRECTORY */}
      <div className="bg-church-900/40 p-5 rounded-2xl border border-church-700/60 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-church-700/60">
          <h4 className="font-bold text-gold-100 font-serif text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-gold-400" /> Active SocCom Registry ({filteredDirectoryServers.length})
          </h4>

          {/* Fast Search & Role Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search member..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="bg-church-950 text-gold-100 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-church-750 focus:outline-none focus:border-gold-400 w-36 sm:w-44 transition-colors"
              />
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gold-400/50" />
            </div>

            <select
              value={directoryRoleFilter}
              onChange={(e) => setDirectoryRoleFilter(e.target.value)}
              className="bg-church-950 text-gold-100 text-xs rounded-xl px-2.5 py-1.5 border border-church-750 focus:outline-none focus:border-gold-400"
            >
              <option value="all">All Roles</option>
              <option value="ppt">PPT</option>
              <option value="live_server">Live Server</option>
              <option value="documentation">Documentation</option>
              <option value="reels_editor">Reels Editor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredDirectoryServers.length > 0 ? (
            filteredDirectoryServers.map((s) => (
              <ServerCardItem
                key={s.id}
                server={s}
                currentUser={currentUser}
                onDelete={onDeleteServer}
                onAddAnnouncement={onAddAnnouncement}
                onUpdatePassword={onUpdatePassword}
                onUpdateServer={onUpdateServer}
              />
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-xs text-gold-200/40 font-mono">
              No active media members match your search filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function AdminPanel({
  servers,
  schedules,
  receipts,
  soccomOfMonth,
  applicants = [],
  siteSettings,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddServer,
  onDeleteServer,
  onDeleteReceipt,
  onAddAnnouncement,
  onUpdateSoccomOfMonth,
  onApproveApplicant,
  onRejectApplicant,
  onScheduleMeetingApplicant,
  onUpdatePassword,
  onUpdateSiteSettings,
  onUpdateServer,
  currentUser,
  activeSessions = []
}: AdminPanelProps) {
  // Admin view toggle tabs
  const pendingApplicantsCount = useMemo(() => {
    return (applicants || []).filter(a => a.status === 'pending' || a.status === 'under_review').length;
  }, [applicants]);

  const [adminTab, setAdminTab] = useState<'requests' | 'scheduling' | 'members' | 'receipts' | 'branding'>('requests');

  useEffect(() => {
    if (pendingApplicantsCount > 0) {
      setAdminTab('requests');
    }
  }, [pendingApplicantsCount]);

  // Schedule Email Dispatch Modal State
  const [emailModalData, setEmailModalData] = useState<ScheduleEmailDispatchResult | null>(null);

  // Branding & Site Settings Local Form State
  const [bAppName, setBAppName] = useState(siteSettings?.appName || 'Auxiladora Media');
  const [bAppSubtitle, setBAppSubtitle] = useState(siteSettings?.appSubtitle || 'Dedicated Service of Auxiliadora Media Ministry');
  const [bLoginTitle, setBLoginTitle] = useState(siteSettings?.loginTitle || 'Auxiladora Media');
  const [bLoginSubtitle, setBLoginSubtitle] = useState(siteSettings?.loginSubtitle || 'Media Authentication');
  const [bLoginGreeting, setBLoginGreeting] = useState(siteSettings?.loginGreeting || 'Welcome, Media Ministry Member');
  const [bLogoUrl, setBLogoUrl] = useState(siteSettings?.logoUrl || '');
  const [bLoginBgUrl, setBLoginBgUrl] = useState(siteSettings?.loginBgUrl || '');
  const [bParishName, setBParishName] = useState(siteSettings?.parishName || 'Mary Help of Christians Parish');
  const [bContactEmail, setBContactEmail] = useState(siteSettings?.contactEmail || 'soccom@auxiladora.org');
  const [bFooterText, setBFooterText] = useState(siteSettings?.footerText || 'Dedicated Service of Auxiliadora Media Ministry • 2026 Liturgical Year');

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.8);
        setBLogoUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process logo image.');
      }
    }
  };

  const handleLoginBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        setBLoginBgUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process background image.');
      }
    }
  };

  // About & History
  const [bAboutTitle, setBAboutTitle] = useState(siteSettings?.aboutTitle || 'About SocCom & Our History');
  const [bAboutP1, setBAboutP1] = useState(siteSettings?.aboutContentP1 || 'The Social Communications Ministry (SocCom) of Mary Help of Christians Parish is the official digital arm of our community. We strive to utilize modern technology to facilitate spiritual growth, parish engagement, and the proclamation of the Good News.');
  const [bAboutP2, setBAboutP2] = useState(siteSettings?.aboutContentP2 || 'Our mission is to bridge the gap between sacred tradition and the digital age, ensuring that every parishioner remains connected to the life of the Church.');

  // Media Work / Services
  const [bS1Title, setBS1Title] = useState(siteSettings?.service1Title || 'Digital Liturgy');
  const [bS1Desc, setBS1Desc] = useState(siteSettings?.service1Desc || 'Livestreaming of Holy Masses and liturgical celebrations for the homebound and global community.');
  const [bS2Title, setBS2Title] = useState(siteSettings?.service2Title || 'Parish Information');
  const [bS2Desc, setBS2Desc] = useState(siteSettings?.service2Desc || 'Managing social media platforms and the parish website to keep everyone updated on news and events.');
  const [bS3Title, setBS3Title] = useState(siteSettings?.service3Title || 'Visual Documentation');
  const [bS3Desc, setBS3Desc] = useState(siteSettings?.service3Desc || 'Capturing the sacred moments of our parish life through photography and cinematography.');
  const [bS4Title, setBS4Title] = useState(siteSettings?.service4Title || 'Graphic Arts & Production');
  const [bS4Desc, setBS4Desc] = useState(siteSettings?.service4Desc || 'Designing slides, posters, bulletins, and digital collaterals that inspire and inform.');

  // Gallery / Carousel Cards
  const [bC1Title, setBC1Title] = useState(siteSettings?.card1Title || 'Auxiliadora Media Team');
  const [bC1Sub, setBC1Sub] = useState(siteSettings?.card1Subtitle || 'Parish Event Documentation & Coverage');
  const [bC1Img, setBC1Img] = useState(siteSettings?.card1ImageUrl || '');

  const [bC2Title, setBC2Title] = useState(siteSettings?.card2Title || 'SocCom Media Gathering');
  const [bC2Sub, setBC2Sub] = useState(siteSettings?.card2Subtitle || 'Building Communion & Fellowship');
  const [bC2Img, setBC2Img] = useState(siteSettings?.card2ImageUrl || '');

  const [bC3Title, setBC3Title] = useState(siteSettings?.card3Title || 'Liturgical Live Stream Studio');
  const [bC3Sub, setBC3Sub] = useState(siteSettings?.card3Subtitle || 'Multi-Cam Switcher & Digital Audio Broadcasting');
  const [bC3Img, setBC3Img] = useState(siteSettings?.card3ImageUrl || '');

  const [bC4Title, setBC4Title] = useState(siteSettings?.card4Title || 'SocCom Youth Formation Workshop');
  const [bC4Sub, setBC4Sub] = useState(siteSettings?.card4Subtitle || 'Empowering the Next Generation of Media Evangelizers');
  const [bC4Img, setBC4Img] = useState(siteSettings?.card4ImageUrl || '');

  const handleCardImageUploadInAdmin = async (cardIndex: 1 | 2 | 3 | 4, file: File) => {
    try {
      const compressed = await compressImage(file, 1200, 800, 0.8);
      if (cardIndex === 1) setBC1Img(compressed);
      if (cardIndex === 2) setBC2Img(compressed);
      if (cardIndex === 3) setBC3Img(compressed);
      if (cardIndex === 4) setBC4Img(compressed);
    } catch (err) {
      console.error('Card image compression failed:', err);
      alert('Failed to process image file.');
    }
  };

  useEffect(() => {
    if (siteSettings) {
      setBAppName(siteSettings.appName);
      setBAppSubtitle(siteSettings.appSubtitle);
      setBLoginTitle(siteSettings.loginTitle);
      setBLoginSubtitle(siteSettings.loginSubtitle);
      setBLoginGreeting(siteSettings.loginGreeting);
      setBLogoUrl(siteSettings.logoUrl);
      if (siteSettings.loginBgUrl) setBLoginBgUrl(siteSettings.loginBgUrl);
      setBParishName(siteSettings.parishName);
      setBContactEmail(siteSettings.contactEmail);
      setBFooterText(siteSettings.footerText);

      if (siteSettings.aboutTitle) setBAboutTitle(siteSettings.aboutTitle);
      if (siteSettings.aboutContentP1) setBAboutP1(siteSettings.aboutContentP1);
      if (siteSettings.aboutContentP2) setBAboutP2(siteSettings.aboutContentP2);

      if (siteSettings.service1Title) setBS1Title(siteSettings.service1Title);
      if (siteSettings.service1Desc) setBS1Desc(siteSettings.service1Desc);
      if (siteSettings.service2Title) setBS2Title(siteSettings.service2Title);
      if (siteSettings.service2Desc) setBS2Desc(siteSettings.service2Desc);
      if (siteSettings.service3Title) setBS3Title(siteSettings.service3Title);
      if (siteSettings.service3Desc) setBS3Desc(siteSettings.service3Desc);
      if (siteSettings.service4Title) setBS4Title(siteSettings.service4Title);
      if (siteSettings.service4Desc) setBS4Desc(siteSettings.service4Desc);

      if (siteSettings.card1Title) setBC1Title(siteSettings.card1Title);
      if (siteSettings.card1Subtitle) setBC1Sub(siteSettings.card1Subtitle);
      if (siteSettings.card1ImageUrl) setBC1Img(siteSettings.card1ImageUrl);

      if (siteSettings.card2Title) setBC2Title(siteSettings.card2Title);
      if (siteSettings.card2Subtitle) setBC2Sub(siteSettings.card2Subtitle);
      if (siteSettings.card2ImageUrl) setBC2Img(siteSettings.card2ImageUrl);

      if (siteSettings.card3Title) setBC3Title(siteSettings.card3Title);
      if (siteSettings.card3Subtitle) setBC3Sub(siteSettings.card3Subtitle);
      if (siteSettings.card3ImageUrl) setBC3Img(siteSettings.card3ImageUrl);

      if (siteSettings.card4Title) setBC4Title(siteSettings.card4Title);
      if (siteSettings.card4Subtitle) setBC4Sub(siteSettings.card4Subtitle);
      if (siteSettings.card4ImageUrl) setBC4Img(siteSettings.card4ImageUrl);
    }
  }, [siteSettings]);

  const handleSaveAllBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings({
        appName: bAppName,
        appSubtitle: bAppSubtitle,
        loginTitle: bLoginTitle,
        loginSubtitle: bLoginSubtitle,
        loginGreeting: bLoginGreeting,
        logoUrl: bLogoUrl,
        loginBgUrl: bLoginBgUrl,
        parishName: bParishName,
        contactEmail: bContactEmail,
        footerText: bFooterText,

        aboutTitle: bAboutTitle,
        aboutContentP1: bAboutP1,
        aboutContentP2: bAboutP2,

        service1Title: bS1Title,
        service1Desc: bS1Desc,
        service2Title: bS2Title,
        service2Desc: bS2Desc,
        service3Title: bS3Title,
        service3Desc: bS3Desc,
        service4Title: bS4Title,
        service4Desc: bS4Desc,

        card1Title: bC1Title,
        card1Subtitle: bC1Sub,
        card1ImageUrl: bC1Img,

        card2Title: bC2Title,
        card2Subtitle: bC2Sub,
        card2ImageUrl: bC2Img,

        card3Title: bC3Title,
        card3Subtitle: bC3Sub,
        card3ImageUrl: bC3Img,

        card4Title: bC4Title,
        card4Subtitle: bC4Sub,
        card4ImageUrl: bC4Img
      });
      alert('Global Branding, Photos, About History, Media Services & Site Copy updated successfully across the platform! 🎨');
    }
  };

  // FORM STATE: Scheduling Row
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [dayName, setDayName] = useState('');
  const [date, setDate] = useState('');
  const [specialService, setSpecialService] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);

  // Time slots for scheduling
  const standardMassTimes = [
    'Saturday 6:00 PM',
    'Sunday 6:00 AM',
    'Sunday 7:30 AM',
    'Sunday 9:00 AM',
    'Sunday 10:30 AM',
    'Sunday 4:30 PM',
    'Sunday 6:00 PM'
  ];

  // Temporary slot assignments during creation/editing (strictly array-based)
  const [slotAssignments, setSlotAssignments] = useState<Record<string, {
    ppt: string[];
    live_server: string[];
    documentation: string[];
    reels_editor: string[];
    isGoingLive: boolean;
  }>>(
    standardMassTimes.reduce((acc, time) => {
      acc[time] = { ppt: [], live_server: [], documentation: [], reels_editor: [], isGoingLive: false };
      return acc;
    }, {} as Record<string, any>)
  );

  // STATE: Searchable Server Picker Modal (Multi-select)
  const [pickerActive, setPickerActive] = useState<{
    time: string;
    role: SocComRole;
  } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Active Directory search and filter state
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<string>('all');

  const filteredDirectoryServers = useMemo(() => {
    return servers.filter(s => {
      const query = directorySearch.toLowerCase().trim();
      const matchesSearch = !query ||
                            s.name.toLowerCase().includes(query) ||
                            s.role.toLowerCase().includes(query) ||
                            s.birthday.toLowerCase().includes(query);
      const matchesRole = directoryRoleFilter === 'all' || s.role === directoryRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [servers, directorySearch, directoryRoleFilter]);

  // FORM STATE: Member Addition
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('media123');
  const [newMemberBirthday, setNewMemberBirthday] = useState('');
  const [newMemberRoles, setNewMemberRoles] = useState<SocComRole[]>(['ppt']);
  const [newMemberIsSub, setNewMemberIsSub] = useState(false);
  const [newMemberIsAdmin, setNewMemberIsAdmin] = useState(false);

  // Special Serve Modal State
  const [showSpecialServeModal, setShowSpecialServeModal] = useState(false);
  const [specServeTitle, setSpecServeTitle] = useState('');
  const [specServeDate, setSpecServeDate] = useState(new Date().toISOString().split('T')[0]);
  const [specServeTime, setSpecServeTime] = useState('02:00 PM');
  const [specServePpt, setSpecServePpt] = useState<string[]>([]);
  const [specServeDoc, setSpecServeDoc] = useState<string[]>([]);
  const [specServeReels, setSpecServeReels] = useState<string[]>([]);

  const handleSaveSpecialServeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specServeTitle || !specServeDate) return;

    const newSlot: ScheduleSlot = {
      id: `slot-spec-${Date.now()}`,
      time: specServeTime,
      ppt: specServePpt,
      live_server: [],
      documentation: specServeDoc,
      reels_editor: specServeReels,
      isGoingLive: true
    };

    const newSpecialRow: ScheduleRow = {
      id: `sched-spec-${Date.now()}`,
      dayName: specServeTitle,
      date: specServeDate,
      specialService: 'Special Serve Event',
      isLive: true,
      isSpecial: true,
      slots: [newSlot]
    };

    onAddSchedule(newSpecialRow);

    const emailData = generateScheduleEmailData(newSpecialRow, servers);
    if (emailData.batchEmails.length > 0) {
      try {
        const resp = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: currentUser?.email || 'adrich.glife.abelon@gmail.com',
            to: emailData.batchEmails.join(','),
            subject: emailData.subject,
            text: emailData.body
          })
        });
        const resData = await resp.json().catch(() => ({}));
        if (!resp.ok || !resData.success) {
          alert(`⚠️ Email Notice: ${resData.error || 'Could not send email automatically. Please check Vercel environment variables.'}`);
        }
      } catch (err) {
        console.error('Failed to dispatch special serve email:', err);
      }
      setEmailModalData(emailData);
    }

    if (onAddAnnouncement) {
      onAddAnnouncement({
        id: `ann-spec-${Date.now()}`,
        title: `✨ Special Serve Published: ${newSpecialRow.dayName}`,
        content: `Special Liturgical Service "${newSpecialRow.dayName}" scheduled for ${newSpecialRow.date} at ${specServeTime}. ${emailData.batchEmails.length > 0 ? `${emailData.notifiedCount} assigned server(s) notified via email.` : 'Assignments posted to Master Schedule.'}`,
        type: 'reminder',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    setSpecServeTitle('');
    setSpecServePpt([]);
    setSpecServeDoc([]);
    setSpecServeReels([]);
    setShowSpecialServeModal(false);
    alert('Special Serve schedule published! Email sent and announcement created in portal! ⛪');
  };

  // Mapping of Server ID to Server details
  const serverMap = useMemo(() => {
    const map: Record<string, Server> = {};
    servers.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [servers]);

  // Server Picker Options (filtered by search)
  const pickerOptions = useMemo(() => {
    if (!pickerActive) return [];
    return servers.filter(s => 
      s.name.toLowerCase().includes(pickerSearch.toLowerCase())
    );
  }, [servers, pickerActive, pickerSearch]);

  // Handle server toggling (Multi-select server in slot assignment)
  const handleToggleServer = (serverId: string) => {
    if (!pickerActive) return;
    const { time, role } = pickerActive;
    
    setSlotAssignments(prev => {
      const currentArr = prev[time][role] || [];
      const updatedArr = currentArr.includes(serverId)
        ? currentArr.filter(id => id !== serverId)
        : [...currentArr, serverId];
      
      return {
        ...prev,
        [time]: {
          ...prev[time],
          [role]: updatedArr
        }
      };
    });
  };

  // Helper to get formatted comma-separated names for cells
  const getCellLabel = (time: string, role: SocComRole) => {
    const ids = slotAssignments[time]?.[role] || [];
    if (ids.length === 0) return 'No server';
    return ids.map(id => serverMap[id]?.name).filter(Boolean).join(', ');
  };

  // Populate form with existing schedule data for editing
  const handleLoadEditSchedule = (row: ScheduleRow) => {
    setEditingScheduleId(row.id);
    setDayName(row.dayName);
    setDate(row.date);
    setSpecialService(row.specialService || '');
    setIsLive(row.isLive || false);
    setIsSpecial(row.isSpecial || false);

    const loadedSlots: typeof slotAssignments = {};
    const allTimes = Array.from(new Set([
      ...standardMassTimes,
      ...row.slots.map(s => s.time)
    ]));

    allTimes.forEach(time => {
      const match = row.slots.find(s => s.time === time);
      loadedSlots[time] = {
        ppt: Array.isArray(match?.ppt) ? match.ppt : (typeof match?.ppt === 'string' && match.ppt ? [match.ppt] : []),
        live_server: Array.isArray(match?.live_server) ? match.live_server : (typeof match?.live_server === 'string' && match.live_server ? [match.live_server] : []),
        documentation: Array.isArray(match?.documentation) ? match.documentation : (typeof match?.documentation === 'string' && match.documentation ? [match.documentation] : []),
        reels_editor: Array.isArray(match?.reels_editor) ? match.reels_editor : (typeof match?.reels_editor === 'string' && match.reels_editor ? [match.reels_editor] : []),
        isGoingLive: !!match?.isGoingLive
      };
    });
    setSlotAssignments(loadedSlots);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset scheduling form
  const handleResetForm = () => {
    setEditingScheduleId(null);
    setDayName('');
    setDate('');
    setSpecialService('');
    setIsLive(false);
    setIsSpecial(false);
    setSlotAssignments(
      standardMassTimes.reduce((acc, time) => {
        acc[time] = { ppt: [], live_server: [], documentation: [], reels_editor: [], isGoingLive: false };
        return acc;
      }, {} as Record<string, any>)
    );
  };

  // Submit complete liturgy schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayName || !date) {
      alert('Please enter a Sunday/Feast title and Date');
      return;
    }

    const currentTimes = Object.keys(slotAssignments);
    const slots: ScheduleSlot[] = currentTimes.map((time, idx) => ({
      id: `${editingScheduleId || 'sched-' + Date.now()}-slot-${idx}`,
      time,
      ppt: slotAssignments[time]?.ppt || [],
      live_server: slotAssignments[time]?.live_server || [],
      documentation: slotAssignments[time]?.documentation || [],
      reels_editor: slotAssignments[time]?.reels_editor || [],
      isGoingLive: !!slotAssignments[time]?.isGoingLive
    }));

    const completeRow: ScheduleRow = {
      id: editingScheduleId || `sched-${Date.now()}`,
      dayName,
      date,
      specialService,
      isLive,
      isSpecial,
      slots
    };

    if (editingScheduleId) {
      onUpdateSchedule(completeRow);
    } else {
      onAddSchedule(completeRow);
    }

    // Generate schedule email notification dispatch
    const emailData = generateScheduleEmailData(completeRow, servers);

    // Auto-dispatch email via server API route to all assigned recipients
    if (emailData.batchEmails.length > 0) {
      try {
        const resp = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: currentUser?.email || 'adrich.glife.abelon@gmail.com',
            to: emailData.batchEmails.join(','),
            subject: emailData.subject,
            text: emailData.body
          })
        });
        const resData = await resp.json().catch(() => ({}));
        if (!resp.ok || !resData.success) {
          alert(`⚠️ Email Dispatch Notice: ${resData.error || 'Failed to send email. Please verify Vercel SMTP_PASS setting.'}`);
        }
      } catch (err) {
        console.error('Failed to auto-dispatch schedule email:', err);
      }
    }

    setEmailModalData(emailData);

    // Always publish or update announcement in Community Hub & Master Schedule
    if (onAddAnnouncement) {
      onAddAnnouncement({
        id: `ann-sched-${Date.now()}`,
        title: `⛪ Schedule ${editingScheduleId ? 'Updated' : 'Published'}: ${completeRow.dayName}`,
        content: `Liturgy schedule for ${completeRow.dayName} (${completeRow.date}) has been ${editingScheduleId ? 'updated' : 'published'}! ${emailData.batchEmails.length > 0 ? `${emailData.notifiedCount} assigned media server(s) notified via automated email.` : 'Schedule updated in portal.'}`,
        type: 'reminder',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    alert(`✅ Liturgy schedule "${completeRow.dayName}" (${completeRow.date}) ${editingScheduleId ? 'updated' : 'published'}! ${emailData.batchEmails.length > 0 ? `Notification email automatically sent to ${emailData.batchEmails.length} server(s).` : 'Master schedule registry updated.'}`);

    handleResetForm();
  };

  // Add a new member to the directory
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberBirthday) {
      alert('Please enter member name and birthday');
      return;
    }

    const rolesList = newMemberRoles.length > 0 ? newMemberRoles : ['ppt' as SocComRole];
    const emailVal = newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@auxiladora.org`;
    const passwordVal = newMemberPassword.trim() || 'media123';

    const emailNorm = emailVal.trim().toLowerCase();
    const existing = servers.find(s => s.email.trim().toLowerCase() === emailNorm);
    if (existing) {
      alert(`⚠️ Account Creation Blocked: An account with email "${emailVal}" already exists (${existing.name}). Strictly 1 account per email address.`);
      return;
    }

    const newServer: Server = {
      id: `server-${Date.now()}`,
      name: newMemberName,
      email: emailVal,
      password: passwordVal,
      accessToken: passwordVal,
      role: rolesList[0],
      roles: rolesList,
      picture: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=300&q=80`,
      workImages: [
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
      ],
      isSubAdmin: newMemberIsSub,
      isAdmin: newMemberIsAdmin,
      birthday: newMemberBirthday
    };

    onAddServer(newServer);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('media123');
    setNewMemberBirthday('');
    setNewMemberRoles(['ppt']);
    setNewMemberIsSub(false);
    setNewMemberIsAdmin(false);
    alert(`New SocCom member added to directory! Default login password: ${passwordVal}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 🔔 PENDING JOIN REQUESTS ALERT BANNER */}
      {pendingApplicantsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-church-900 border-2 border-amber-500/70 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-church-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-200 flex items-center gap-2 font-serif">
                <span>🔔 Action Required: {pendingApplicantsCount} Pending Join Request{pendingApplicantsCount > 1 ? 's' : ''}</span>
                <span className="bg-amber-400 text-church-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full uppercase">Review Now</span>
              </h4>
              <p className="text-xs text-amber-300/90 font-mono mt-0.5">
                New volunteers have submitted applications to join Auxiliadora Media Ministry. Review and approve their account requests.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminTab('requests')}
            className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-church-950 rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap font-mono shrink-0 flex items-center gap-1.5 uppercase tracking-wide"
          >
            <UserPlus className="w-4 h-4" />
            <span>Review Join Requests ({pendingApplicantsCount})</span>
          </button>
        </div>
      )}

      {/* 📱 LIVE CONNECTED DEVICES & ACTIVE SESSIONS MONITOR */}
      <div className="bg-[#122131] border border-emerald-500/30 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#46464c]/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/40 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#d4e4fa] flex items-center gap-2">
                <span>Live Connected Devices & Sessions</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeSessions.length} Device{activeSessions.length === 1 ? '' : 's'} Online
                </span>
              </h3>
              <p className="text-[11px] text-[#909096] font-mono">
                Multi-device login enabled. Any member can log in simultaneously from smartphones, laptops, or tablets.
              </p>
            </div>
          </div>
        </div>

        {activeSessions.length === 0 ? (
          <p className="text-xs text-[#909096] italic font-mono py-1">Connecting to active device session monitor...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {activeSessions.map((sess, idx) => {
              const matchedServer = servers.find(s => s.id === sess.userId);
              const displayName = sess.userName || matchedServer?.name || sess.email || 'Member';
              return (
                <div key={sess.sessionId || idx} className="bg-[#0b1726] border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-3 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/40">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#d4e4fa] truncate">{displayName}</p>
                    <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 truncate">
                      <span>{sess.deviceType || '📱 Mobile / Desktop'}</span>
                      <span>•</span>
                      <span className="text-emerald-300">Connected</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tab Switchers inside Admin */}
      <div className="flex border border-church-700 bg-church-950 p-1 rounded-xl max-w-3xl shadow-inner overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setAdminTab('requests')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'requests' 
              ? 'bg-amber-500 text-church-950 shadow-sm font-extrabold' 
              : pendingApplicantsCount > 0
                ? 'text-amber-300 hover:text-white bg-amber-500/20 border border-amber-500/40 animate-pulse'
                : 'text-gold-100/50 hover:text-gold-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Join Requests</span>
          {pendingApplicantsCount > 0 && (
            <span className="bg-amber-400 text-church-950 font-black text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {pendingApplicantsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('scheduling')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
            adminTab === 'scheduling' 
              ? 'bg-church-800 text-gold-300 shadow-sm' 
              : 'text-gold-100/50 hover:text-gold-200'
          }`}
        >
          Scheduling & Registry
        </button>
        <button
          onClick={() => setAdminTab('members')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
            adminTab === 'members' 
              ? 'bg-church-800 text-gold-300 shadow-sm' 
              : 'text-gold-100/50 hover:text-gold-200'
          }`}
        >
          Members Directory
        </button>
        <button
          onClick={() => setAdminTab('receipts')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
            adminTab === 'receipts' 
              ? 'bg-church-800 text-gold-300 shadow-sm' 
              : 'text-gold-100/50 hover:text-gold-200'
          }`}
        >
          Spiritual Receipts ({receipts.length})
        </button>
        <button
          onClick={() => setAdminTab('branding')}
          className={`px-4 py-2 text-xs font-bold tracking-wide uppercase rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'branding' 
              ? 'bg-gold-500 text-church-950 shadow-sm font-extrabold' 
              : 'text-gold-300 hover:text-white bg-gold-500/10'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Branding & Logo</span>
        </button>
      </div>

      {/* VIEW: JOIN REQUESTS & APPLICATIONS */}
      {adminTab === 'requests' && (
        <div className="space-y-6 animate-fade-in">
          <ActiveMediaDirectory
            servers={servers}
            applicants={applicants}
            currentUser={currentUser}
            onDeleteServer={onDeleteServer}
            onAddAnnouncement={onAddAnnouncement}
            onApproveApplicant={onApproveApplicant}
            onRejectApplicant={onRejectApplicant}
            onScheduleMeetingApplicant={onScheduleMeetingApplicant}
            onUpdatePassword={onUpdatePassword}
            onUpdateServer={onUpdateServer}
          />
        </div>
      )}

      {/* VIEW: SCHEDULING & REGISTRY */}
      {adminTab === 'scheduling' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Create Schedule Form Card */}
            <form onSubmit={handleSaveSchedule} className="xl:col-span-8 bg-church-900/40 p-6 rounded-2xl border border-church-700/60 space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-church-700/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-5 h-5 text-gold-400" />
                  <h3 className="font-bold text-gold-100 font-serif text-base">
                    {editingScheduleId ? '✏️ Edit Liturgical Schedule' : '🆕 Create Liturgical Schedule'}
                  </h3>
                </div>
                {editingScheduleId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs bg-church-800 hover:bg-church-750 text-gold-200 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-church-700 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Clear Edit
                  </button>
                )}
              </div>

              {/* General Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gold-300">Sunday / Feast / Liturgy Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sixteenth Sunday in Ordinary Time"
                    value={dayName}
                    onChange={(e) => setDayName(e.target.value)}
                    className="bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gold-300">Target Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gold-300">Special Service / Live Stream Toggle</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Special Service Title (Optional)"
                      value={specialService}
                      onChange={(e) => setSpecialService(e.target.value)}
                      className="bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setIsLive(!isLive)}
                      className={`px-3 py-3 rounded-xl border text-xs font-bold font-mono transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        isLive
                          ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/50'
                          : 'bg-church-950 text-gold-300 border-church-700 hover:border-red-500/50'
                      }`}
                      title="Toggle weekend live status"
                    >
                      <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-ping' : 'bg-red-500'}`}></span>
                      <span>{isLive ? 'LIVE' : 'Go Live'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mass Slots Scheduling Matrix */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-church-700/40 gap-2">
                  <h4 className="text-xs font-bold text-gold-300 uppercase tracking-widest font-mono">Liturgical Mass Slots Assignments</h4>
                  <p className="text-[10px] text-gold-400/40 font-mono">Click a cell to assign servers. Toggle "Go Live" if live broadcast is scheduled.</p>
                </div>

                <div className="space-y-2.5">
                  {standardMassTimes.map((time) => {
                    const isSlotGoingLive = !!slotAssignments[time]?.isGoingLive;

                    return (
                      <div
                        key={time}
                        className={`grid grid-cols-1 lg:grid-cols-12 gap-3 p-3.5 rounded-xl border items-center shadow-sm transition-all duration-300 ${
                          isSlotGoingLive
                            ? 'bg-red-950/70 border-red-500/80 ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                            : 'bg-church-950 border-church-750'
                        }`}
                      >
                        
                        {/* Slot name and Going Live Switch */}
                        <div className="lg:col-span-4 flex items-center justify-between lg:justify-start gap-4">
                          <span className={`font-bold text-xs font-mono block ${isSlotGoingLive ? 'text-red-200' : 'text-gold-200'}`}>
                            {time}
                          </span>
                          
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                            isSlotGoingLive
                              ? 'bg-red-600 text-white border-red-400 shadow-sm animate-pulse'
                              : 'bg-church-900/85 border-church-800'
                          }`}>
                            <label className={`text-[9px] font-bold uppercase font-mono tracking-wide cursor-pointer select-none ${
                              isSlotGoingLive ? 'text-white' : 'text-gold-400/80'
                            }`} htmlFor={`live-${time}`}>
                              {isSlotGoingLive ? 'LIVE NOW' : 'Go Live?'}
                            </label>
                            <input
                              type="checkbox"
                              id={`live-${time}`}
                              checked={isSlotGoingLive}
                              onChange={(e) => setSlotAssignments(prev => ({
                                ...prev,
                                [time]: {
                                  ...prev[time],
                                  isGoingLive: e.target.checked
                                }
                              }))}
                              className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                            />
                          </div>
                        </div>

                      {/* 3 Multi-role picker cells: PPT, Documentation, Reels */}
                      <div className="lg:col-span-8 grid grid-cols-3 gap-2">
                        
                        {/* 1. PPT CELL */}
                        <button
                          type="button"
                          id={`cell-${time.replace(/\s+/g, '-')}-ppt`}
                          onClick={() => setPickerActive({ time, role: 'ppt' })}
                          className={`text-left p-2 rounded-lg border text-[11px] transition-all overflow-hidden cursor-pointer ${
                            (slotAssignments[time]?.ppt || []).length > 0 
                              ? 'bg-gold-500/5 border-gold-500/30 text-gold-100 hover:border-gold-400' 
                              : 'bg-church-900 border-church-800 text-gold-100/20 hover:bg-church-800/60'
                          }`}
                        >
                          <span className="text-[9px] uppercase text-gold-400 font-mono block font-bold">1. PPT</span>
                          <span className="truncate block font-bold text-[10px]">
                            {getCellLabel(time, 'ppt')}
                          </span>
                        </button>

                        {/* 2. DOCUMENTATION CELL */}
                        <button
                          type="button"
                          id={`cell-${time.replace(/\s+/g, '-')}-documentation`}
                          onClick={() => setPickerActive({ time, role: 'documentation' })}
                          className={`text-left p-2 rounded-lg border text-[11px] transition-all overflow-hidden cursor-pointer ${
                            (slotAssignments[time]?.documentation || []).length > 0 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 hover:border-emerald-400' 
                              : 'bg-church-900 border-church-800 text-gold-100/20 hover:bg-church-800/60'
                          }`}
                        >
                          <span className="text-[9px] uppercase text-emerald-400 font-mono block font-bold">2. DOC</span>
                          <span className="truncate block font-bold text-[10px]">
                            {getCellLabel(time, 'documentation')}
                          </span>
                        </button>

                        {/* 3. REELS CELL */}
                        <button
                          type="button"
                          id={`cell-${time.replace(/\s+/g, '-')}-reels_editor`}
                          onClick={() => setPickerActive({ time, role: 'reels_editor' })}
                          className={`text-left p-2 rounded-lg border text-[11px] transition-all overflow-hidden cursor-pointer ${
                            (slotAssignments[time]?.reels_editor || []).length > 0 
                              ? 'bg-amber-900/10 border-amber-600/30 text-amber-100 hover:border-amber-400' 
                              : 'bg-church-900 border-church-800 text-gold-100/20 hover:bg-church-800/60'
                          }`}
                        >
                          <span className="text-[9px] uppercase text-amber-400 font-mono block font-bold">3. REELS</span>
                          <span className="truncate block font-bold text-[10px]">
                            {getCellLabel(time, 'reels_editor')}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-church-700/60">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-gold-300 hover:text-white border border-church-750 px-5 py-2.5 rounded-xl hover:bg-church-950 transition-colors cursor-pointer"
                >
                  Clear Fields
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpecialServeModal(true)}
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Award className="w-4 h-4" />
                  Special Serve
                </button>
                <button
                  type="submit"
                  className="text-xs bg-gold-600 hover:bg-gold-500 text-church-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {editingScheduleId ? 'Update & Reupload' : 'Publish Weekend Schedule'}
                </button>
              </div>
            </form>

            {/* Right Side: Active Schedules Registry */}
            <div className="xl:col-span-4 space-y-4">
              <div className="bg-church-900/40 p-5 rounded-2xl border border-church-700/60 shadow-md">
                <h4 className="font-bold text-gold-100 font-serif text-sm mb-3.5 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gold-400" />
                  Published Weekends ({schedules.length})
                </h4>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {schedules.map((sched) => (
                    <div key={sched.id} className="p-3.5 bg-church-950 rounded-xl border border-church-750 space-y-2.5 shadow-inner">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-gold-300 font-bold">{sched.date}</span>
                          {sched.isSpecial && (
                            <span className="text-[8px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/35 font-bold px-1.5 py-0.5 rounded tracking-wider">SPECIAL</span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs text-gold-100 font-serif truncate mt-0.5">{sched.dayName}</h5>
                        {sched.specialService && (
                          <p className="text-[9px] text-gold-400 font-medium mt-0.5">✨ {sched.specialService}</p>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end items-center">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSchedule({
                              ...sched,
                              isLive: !sched.isLive
                            });
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 font-mono ${
                            sched.isLive
                              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/40 animate-pulse'
                              : 'bg-church-900 text-gold-300 hover:bg-red-950/40 hover:text-red-300 border-church-700'
                          }`}
                          title="Toggle Live Broadcast"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sched.isLive ? 'bg-white animate-ping' : 'bg-red-500'}`}></span>
                          <span>{sched.isLive ? 'LIVE NOW' : 'Go Live'}</span>
                        </button>

                        <button
                          id={`btn-edit-sched-${sched.id}`}
                          onClick={() => handleLoadEditSchedule(sched)}
                          className="text-[10px] bg-church-900 text-gold-200 hover:bg-church-850 px-3 py-1.5 rounded-md border border-church-700 transition-colors cursor-pointer"
                        >
                          Edit Slots
                        </button>
                        <DeleteIconButton
                          onDelete={() => onDeleteSchedule(sched.id)}
                          title="Delete Schedule"
                          className="text-[10px] bg-red-950/25 text-red-400 border border-red-900/30 hover:bg-red-900/40 p-1.5 rounded-md transition-colors cursor-pointer shrink-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-church-950 p-4.5 rounded-xl border border-church-750 text-xs text-gold-200/60 space-y-2 leading-relaxed">
                <div className="flex gap-1.5 items-center font-bold text-gold-100 mb-1 text-[11px] uppercase font-mono">
                  <Info className="w-4 h-4 text-gold-400" />
                  Instant Publishing
                </div>
                <p>When you create, edit, or reupload schedules as Admin or Sub-Admin, assignments are saved instantly in the parish directory database. Staff members are notified in their Control workspaces immediately.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW: MANAGE MEMBERS */}
      {adminTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Add Server Form */}
          <form onSubmit={handleAddMember} className="lg:col-span-4 bg-church-900/40 p-6 rounded-2xl border border-church-700/60 space-y-4 shadow-md">
            <h4 className="font-bold text-gold-100 font-serif text-sm pb-2 border-b border-church-700/60 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-gold-400" /> Register SocCom Member
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gold-300">Member Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Juan Dela Cruz"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gold-300">Email Address</label>
                <input
                  type="email"
                  placeholder="juan@auxiladora.org"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gold-300">Default Password</label>
                <input
                  type="text"
                  required
                  placeholder="media123"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  className="w-full bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gold-300 flex items-center justify-between">
                <span>Birthday (Pick from Calendar)</span>
                <span className="text-[10px] text-amber-300 font-mono">📅 Calendar Date</span>
              </label>
              <input
                type="date"
                required
                value={formatBirthdayForInput(newMemberBirthday) || newMemberBirthday}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewMemberBirthday(val ? formatBirthdayForDisplay(val) : '');
                }}
                className="w-full bg-church-950 text-gold-100 text-xs rounded-xl p-3 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400 font-mono"
              />
            </div>

            {/* Multiple Checkboxes for Primary Liturgy Roles */}
            <div className="space-y-2 pt-2 border-t border-church-700/40">
              <label className="text-xs font-bold text-gold-300 block">Primary Liturgy Roles (Select Multiple)</label>
              <div className="grid grid-cols-2 gap-2 text-xs text-gold-200">
                {[
                  { id: 'ppt', label: 'PPT Screen Operator' },
                  { id: 'live_server', label: 'Live Stream Server' },
                  { id: 'documentation', label: 'Documentation / Photo' },
                  { id: 'reels_editor', label: 'Reels / Video Editor' }
                ].map(r => (
                  <label key={r.id} className="flex items-center gap-2 p-2 bg-church-950 rounded-xl border border-church-800 cursor-pointer hover:border-gold-500/40">
                    <input
                      type="checkbox"
                      checked={newMemberRoles.includes(r.id as SocComRole)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewMemberRoles(prev => [...prev, r.id as SocComRole]);
                        } else {
                          setNewMemberRoles(prev => prev.filter(item => item !== r.id));
                        }
                      }}
                      className="w-4 h-4 accent-gold-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono leading-tight">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-church-700/40">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="newMemberIsSub"
                  checked={newMemberIsSub}
                  onChange={(e) => setNewMemberIsSub(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
                <label htmlFor="newMemberIsSub" className="text-xs text-gold-200 cursor-pointer">
                  Grant Sub-Admin privileges (Can edit schedules)
                </label>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="newMemberIsAdmin"
                  checked={newMemberIsAdmin}
                  onChange={(e) => setNewMemberIsAdmin(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
                <label htmlFor="newMemberIsAdmin" className="text-xs text-gold-200 cursor-pointer">
                  Grant Full Admin privileges (Can manage teams)
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 text-xs bg-gold-600 hover:bg-gold-500 text-church-950 font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              Add Member to Registry
            </button>
          </form>

          {/* Active Members Directory & Applications */}
          <ActiveMediaDirectory
            servers={servers}
            applicants={applicants}
            currentUser={currentUser}
            onDeleteServer={onDeleteServer}
            onAddAnnouncement={onAddAnnouncement}
            onApproveApplicant={onApproveApplicant}
            onRejectApplicant={onRejectApplicant}
            onScheduleMeetingApplicant={onScheduleMeetingApplicant}
            onUpdatePassword={onUpdatePassword}
            onUpdateServer={onUpdateServer}
          />
        </div>
      )}

      {/* VIEW: SERVICE RECEIPTS (REFLECTIONS) */}
      {adminTab === 'receipts' && (
        <div className="bg-church-900/40 p-6 rounded-2xl border border-church-700/60 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3.5 border-b border-church-700/60">
            <h4 className="font-bold text-gold-100 font-serif text-sm flex items-center gap-1.5">
              <BookOpenText className="w-4 h-4 text-gold-400" />
              Liturgy Service Reflections Archive
            </h4>
            <span className="text-xs bg-church-950 px-3.5 py-1 border border-church-750 text-gold-300 font-mono rounded font-bold">
              {receipts.length} total reflections
            </span>
          </div>

          {receipts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receipts.map((receipt) => {
                const author = serverMap[receipt.serverId];
                return (
                  <div key={receipt.id} className="p-4 rounded-xl bg-church-950 border border-church-750 relative space-y-3.5 hover:border-gold-500/20 transition-colors shadow-sm">
                    <DeleteIconButton
                      onDelete={() => onDeleteReceipt(receipt.id)}
                      title="Delete Receipt"
                      className="absolute top-3.5 right-3.5 text-gold-400/30 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                    />

                    <div className="flex items-center gap-2.5">
                      <img
                        src={author?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                        alt={receipt.serverName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-gold-500/20 shadow-sm"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-gold-100">{receipt.serverName}</h5>
                        <p className="text-[9px] text-gold-400/60 font-mono mt-0.5 font-bold uppercase tracking-wider">{receipt.role.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-church-900 border border-church-700/40 text-[11px] text-gold-200">
                      <p className="font-mono text-[9px] text-gold-400 font-bold mb-0.5">{receipt.date} • {receipt.time}</p>
                      <p className="font-bold text-gold-100 font-serif">{receipt.dayName}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-gold-400 font-mono font-bold block">Spiritual Reflection:</span>
                      <p className="text-xs text-gold-200/95 italic leading-relaxed bg-church-900/30 p-3 rounded-lg border border-church-700/20 font-serif">
                        "{receipt.reflection}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gold-200/40 text-xs font-medium font-serif">
              No liturgical reflections received yet. Encourage team members to write reflections in their workspace!
            </div>
          )}
        </div>
      )}

      {/* VIEW: BRANDING, LOGO & GREETING SETTINGS */}
      {adminTab === 'branding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Form Column */}
            <form onSubmit={handleSaveAllBranding} className="xl:col-span-7 bg-church-900/40 p-6 rounded-2xl border border-church-700/60 space-y-6 shadow-md">
              <div className="border-b border-church-700 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-gold-100 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-gold-400" />
                    Global Branding & Login Control
                  </h3>
                  <p className="text-xs text-gold-200/60">Edit all text labels, login screen greeting, brand titles and logo images</p>
                </div>
                <button
                  type="submit"
                  className="bg-gold-500 hover:bg-gold-400 text-church-950 font-bold px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Branding
                </button>
              </div>

              {/* 1. Brand & App Title */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> 1. Application Identity
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gold-200 font-mono">App Title (Header & Sidebar)</label>
                    <input
                      type="text"
                      required
                      value={bAppName}
                      onChange={(e) => setBAppName(e.target.value)}
                      className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-serif font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gold-200 font-mono">App Subtitle / Ministry Name</label>
                    <input
                      type="text"
                      value={bAppSubtitle}
                      onChange={(e) => setBAppSubtitle(e.target.value)}
                      className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Login Screen Texts */}
              <div className="space-y-4 pt-2 border-t border-church-800">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> 2. Login Screen & Greeting
                </h4>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gold-200 font-mono">Login Header Headline</label>
                      <input
                        type="text"
                        required
                        value={bLoginTitle}
                        onChange={(e) => setBLoginTitle(e.target.value)}
                        className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-serif font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gold-200 font-mono">Login Subtitle Badge</label>
                      <input
                        type="text"
                        value={bLoginSubtitle}
                        onChange={(e) => setBLoginSubtitle(e.target.value)}
                        className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gold-200 font-mono">Welcome Greeting Note</label>
                    <input
                      type="text"
                      value={bLoginGreeting}
                      onChange={(e) => setBLoginGreeting(e.target.value)}
                      placeholder="e.g. Welcome to Auxiliadora Media Ministry Portal"
                      className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs italic"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Logo Picture Control */}
              <div className="space-y-4 pt-2 border-t border-church-800">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Image className="w-4 h-4" /> 3. Logo File & Picture Settings</span>
                  <span className="text-[10px] text-emerald-400 font-normal">PNG, PDF, SVG Upload Supported</span>
                </h4>

                <div className="space-y-3 bg-church-950/60 p-4 rounded-xl border border-church-700/80">
                  {/* File Upload Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gold-200 font-mono">Upload New Logo File (PNG, PDF, SVG, WebP)</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp, application/pdf"
                      onChange={handleLogoFileUpload}
                      className="w-full text-xs text-gold-200 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-gold-500/20 file:text-gold-300 hover:file:bg-gold-500/30 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-semibold text-gold-200/80 font-mono">Or Logo Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bLogoUrl}
                        onChange={(e) => setBLogoUrl(e.target.value)}
                        placeholder="Paste image link URL or upload file above"
                        className="flex-1 bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-mono"
                      />
                      {bLogoUrl && (
                        <div className="w-12 h-12 rounded-xl border border-gold-500/50 bg-black/40 overflow-hidden flex items-center justify-center p-1 shrink-0">
                          <img
                            src={bLogoUrl}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preset Logos */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gold-400/80 font-mono">Quick Preset Logo Pictures:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setBLogoUrl('https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=300&q=80')}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-church-950 text-gold-300 hover:bg-gold-500/20 border border-church-700 transition-colors"
                      >
                        ⛪ Cathedral Cross
                      </button>
                      <button
                        type="button"
                        onClick={() => setBLogoUrl('https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80')}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-church-950 text-gold-300 hover:bg-gold-500/20 border border-church-700 transition-colors"
                      >
                        🎥 Cinema Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => setBLogoUrl('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80')}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-church-950 text-gold-300 hover:bg-gold-500/20 border border-church-700 transition-colors"
                      >
                        🎙️ Audio Console
                      </button>
                      <button
                        type="button"
                        onClick={() => setBLogoUrl('')}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-church-950 text-red-300 hover:bg-red-500/20 border border-church-700 transition-colors"
                      >
                        🛡️ Default Shield Icon
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Login Background Picture Settings */}
              <div className="space-y-4 pt-2 border-t border-church-800">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Image className="w-4 h-4" /> 4. Login Screen Background Watermark</span>
                  <span className="text-[10px] text-amber-300 font-normal">Custom Background Photo</span>
                </h4>

                <div className="space-y-3 bg-church-950/60 p-4 rounded-xl border border-church-700/80">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gold-200 font-mono">Upload Custom Login Background (PNG, JPG, WebP)</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLoginBgFileUpload}
                      className="w-full text-xs text-gold-200 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-semibold text-gold-200/80 font-mono">Or Background Picture URL</label>
                    <input
                      type="text"
                      value={bLoginBgUrl}
                      onChange={(e) => setBLoginBgUrl(e.target.value)}
                      placeholder="Paste image URL for login background..."
                      className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-mono"
                    />
                  </div>

                  {bLoginBgUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-amber-500/30 max-h-36 bg-black/50 flex items-center justify-center p-2">
                      <img
                        src={bLoginBgUrl}
                        alt="Login Background Preview"
                        className="max-h-32 object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setBLoginBgUrl('')}
                        className="absolute top-2 right-2 text-[10px] bg-red-950/80 hover:bg-red-900 text-red-200 px-2 py-1 rounded font-mono border border-red-800 transition-colors cursor-pointer"
                      >
                        Reset Background
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Parish & Footer Settings */}
              <div className="space-y-4 pt-2 border-t border-church-800">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> 4. Parish & Footer Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gold-200 font-mono">Parish Name</label>
                    <input
                      type="text"
                      value={bParishName}
                      onChange={(e) => setBParishName(e.target.value)}
                      className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gold-200 font-mono">Contact Email</label>
                    <input
                      type="email"
                      value={bContactEmail}
                      onChange={(e) => setBContactEmail(e.target.value)}
                      className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gold-200 font-mono">Footer Subtext</label>
                  <input
                    type="text"
                    value={bFooterText}
                    onChange={(e) => setBFooterText(e.target.value)}
                    className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs"
                  />
                </div>
              </div>

              {/* 5. About SocCom & History Settings */}
              <div className="space-y-4 pt-2 border-t border-church-800">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> 5. About SocCom & History Content
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gold-200 font-mono">About Section Title</label>
                  <input
                    type="text"
                    value={bAboutTitle}
                    onChange={(e) => setBAboutTitle(e.target.value)}
                    className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gold-200 font-mono">History / Mission Paragraph 1</label>
                  <textarea
                    rows={3}
                    value={bAboutP1}
                    onChange={(e) => setBAboutP1(e.target.value)}
                    className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gold-200 font-mono">History / Mission Paragraph 2</label>
                  <textarea
                    rows={3}
                    value={bAboutP2}
                    onChange={(e) => setBAboutP2(e.target.value)}
                    className="w-full bg-church-950 border border-church-700 rounded-xl p-2.5 text-gold-100 focus:outline-none focus:border-gold-400 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* 6. Our Media Work Services */}
              <div className="space-y-4 pt-2 border-t border-church-800">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4" /> 6. Our Media Work (Services) Content
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <label className="text-[11px] font-bold text-gold-300 font-mono">Service 1 (Digital Liturgy)</label>
                    <input
                      type="text"
                      value={bS1Title}
                      onChange={(e) => setBS1Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={bS1Desc}
                      onChange={(e) => setBS1Desc(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs"
                    />
                  </div>

                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <label className="text-[11px] font-bold text-gold-300 font-mono">Service 2 (Parish Info)</label>
                    <input
                      type="text"
                      value={bS2Title}
                      onChange={(e) => setBS2Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={bS2Desc}
                      onChange={(e) => setBS2Desc(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs"
                    />
                  </div>

                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <label className="text-[11px] font-bold text-gold-300 font-mono">Service 3 (Documentation)</label>
                    <input
                      type="text"
                      value={bS3Title}
                      onChange={(e) => setBS3Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={bS3Desc}
                      onChange={(e) => setBS3Desc(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs"
                    />
                  </div>

                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <label className="text-[11px] font-bold text-gold-300 font-mono">Service 4 (Graphic Arts)</label>
                    <input
                      type="text"
                      value={bS4Title}
                      onChange={(e) => setBS4Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={bS4Desc}
                      onChange={(e) => setBS4Desc(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded-lg p-2 text-gold-100 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Community Gallery Cards */}
              <div className="space-y-4 pt-2 border-t border-church-800">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Image className="w-4 h-4" /> 7. Community Gallery Cards & Pictures</span>
                  <span className="text-[10px] text-emerald-400 font-normal">File Upload & Image Link Supported</span>
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {/* Card 1 */}
                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gold-300 font-mono">Card 1: Title, Subtitle & Picture</label>
                      {bC1Img && (
                        <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                          <img src={bC1Img} alt="Card 1 Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Title"
                      value={bC1Title}
                      onChange={(e) => setBC1Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={bC1Sub}
                      onChange={(e) => setBC1Sub(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-[11px]"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Photo File or Paste Link:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleCardImageUploadInAdmin(1, e.target.files[0])}
                        className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Image URL link"
                        value={bC1Img}
                        onChange={(e) => setBC1Img(e.target.value)}
                        className="w-full bg-church-900 border border-church-700 rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                      />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gold-300 font-mono">Card 2: Title, Subtitle & Picture</label>
                      {bC2Img && (
                        <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                          <img src={bC2Img} alt="Card 2 Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Title"
                      value={bC2Title}
                      onChange={(e) => setBC2Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={bC2Sub}
                      onChange={(e) => setBC2Sub(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-[11px]"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Photo File or Paste Link:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleCardImageUploadInAdmin(2, e.target.files[0])}
                        className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Image URL link"
                        value={bC2Img}
                        onChange={(e) => setBC2Img(e.target.value)}
                        className="w-full bg-church-900 border border-church-700 rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                      />
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gold-300 font-mono">Card 3: Title, Subtitle & Picture</label>
                      {bC3Img && (
                        <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                          <img src={bC3Img} alt="Card 3 Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Title"
                      value={bC3Title}
                      onChange={(e) => setBC3Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={bC3Sub}
                      onChange={(e) => setBC3Sub(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-[11px]"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Photo File or Paste Link:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleCardImageUploadInAdmin(3, e.target.files[0])}
                        className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Image URL link"
                        value={bC3Img}
                        onChange={(e) => setBC3Img(e.target.value)}
                        className="w-full bg-church-900 border border-church-700 rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                      />
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="p-3 bg-church-950 rounded-xl border border-church-750 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gold-300 font-mono">Card 4: Title, Subtitle & Picture</label>
                      {bC4Img && (
                        <div className="w-10 h-10 rounded-lg border border-gold-500/40 overflow-hidden shrink-0 bg-black/40">
                          <img src={bC4Img} alt="Card 4 Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Title"
                      value={bC4Title}
                      onChange={(e) => setBC4Title(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={bC4Sub}
                      onChange={(e) => setBC4Sub(e.target.value)}
                      className="w-full bg-church-900 border border-church-700 rounded p-2 text-gold-100 text-[11px]"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-200/80 font-mono block">Upload New Photo File or Paste Link:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleCardImageUploadInAdmin(4, e.target.files[0])}
                        className="w-full text-[10px] text-gold-200 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-gold-500/20 file:text-gold-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="Image URL link"
                        value={bC4Img}
                        onChange={(e) => setBC4Img(e.target.value)}
                        className="w-full bg-church-900 border border-church-700 rounded p-1.5 text-gold-100 text-[10px] font-mono mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-church-700 flex justify-end">
                <button
                  type="submit"
                  className="bg-gold-500 hover:bg-gold-400 text-church-950 font-bold px-6 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save All Branding, Text & Copy
                </button>
              </div>
            </form>

            {/* Live Preview Column */}
            <div className="xl:col-span-5 space-y-5">
              
              {/* Header & Sidebar Preview */}
              <div className="bg-church-900/40 p-5 rounded-2xl border border-church-700/60 space-y-3 shadow-md">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Live Header & Sidebar Preview
                </h4>
                
                {/* Mock Header */}
                <div className="p-3 bg-[#122131] rounded-xl border border-[#46464c]/40 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2">
                    {bLogoUrl ? (
                      <img
                        src={bLogoUrl}
                        alt="Logo"
                        className="w-6 h-6 rounded-md object-cover border border-gold-500/40"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Shield className="w-5 h-5 text-gold-400" />
                    )}
                    <span className="font-serif font-bold text-white text-sm">
                      {bAppName || 'Auxiladora Media'}
                    </span>
                  </div>
                  <span className="text-[9px] bg-[#0b57d0]/20 text-[#b2c5ff] px-2 py-0.5 rounded font-mono">
                    ONLINE
                  </span>
                </div>

                {/* Mock Sidebar Badge */}
                <div className="p-3 bg-[#051424] rounded-xl border border-[#46464c]/30 flex items-center gap-3">
                  {bLogoUrl && (
                    <img
                      src={bLogoUrl}
                      alt="Logo"
                      className="w-8 h-8 rounded-lg object-cover border border-gold-500/40 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <p className="font-serif font-bold text-white text-xs">{bAppName}</p>
                    <p className="text-[9px] text-[#909096] uppercase font-mono font-semibold">{bAppSubtitle}</p>
                  </div>
                </div>
              </div>

              {/* Login Card Live Preview */}
              <div className="bg-church-900/40 p-5 rounded-2xl border border-church-700/60 space-y-3 shadow-md">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Live Login Screen Preview
                </h4>

                <div className="p-5 bg-[#0b1326] rounded-xl border border-white/10 flex flex-col items-center text-center gap-2 shadow-inner">
                  <div className="w-14 h-14 bg-[#0b57d0]/20 border border-[#0b57d0]/50 rounded-2xl flex items-center justify-center overflow-hidden">
                    {bLogoUrl ? (
                      <img
                        src={bLogoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-gold-400 text-[28px]">
                        shield_person
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-[#dae2fd] font-serif leading-tight">
                    {bLoginTitle || bAppName}
                  </p>
                  <p className="text-xs font-semibold text-gold-300/90 italic">
                    "{bLoginGreeting || 'Welcome, Media Ministry Member'}"
                  </p>
                  <p className="text-[9px] font-semibold text-[#c3c6d6] uppercase tracking-widest font-mono bg-[#051424] px-2.5 py-0.5 rounded-full border border-white/10 mt-1">
                    {bLoginSubtitle}
                  </p>
                </div>
              </div>

              {/* Footer Live Preview */}
              <div className="bg-church-900/40 p-4 rounded-2xl border border-church-700/60 space-y-2 shadow-md">
                <h4 className="text-xs font-mono font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Live Footer Preview
                </h4>
                <div className="p-3 bg-[#051424] rounded-xl border border-[#46464c]/30 text-xs font-mono text-[#909096]">
                  <p className="font-serif font-bold text-[#d4e4fa]">© 2026 {bAppName} Scheduling System</p>
                  <p className="text-[10px] mt-0.5">{bParishName} • {bFooterText}</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SEARCHABLE MULTI-SELECT SERVER PICKER DIALOG */}
      {pickerActive && (
        <div className="fixed inset-0 bg-church-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-church-900 border border-church-700 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-church-700 flex items-center justify-between bg-church-900/80">
              <div>
                <h4 className="font-bold text-gold-100 text-xs uppercase tracking-widest font-mono text-gold-400">
                  Select {pickerActive.role.replace('_', ' ').toUpperCase()} Servers
                </h4>
                <p className="text-[10px] text-gold-400/50 mt-0.5 font-bold">{pickerActive.time}</p>
              </div>
              <button 
                onClick={() => {
                  setPickerActive(null);
                  setPickerSearch('');
                }}
                className="text-gold-400 hover:text-gold-200 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search servers..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-church-950 text-gold-100 text-xs rounded-xl pl-8 pr-3 py-2.5 border border-church-700/80 focus:outline-none focus:ring-1 focus:ring-gold-400 placeholder-gold-100/30"
                />
                <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-gold-400/40" />
              </div>

              {/* Server List Selection with Checkboxes */}
              <div className="max-h-60 overflow-y-auto space-y-1">
                {pickerOptions.length > 0 ? (
                  pickerOptions.map(s => {
                    const isSelected = (slotAssignments[pickerActive.time]?.[pickerActive.role] || []).includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleServer(s.id)}
                        className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-2.5 hover:bg-church-950 transition-colors cursor-pointer ${
                          isSelected ? 'bg-gold-500/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={s.picture}
                            alt={s.name}
                            referrerPolicy="no-referrer"
                            className="w-6.5 h-6.5 rounded-full object-cover border border-gold-500/20"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-gold-100">{s.name}</p>
                            <span className="text-[8px] uppercase font-mono text-gold-400/50 block font-bold">
                              Primary: {s.role.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Custom Visual Checkbox */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-gold-500 border-gold-500 text-church-950' : 'border-church-700'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-center py-4 text-[11px] text-gold-100/30">No members matched search.</p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-church-800 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Clear all selections for this cell
                    setSlotAssignments(prev => ({
                      ...prev,
                      [pickerActive.time]: {
                        ...prev[pickerActive.time],
                        [pickerActive.role]: []
                      }
                    }));
                  }}
                  className="text-[10px] text-red-400 font-bold hover:text-red-300 transition-colors cursor-pointer py-1.5 px-2"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPickerActive(null);
                    setPickerSearch('');
                  }}
                  className="text-xs bg-gold-600 hover:bg-gold-500 text-church-950 font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SPECIAL SERVE MODAL */}
      {showSpecialServeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-church-900 max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-gold-400/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-church-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-gold-100">Special Serve Entry Form</h3>
                  <p className="text-xs text-gold-200/60">Add out-of-schedule media assignments (Fiesta, Wedding, Funeral, Novena)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSpecialServeModal(false)}
                className="text-gold-200/60 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpecialServeModal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-gold-300 uppercase mb-1">
                  Special Event / Service Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parish Fiesta Mass & Procession"
                  value={specServeTitle}
                  onChange={(e) => setSpecServeTitle(e.target.value)}
                  className="w-full bg-church-950 border border-church-700/80 rounded-xl p-3 text-xs text-gold-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-gold-300 uppercase mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={specServeDate}
                    onChange={(e) => setSpecServeDate(e.target.value)}
                    className="w-full bg-church-950 border border-church-700/80 rounded-xl p-3 text-xs text-gold-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-gold-300 uppercase mb-1">
                    Mass Service Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 02:00 PM"
                    value={specServeTime}
                    onChange={(e) => setSpecServeTime(e.target.value)}
                    className="w-full bg-church-950 border border-church-700/80 rounded-xl p-3 text-xs text-gold-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Roles: PPT, Documentation, Reels */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-mono font-bold text-amber-300 uppercase">Assign Media (3 Roles):</p>
                
                {/* 1. PPT */}
                <div>
                  <label className="block text-[11px] font-bold text-[#b2c5ff] mb-1">1. PPT Assigned Media:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-church-950 rounded-xl border border-church-800">
                    {servers.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSpecServePpt(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          specServePpt.includes(s.id)
                            ? 'bg-[#0b57d0] text-white border-[#0b57d0]'
                            : 'bg-church-900 text-gold-200/50 border-church-800 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Documentation */}
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">2. Documentation Assigned Media:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-church-950 rounded-xl border border-church-800">
                    {servers.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSpecServeDoc(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          specServeDoc.includes(s.id)
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-church-900 text-gold-200/50 border-church-800 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Reels */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1">3. Reels Assigned Media:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-church-950 rounded-xl border border-church-800">
                    {servers.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSpecServeReels(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                          specServeReels.includes(s.id)
                            ? 'bg-amber-500 text-black font-bold border-amber-400'
                            : 'bg-church-900 text-gold-200/50 border-church-800 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-church-700">
                <button
                  type="button"
                  onClick={() => setShowSpecialServeModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-church-700 text-xs font-bold text-gold-200/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-lg uppercase tracking-wider"
                >
                  Publish Special Serve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Email Dispatch Notification Modal */}
      {emailModalData && (
        <ScheduleEmailModal
          dispatchResult={emailModalData}
          onClose={() => setEmailModalData(null)}
        />
      )}

    </div>
  );
}
