/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Server, ServiceReceipt } from '../types';

interface ReflectionsViewProps {
  receipts: ServiceReceipt[];
  currentUser: Server;
  onOpenReflectionModal: () => void;
}

export default function ReflectionsView({
  receipts,
  currentUser,
  onOpenReflectionModal
}: ReflectionsViewProps) {
  const [filterRole, setFilterRole] = useState<string>('all');

  const filteredReceipts = receipts.filter(r => {
    if (filterRole === 'all') return true;
    return r.role === filterRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-surface p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#c3c6d7] mb-2 font-mono text-xs uppercase tracking-widest font-bold">
            <span className="material-symbols-outlined text-lg">auto_stories</span>
            <span>Spiritual Journal & Reflections</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#d4e4fa]">
            Liturgical Service Reflections
          </h1>
          <p className="text-sm text-[#909096] max-w-2xl mt-1">
            Read inspiring spiritual reflections submitted by SocCom media team following Holy Mass & livestream broadcasts.
          </p>
        </div>

        <button
          onClick={onOpenReflectionModal}
          className="bg-[#0b57d0] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-[#0b57d0]/20 hover:brightness-110 transition-all shrink-0 text-sm cursor-pointer"
        >
          <span className="material-symbols-outlined">edit_note</span>
          <span>Post Reflection</span>
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {['all', 'ppt', 'live_server', 'documentation', 'reels_editor'].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              filterRole === role
                ? 'bg-[#3e495d] text-[#d4e4fa] shadow-md'
                : 'bg-[#122131] text-[#909096] hover:bg-[#1c2b3c] hover:text-[#d4e4fa]'
            }`}
          >
            {role === 'all' ? 'All Ministries' : role.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Reflections Feed Grid */}
      {filteredReceipts.length === 0 ? (
        <div className="glass-surface p-12 rounded-3xl border border-white/10 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#909096]">
            auto_stories
          </span>
          <h3 className="font-serif text-xl font-bold text-[#d4e4fa]">No Reflections Logged Yet</h3>
          <p className="text-sm text-[#909096] max-w-md mx-auto">
            Complete your scheduled liturgical service and submit your spiritual reflection to inspire fellow media members.
          </p>
          <button
            onClick={onOpenReflectionModal}
            className="inline-flex items-center gap-2 bg-[#10b981] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">check_circle</span>
            <span>Submit Service Reflection</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReceipts.map((r) => (
            <div
              key={r.id}
              className="glass-surface p-6 rounded-2xl border border-white/10 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0b57d0]/20 text-[#b2c5ff] border border-[#0b57d0]/40 rounded-full flex items-center justify-center font-serif font-bold text-base">
                      {r.serverName[0] || 'S'}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#d4e4fa] text-sm">{r.serverName}</h4>
                      <p className="text-[10px] text-[#909096] uppercase font-mono tracking-wider">
                        {r.role.replace('_', ' ')} • {r.date}
                      </p>
                    </div>
                  </div>

                  <span className="bg-[#10b981]/20 text-[#10b981] px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase border border-[#10b981]/30">
                    Served
                  </span>
                </div>

                <div className="bg-[#051424]/60 p-4 rounded-xl border border-white/5 space-y-2">
                  <p className="text-xs font-mono text-[#c3c6d7] font-semibold">{r.dayName} ({r.time})</p>
                  <blockquote className="font-serif italic text-sm text-[#d4e4fa] leading-relaxed">
                    "{r.reflection}"
                  </blockquote>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#909096] font-mono pt-2 border-t border-white/5">
                <span>Reflected on {new Date(r.timestamp).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-[#b2c5ff]">
                  <span className="material-symbols-outlined text-xs">favorite</span> 
                  Parish Community
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
