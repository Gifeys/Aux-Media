/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SocComOfTheMonth, Announcement, Server } from '../types';
import { Sparkles, Cake, BookOpen, AlertCircle, Plus, Trash2, Edit3, X, Check, UserCheck, Upload, Image } from 'lucide-react';
import { compressImage } from '../lib/imageUtils';

interface CommunityHubProps {
  soccomOfMonth: SocComOfTheMonth;
  announcements: Announcement[];
  currentUser: Server;
  servers?: Server[];
  onAddAnnouncement: (ann: Announcement) => void;
  onUpdateAnnouncement?: (ann: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onUpdateSoccomOfMonth?: (updated: SocComOfTheMonth) => void;
}

const AnnDeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
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
          setConfirming(false);
        }}
        className="absolute top-3 right-3 text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded transition-colors cursor-pointer animate-pulse z-10"
        title="Click to confirm delete"
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
      className="absolute top-4 right-4 text-gold-400/30 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
      title="Remove Post"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
};

const ImageFileUploadField = ({
  label,
  value,
  onChange,
  placeholder = "Upload image file or paste URL..."
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.75);
        onChange(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image file.');
      }
    }
  };

  return (
    <div className="space-y-1.5 bg-church-900/60 p-3 rounded-2xl border border-church-750">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gold-200 font-mono flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-gold-400" />
          {label}
        </label>
        {value && (
          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
            <Check className="w-3 h-3" /> Image Loaded
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Preview Thumbnail */}
        {value ? (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gold-500/40 bg-church-950 shrink-0 shadow-md group">
            <img src={value} alt="Uploaded preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-600 text-white rounded-full p-1 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl border border-dashed border-church-700 bg-church-950/60 flex items-center justify-center text-gold-400/40 shrink-0">
            <Upload className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 space-y-1.5">
          {/* File Upload Button */}
          <label className="cursor-pointer bg-gold-500/10 hover:bg-gold-500/20 text-gold-200 border border-gold-500/30 px-3 py-1.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all w-full">
            <Upload className="w-3.5 h-3.5 text-gold-400" />
            <span>{value ? 'Replace Image File' : 'Insert Image File from Device'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Fallback URL string input */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-church-950 text-gold-100 text-[10px] rounded-lg p-1.5 border border-church-750 focus:outline-none focus:border-gold-400 font-mono placeholder:text-church-600"
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
};

export default function CommunityHub({
  soccomOfMonth,
  announcements,
  currentUser,
  servers = [],
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onUpdateSoccomOfMonth
}: CommunityHubProps) {
  // Local form state for new announcements
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'birthday' | 'reminder' | 'bible_verse' | 'daily_word'>('reminder');
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressingNew, setIsCompressingNew] = useState(false);

  // State for editing an existing announcement
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');
  const [editAnnType, setEditAnnType] = useState<'birthday' | 'reminder' | 'bible_verse' | 'daily_word'>('reminder');
  const [editAnnDate, setEditAnnDate] = useState('');
  const [editAnnImageUrl, setEditAnnImageUrl] = useState('');
  const [isCompressingEdit, setIsCompressingEdit] = useState(false);

  const openEditAnnModal = (ann: Announcement) => {
    setEditingAnn(ann);
    setEditAnnTitle(ann.title);
    setEditAnnContent(ann.content);
    setEditAnnType(ann.type);
    setEditAnnDate(ann.date);
    setEditAnnImageUrl(ann.imageUrl || '');
  };

  const handleNewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingNew(true);
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        setImageUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image file. Please try another image.');
      } finally {
        setIsCompressingNew(false);
      }
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingEdit(true);
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        setEditAnnImageUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        alert('Failed to process image file. Please try another image.');
      } finally {
        setIsCompressingEdit(false);
      }
    }
  };

  const handleSaveEditAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn || !editAnnTitle || !editAnnContent) return;

    if (onUpdateAnnouncement) {
      onUpdateAnnouncement({
        ...editingAnn,
        title: editAnnTitle,
        content: editAnnContent,
        type: editAnnType,
        date: editAnnDate || editingAnn.date,
        imageUrl: editAnnImageUrl || undefined
      });
    }
    setEditingAnn(null);
  };

  // Local state for editing SocCom of the Month
  const [showEditSocComModal, setShowEditSocComModal] = useState(false);
  const [editName, setEditName] = useState(soccomOfMonth.name);
  const [editRole, setEditRole] = useState(soccomOfMonth.role);
  const [editAvatar, setEditAvatar] = useState(soccomOfMonth.avatar);
  const [editDescription, setEditDescription] = useState(soccomOfMonth.description);
  const [editWork1, setEditWork1] = useState(soccomOfMonth.workImages[0] || '');
  const [editWork2, setEditWork2] = useState(soccomOfMonth.workImages[1] || '');
  const [editWork3, setEditWork3] = useState(soccomOfMonth.workImages[2] || '');

  const openEditModal = () => {
    setEditName(soccomOfMonth.name);
    setEditRole(soccomOfMonth.role);
    setEditAvatar(soccomOfMonth.avatar);
    setEditDescription(soccomOfMonth.description);
    setEditWork1(soccomOfMonth.workImages[0] || '');
    setEditWork2(soccomOfMonth.workImages[1] || '');
    setEditWork3(soccomOfMonth.workImages[2] || '');
    setShowEditSocComModal(true);
  };

  const handleSelectServerQuickFill = (serverId: string) => {
    const selected = servers.find(s => s.id === serverId);
    if (selected) {
      setEditName(selected.name);
      setEditRole(`${selected.role.replace('_', ' ').toUpperCase()} Lead`);
      setEditAvatar(selected.picture);
    }
  };

  const handleSaveSocComOfMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSoccomOfMonth) return;

    onUpdateSoccomOfMonth({
      id: soccomOfMonth.id || `soccom-${Date.now()}`,
      name: editName,
      role: editRole,
      avatar: editAvatar,
      description: editDescription,
      workImages: [
        editWork1 || 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80',
        editWork2 || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
        editWork3 || 'https://images.unsplash.com/photo-1460518451285-cd3ab4204667?auto=format&fit=crop&w=400&q=80'
      ]
    });

    setShowEditSocComModal(false);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    onAddAnnouncement({
      id: `ann-${Date.now()}`,
      title,
      content,
      type,
      date: new Date().toISOString().split('T')[0],
      imageUrl: imageUrl || undefined
    });

    setTitle('');
    setContent('');
    setImageUrl('');
    setType('reminder');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 🌟 SocCom of the Month Premium Spotlight Banner */}
      <section className="bg-gradient-to-r from-church-950 via-church-900 to-church-950 border border-gold-500/20 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-400/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gold-500/10 p-2.5 rounded-xl border border-gold-500/30">
              <Sparkles className="w-5 h-5 text-gold-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-400 block">Auxiliadora Honours Roll</span>
              <h2 className="text-xl font-bold text-gold-100 font-serif">Social Communication Servant of the Month</h2>
            </div>
          </div>

          {(currentUser.isAdmin || currentUser.isSubAdmin) && (
            <button
              onClick={openEditModal}
              className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-200 border border-gold-500/40 font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer text-xs shrink-0 shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5 text-gold-400" />
              <span>Edit Servant of the Month</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main profile spotlight */}
          <div className="lg:col-span-4 flex flex-col items-center text-center p-6 bg-church-950/60 rounded-2xl border border-church-700/60 shadow-lg">
            <img
              src={soccomOfMonth.avatar}
              alt={soccomOfMonth.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover border-4 border-gold-500/25 shadow-2xl mb-4"
            />
            <h3 className="text-lg font-black text-gold-100 font-serif">{soccomOfMonth.name}</h3>
            <span className="text-[10px] px-3.5 py-1 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/25 mt-1.5 font-mono uppercase tracking-wider">
              {soccomOfMonth.role}
            </span>
            <p className="text-xs text-gold-200/80 leading-relaxed mt-4 font-sans font-medium">
              {soccomOfMonth.description}
            </p>
          </div>

          {/* 3 Work showcase images */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 font-mono flex items-center gap-2">
              <span>❖</span> Portfolio & Production Spotlight
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {soccomOfMonth.workImages.map((img, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-xl border border-church-700/50 bg-church-950">
                  <img
                    src={img}
                    alt={`Work ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-church-950/90 via-church-950/20 to-transparent flex items-end p-3.5 opacity-95">
                    <span className="text-[10px] font-mono text-gold-200 font-semibold tracking-wide uppercase">
                      {idx === 0 ? 'Live Production' : idx === 1 ? 'Booth Photography' : 'Media Layout'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Grid: Announcements & Admin Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Notice Board */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-church-900/40 border border-church-700/60 rounded-2xl overflow-hidden p-5 space-y-5 shadow-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-church-700/60">
              <h3 className="font-bold text-gold-100 font-serif text-base">Parish Media Notice Board</h3>
              
              {Boolean(currentUser) && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs bg-gold-600 hover:bg-gold-500 text-church-950 font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Publish Announcement
                </button>
              )}
            </div>

            {/* Optional post announcement form */}
            {showAddForm && (
              <form onSubmit={handleAddAnnouncement} className="p-4 rounded-xl bg-church-950 border border-church-700/80 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-gold-300">Topic Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Slide Ratio Checklist"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-church-900 text-gold-100 text-xs rounded-lg p-2.5 border border-church-700/60 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-gold-300">Bulletin Category</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="bg-church-900 text-gold-100 text-xs rounded-lg p-2.5 border border-church-700/60 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    >
                      <option value="reminder" className="bg-church-900 text-gold-100">Technical Reminder</option>
                      <option value="birthday" className="bg-church-900 text-gold-100">🎂 Birthday Post</option>
                      <option value="daily_word" className="bg-church-900 text-gold-100">📖 Daily Word</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gold-300">Bulletin Message</label>
                  <textarea
                    required
                    placeholder="Type bulletin message content..."
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-church-900 text-gold-100 text-xs rounded-lg p-2.5 border border-church-700/60 focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none font-sans"
                  />
                </div>

                {/* Optional Photo Attachment */}
                <div className="p-3 bg-church-900/60 border border-church-700/50 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-gold-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5 text-gold-400" /> Attach Banner / Photo (Compressed)</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">Auto-compressed</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewImageUpload}
                    className="w-full text-xs text-gold-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-gold-500/20 file:text-gold-300 hover:file:bg-gold-500/30 cursor-pointer"
                  />
                  {isCompressingNew && (
                    <p className="text-[10px] text-gold-400 animate-pulse font-mono">Compressing image file for fast upload...</p>
                  )}
                  {imageUrl && (
                    <div className="relative rounded-lg overflow-hidden border border-gold-500/30 max-h-32 mt-2 bg-black/40 flex items-center justify-center p-1">
                      <img src={imageUrl} alt="Attachment Preview" className="max-h-28 object-contain rounded" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 bg-red-950/80 hover:bg-red-900 text-red-200 text-[10px] px-2 py-0.5 rounded font-mono"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-gold-300 hover:text-white px-3.5 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCompressingNew}
                    className="bg-gold-600 hover:bg-gold-500 text-church-950 font-bold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Publish Post
                  </button>
                </div>
              </form>
            )}

            {/* List of announcements */}
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-church-950/80 rounded-xl border border-church-750 flex flex-col sm:flex-row items-start gap-3.5 relative hover:border-gold-500/20 transition-colors shadow-sm">
                  
                  {/* Category icon */}
                  <div className={`p-2.5 rounded-xl shrink-0 border ${
                    ann.type === 'birthday' 
                      ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' 
                      : ann.type === 'bible_verse' || ann.type === 'daily_word'
                      ? 'bg-gold-500/10 text-gold-400 border-gold-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {ann.type === 'birthday' ? (
                      <Cake className="w-5 h-5" />
                    ) : ann.type === 'bible_verse' || ann.type === 'daily_word' ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-2 overflow-hidden pr-6 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-xs text-gold-100 font-serif">{ann.title}</h4>
                      <span className="text-[9px] text-gold-400/40 font-mono font-bold">{ann.date}</span>
                    </div>
                    <p className="text-xs text-gold-200/80 leading-relaxed font-sans font-medium">
                      {ann.content}
                    </p>
                    {ann.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gold-500/30 max-h-48 bg-black/40">
                        <img src={ann.imageUrl} alt={ann.title} className="w-full max-h-48 object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Member Edit & Delete buttons */}
                  {Boolean(currentUser) && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => openEditAnnModal(ann)}
                        className="p-1 bg-church-900 hover:bg-gold-500/20 text-gold-300 border border-church-750 hover:border-gold-500/50 rounded-lg transition-all cursor-pointer"
                        title="Edit announcement text"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <AnnDeleteButton onDelete={() => onDeleteAnnouncement(ann.id)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Quick info reminders card */}
        <div className="lg:col-span-4 bg-church-900/60 p-5 rounded-2xl border border-church-700/60 space-y-4 shadow-md">
          <h4 className="font-bold text-gold-100 text-xs uppercase tracking-widest font-mono">Stream Checklist</h4>
          <p className="text-xs text-gold-200/60 leading-relaxed font-medium">
            Keep our stream standards premium across all weekend masses:
          </p>
          <ul className="space-y-2.5 text-xs font-sans">
            <li className="flex items-center gap-2.5 text-gold-100 bg-church-950 p-3 rounded-xl border border-church-700/40 font-medium">
              <span className="text-gold-400 font-bold font-mono">1.</span> Video: 1080p at 30 FPS constant
            </li>
            <li className="flex items-center gap-2.5 text-gold-100 bg-church-950 p-3 rounded-xl border border-church-700/40 font-medium">
              <span className="text-gold-400 font-bold font-mono">2.</span> Bitrate: 4500 Kbps constant (CBR)
            </li>
            <li className="flex items-center gap-2.5 text-gold-100 bg-church-950 p-3 rounded-xl border border-church-700/40 font-medium">
              <span className="text-gold-400 font-bold font-mono">3.</span> Audio: AAC 128 Kbps stereo output
            </li>
            <li className="flex items-center gap-2.5 text-gold-100 bg-church-950 p-3 rounded-xl border border-church-700/40 font-medium">
              <span className="text-gold-400 font-bold font-mono">4.</span> Latency: Low latency stream mode active
            </li>
          </ul>
        </div>

      </div>

      {/* ✏️ Edit Servant of the Month Modal */}
      {showEditSocComModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-church-950 border border-gold-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in">
            <button
              onClick={() => setShowEditSocComModal(false)}
              className="absolute top-5 right-5 text-gold-400/60 hover:text-white p-1.5 rounded-lg hover:bg-church-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-church-700/60 pb-4">
              <div className="p-2.5 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gold-100 font-serif">Edit SocCom Servant of the Month</h3>
                <p className="text-xs text-gold-200/60 font-mono">Recognize an outstanding media servant with custom citations & photos</p>
              </div>
            </div>

            <form onSubmit={handleSaveSocComOfMonth} className="space-y-4">
              
              {/* Quick Fill From Active Directory */}
              {servers.length > 0 && (
                <div className="bg-church-900/60 p-3 rounded-2xl border border-church-750 space-y-1.5">
                  <label className="text-[11px] font-bold text-gold-300 font-mono flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-gold-400" />
                    Quick Fill from Media Directory
                  </label>
                  <select
                    onChange={(e) => handleSelectServerQuickFill(e.target.value)}
                    className="w-full bg-church-950 text-gold-100 text-xs rounded-xl p-2.5 border border-church-700 focus:outline-none focus:border-gold-400"
                  >
                    <option value="">-- Choose a member to auto-fill --</option>
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role.replace('_', ' ').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gold-200 font-mono">Servant Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-church-900 text-gold-100 text-xs rounded-xl p-2.5 border border-church-750 focus:outline-none focus:border-gold-400 font-sans"
                    placeholder="e.g. Maria Clara"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gold-200 font-mono">Role / Title</label>
                  <input
                    type="text"
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-church-900 text-gold-100 text-xs rounded-xl p-2.5 border border-church-750 focus:outline-none focus:border-gold-400 font-sans"
                    placeholder="e.g. Lead Live Broadcast Operator"
                  />
                </div>
              </div>

              {/* Avatar / Profile Picture File Upload */}
              <ImageFileUploadField
                label="Official Profile Picture / Avatar"
                value={editAvatar}
                onChange={(val) => setEditAvatar(val)}
                placeholder="Upload file from device or paste image URL..."
              />

              <div className="space-y-1">
                <label className="text-xs font-bold text-gold-200 font-mono">Recognition Citation / Description</label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-church-900 text-gold-100 text-xs rounded-xl p-2.5 border border-church-750 focus:outline-none focus:border-gold-400 font-sans leading-relaxed resize-none"
                  placeholder="Recognized for exceptional dedication in managing..."
                />
              </div>

              {/* 3 Portfolio / Ministry Work Image Uploads */}
              <div className="space-y-3 pt-2 border-t border-church-750">
                <h4 className="text-xs font-bold text-gold-300 font-mono uppercase tracking-wider">3 Portfolio / Ministry Work Images</h4>
                
                <div className="space-y-3">
                  <ImageFileUploadField
                    label="Ministry Work #1 (Top Row)"
                    value={editWork1}
                    onChange={(val) => setEditWork1(val)}
                    placeholder="Upload image file or paste URL for Work #1..."
                  />
                  <ImageFileUploadField
                    label="Ministry Work #2 (Middle Row / Live Action)"
                    value={editWork2}
                    onChange={(val) => setEditWork2(val)}
                    placeholder="Upload image file or paste URL for Work #2..."
                  />
                  <ImageFileUploadField
                    label="Ministry Work #3 (Bottom Row / Media Production)"
                    value={editWork3}
                    onChange={(val) => setEditWork3(val)}
                    placeholder="Upload image file or paste URL for Work #3..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-church-750">
                <button
                  type="button"
                  onClick={() => setShowEditSocComModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gold-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-gold-500 hover:bg-gold-400 text-church-950 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Servant of the Month
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ✏️ Edit Bulletin Announcement Modal */}
      {editingAnn && (
        <div className="fixed inset-0 bg-church-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-church-900 border border-gold-500/30 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEditingAnn(null)}
              className="absolute top-4 right-4 text-gold-400/60 hover:text-gold-200 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-church-750">
              <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gold-100 font-serif">Edit Announcement Text</h3>
                <p className="text-xs text-gold-300/70">Modify headline, date, type, and announcement body.</p>
              </div>
            </div>

            <form onSubmit={handleSaveEditAnnouncement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gold-300">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={editAnnTitle}
                  onChange={(e) => setEditAnnTitle(e.target.value)}
                  placeholder="Enter headline..."
                  className="w-full bg-church-950 border border-church-700 rounded-xl p-3 text-xs text-gold-100 focus:outline-none focus:border-gold-400 font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gold-300">Category / Type</label>
                  <select
                    value={editAnnType}
                    onChange={(e) => setEditAnnType(e.target.value as any)}
                    className="w-full bg-church-950 border border-church-700 rounded-xl p-3 text-xs text-gold-100 focus:outline-none focus:border-gold-400 font-mono"
                  >
                    <option value="reminder">📢 Reminder / Notice</option>
                    <option value="birthday">🎂 Birthday Greeting</option>
                    <option value="daily_word">📖 Daily Word</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gold-300">Date Text</label>
                  <input
                    type="text"
                    value={editAnnDate}
                    onChange={(e) => setEditAnnDate(e.target.value)}
                    placeholder="e.g. 2026-07-23"
                    className="w-full bg-church-950 border border-church-700 rounded-xl p-3 text-xs text-gold-100 focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gold-300">Announcement Content Body</label>
                <textarea
                  rows={4}
                  required
                  value={editAnnContent}
                  onChange={(e) => setEditAnnContent(e.target.value)}
                  placeholder="Type announcement description here..."
                  className="w-full bg-church-950 border border-church-700 rounded-xl p-3 text-xs text-gold-100 focus:outline-none focus:border-gold-400 font-sans leading-relaxed"
                />
              </div>

              {/* Photo Attachment for Edit */}
              <div className="p-3 bg-church-950/80 border border-church-700/60 rounded-xl space-y-2">
                <label className="text-xs font-bold text-gold-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5 text-gold-400" /> Update Banner / Photo</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-normal">Auto-compressed</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="w-full text-xs text-gold-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-gold-500/20 file:text-gold-300 hover:file:bg-gold-500/30 cursor-pointer"
                />
                {isCompressingEdit && (
                  <p className="text-[10px] text-gold-400 animate-pulse font-mono">Compressing image file...</p>
                )}
                {editAnnImageUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-gold-500/30 max-h-32 mt-2 bg-black/40 flex items-center justify-center p-1">
                    <img src={editAnnImageUrl} alt="Attachment Preview" className="max-h-28 object-contain rounded" />
                    <button
                      type="button"
                      onClick={() => setEditAnnImageUrl('')}
                      className="absolute top-1 right-1 bg-red-950/80 hover:bg-red-900 text-red-200 text-[10px] px-2 py-0.5 rounded font-mono cursor-pointer"
                    >
                      ✕ Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-church-750">
                <button
                  type="button"
                  onClick={() => setEditingAnn(null)}
                  className="px-4 py-2 text-xs font-semibold text-gold-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressingEdit}
                  className="px-5 py-2 text-xs font-bold bg-gold-500 hover:bg-gold-400 text-church-950 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
