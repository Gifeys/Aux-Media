/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ServerNote, Server } from '../types';
import { StickyNote, Plus, Lock, Globe, Trash2, Edit, Search, Filter, ShieldAlert, Check, X, Calendar, User, Sparkles } from 'lucide-react';

interface NotesViewProps {
  notes: ServerNote[];
  currentUser: Server;
  onAddNote: (note: ServerNote) => void;
  onUpdateNote: (note: ServerNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function NotesView({
  notes,
  currentUser,
  onAddNote,
  onUpdateNote,
  onDeleteNote
}: NotesViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private' | 'my_notes'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<ServerNote | null>(null);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<ServerNote | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState<'reminder' | 'duty' | 'general' | 'quick'>('reminder');

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setIsPublic(true);
    setCategory('reminder');
    setShowModal(true);
  };

  const handleOpenEditModal = (note: ServerNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsPublic(note.isPublic);
    setCategory(note.category || 'reminder');
    setShowModal(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingNote) {
      const updated: ServerNote = {
        ...editingNote,
        title: title.trim(),
        content: content.trim(),
        isPublic,
        category,
        updatedAt: new Date().toISOString()
      };
      onUpdateNote(updated);
    } else {
      const newNote: ServerNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        content: content.trim(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorPicture: currentUser.picture,
        isPublic,
        category,
        createdAt: new Date().toISOString()
      };
      onAddNote(newNote);
    }

    setShowModal(false);
  };

  // Filter Notes logically:
  // - Public notes are visible to everyone
  // - Private notes are only visible to their author (currentUser.id) or Admin
  const visibleNotes = useMemo(() => {
    return notes.filter((n) => {
      // Security check: Private notes are strictly visible to author or Admin/Sub-Admin
      const isOwner = n.authorId === currentUser.id;
      const isAdminUser = currentUser.isAdmin || currentUser.isSubAdmin;
      if (!n.isPublic && !isOwner && !isAdminUser) {
        return false;
      }

      // Filter by tab:
      if (activeFilter === 'public' && !n.isPublic) return false;
      if (activeFilter === 'private' && n.isPublic) return false;
      if (activeFilter === 'my_notes' && n.authorId !== currentUser.id) return false;

      // Filter by category:
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;

      // Search query:
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesAuthor = n.authorName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesAuthor) return false;
      }

      return true;
    });
  }, [notes, currentUser, activeFilter, categoryFilter, searchQuery]);

  // Counts for tab badges
  const publicCount = useMemo(() => notes.filter(n => n.isPublic).length, [notes]);
  const privateCount = useMemo(() => notes.filter(n => !n.isPublic && (n.authorId === currentUser.id || currentUser.isAdmin || currentUser.isSubAdmin)).length, [notes, currentUser]);
  const myNotesCount = useMemo(() => notes.filter(n => n.authorId === currentUser.id).length, [notes, currentUser]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0d1c2d] via-[#122131] to-[#1c2b3c] p-6 rounded-2xl border border-[#46464c]/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider font-bold">
            <StickyNote className="w-4 h-4" />
            <span>Media Ministry Scratchpad & Reminders</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#d4e4fa]">
            Server Notes & Reminders
          </h1>
          <p className="text-xs text-[#909096] max-w-2xl leading-relaxed">
            Create quick liturgy notes, broadcast reminders, camera presets, or personal scratchpad items. 
            Choose whether to share your note with the whole team or keep it private to yourself.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-church-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Note</span>
        </button>
      </div>

      {/* Navigation Tabs, Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0d1c2d]/80 p-3 rounded-2xl border border-[#46464c]/30">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-[#3e495d] text-[#d4e4fa] shadow-sm'
                : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-white/5'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>All Visible Notes</span>
          </button>

          <button
            onClick={() => setActiveFilter('public')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'public'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-[#909096] hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Team Shared</span>
            <span className="bg-amber-500/30 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">{publicCount}</span>
          </button>

          <button
            onClick={() => setActiveFilter('private')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'private'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-[#909096] hover:text-purple-300 hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>🔒 Private to Me</span>
            <span className="bg-purple-500/30 text-purple-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">{privateCount}</span>
          </button>

          <button
            onClick={() => setActiveFilter('my_notes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'my_notes'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-[#909096] hover:text-emerald-300 hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Created Notes</span>
            <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">{myNotesCount}</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#122131] border border-[#46464c]/40 rounded-xl px-3 py-1.5 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 font-mono"
          >
            <option value="all">🏷️ All Categories</option>
            <option value="reminder">⛪ Reminder</option>
            <option value="duty">📹 Duty Note</option>
            <option value="general">📝 General</option>
            <option value="quick">⚡ Quick Scratchpad</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#909096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-[#122131] border border-[#46464c]/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#d4e4fa] focus:outline-none focus:border-amber-400 placeholder-[#909096] w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Notes Grid Display */}
      {visibleNotes.length === 0 ? (
        <div className="bg-[#0d1c2d]/40 rounded-2xl border border-[#46464c]/20 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <StickyNote className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">No Notes Found</h3>
          <p className="text-xs text-[#909096] max-w-sm mx-auto">
            {searchQuery
              ? `No notes match your search query "${searchQuery}".`
              : activeFilter === 'private'
              ? 'You have no private notes saved yet. Click "+ Create New Note" to create one.'
              : 'No notes available under this filter. Be the first to add a note!'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create a Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleNotes.map((note) => {
            const isOwner = note.authorId === currentUser.id || (note.authorName && note.authorName.toLowerCase().trim() === currentUser.name?.toLowerCase().trim());
            const canDelete = isOwner || currentUser.isAdmin || currentUser.isSubAdmin;
            const canEdit = isOwner; // Only the publisher/author who created the note can edit it

            let catLabel = '📝 General';
            let catColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            if (note.category === 'reminder') {
              catLabel = '⛪ Reminder';
              catColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            } else if (note.category === 'duty') {
              catLabel = '📹 Duty Note';
              catColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            } else if (note.category === 'quick') {
              catLabel = '⚡ Scratchpad';
              catColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            }

            return (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 group hover:shadow-xl ${
                  note.isPublic
                    ? 'bg-[#122131] border-[#46464c]/40 hover:border-amber-500/40'
                    : 'bg-[#181326] border-purple-500/30 hover:border-purple-400/50'
                }`}
              >
                {/* Note Header */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${catColor}`}>
                        {catLabel}
                      </span>
                      {note.isPublic ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Shared
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>

                    {/* Action buttons (Edit only by publisher/owner; Delete by owner or admin) */}
                    <div className="flex items-center gap-1 opacity-95">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditModal(note)}
                          className="p-1.5 text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Edit note (Publisher)"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDeleteNote(note)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#d4e4fa] leading-snug group-hover:text-amber-200 transition-colors">
                    {note.title}
                  </h3>

                  <p className="text-xs text-[#c3c6d7] leading-relaxed whitespace-pre-wrap font-sans">
                    {note.content}
                  </p>
                </div>

                {/* Footer: Author Info & Timestamp */}
                <div className="pt-3 border-t border-[#46464c]/30 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <img
                      src={note.authorPicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                      alt={note.authorName}
                      className="w-5 h-5 rounded-full object-cover border border-[#46464c]/50"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[#909096] font-medium truncate max-w-[120px]">
                      {note.authorName} {isOwner ? '(You)' : ''}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#909096]">
                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT NOTE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c1a29] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">
                  {editingNote ? '✏️ Edit Server Note' : '📝 Create New Server Note'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#909096] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[#909096] block font-bold">Note Title / Headline:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Live Stream Audio Line 2 Checklist..."
                  className="w-full bg-[#102235] text-[#d4e4fa] font-bold px-3.5 py-2 rounded-xl border border-white/10 focus:border-amber-400 outline-none text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#909096] block font-bold">Category Tag:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#102235] text-[#d4e4fa] px-3 py-2 rounded-xl border border-white/10 focus:border-amber-400 outline-none text-xs font-mono"
                  >
                    <option value="reminder">⛪ Reminder</option>
                    <option value="duty">📹 Duty Note</option>
                    <option value="general">📝 General</option>
                    <option value="quick">⚡ Quick Scratchpad</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#909096] block font-bold">Visibility Scope:</label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all text-[11px] flex items-center justify-center gap-1 cursor-pointer border ${
                        isPublic
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-[#102235] text-[#909096] border-white/10 hover:text-[#d4e4fa]'
                      }`}
                    >
                      <Globe className="w-3 h-3" /> Shared / Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all text-[11px] flex items-center justify-center gap-1 cursor-pointer border ${
                        !isPublic
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                          : 'bg-[#102235] text-[#909096] border-white/10 hover:text-[#d4e4fa]'
                      }`}
                    >
                      <Lock className="w-3 h-3" /> 🔒 Private
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#909096] block font-bold">Note Details / Content:</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note, liturgy instructions, or personal reminders here..."
                  className="w-full bg-[#102235] text-[#c3c6d7] px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-amber-400 outline-none text-xs leading-relaxed font-sans"
                />
              </div>

              <div className="bg-[#051424] p-3 rounded-xl border border-white/10 text-[11px] font-sans text-[#909096] space-y-1">
                <p className="font-bold text-[#d4e4fa] flex items-center gap-1 font-mono">
                  {isPublic ? <Globe className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-purple-400" />}
                  {isPublic ? 'Team Shared Note' : 'Private Note (Only Visible to You)'}
                </p>
                <p>
                  {isPublic
                    ? 'All Auxiliadora Media servers will be able to see this note under the Team Shared tab.'
                    : 'Only you can view or manage this private note. Perfect for personal liturgy notes or scratchpads.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#273647] hover:bg-[#32455a] text-xs font-bold rounded-xl text-[#d4e4fa] transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-church-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all font-mono"
                >
                  <Check className="w-4 h-4" />
                  {editingNote ? 'Save Note Changes' : 'Publish Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DELETE NOTE CONFIRMATION MODAL */}
      {confirmDeleteNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c1a29] border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">
                Delete Server Note?
              </h3>
              <p className="text-xs text-[#c3c6d7] font-sans">
                Are you sure you want to delete <span className="text-amber-300 font-bold">"{confirmDeleteNote.title}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteNote(null)}
                className="px-4 py-2 bg-[#273647] hover:bg-[#32455a] text-xs font-bold rounded-xl text-[#d4e4fa] transition-all cursor-pointer font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(confirmDeleteNote.id);
                  setConfirmDeleteNote(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all font-mono"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
