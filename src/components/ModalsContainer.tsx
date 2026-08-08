/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Server, ScheduleRow, SocComRole } from '../types';

interface ModalsContainerProps {
  showReflectionModal: boolean;
  onCloseReflectionModal: () => void;
  onSubmitReflection: (reflectionText: string) => void;

  showSwapModal: boolean;
  onCloseSwapModal: () => void;
  servers: Server[];
  currentUser: Server;
  onSendSwapRequest: (targetServerId: string) => void;

  showNewScheduleModal: boolean;
  onCloseNewScheduleModal: () => void;
  onAddSchedule: (row: ScheduleRow) => void;

  showSettingsModal: boolean;
  onCloseSettingsModal: () => void;
  onUpdatePassword?: (serverId: string, newPass: string) => void;

  showSupportModal: boolean;
  onCloseSupportModal: () => void;
}

export default function ModalsContainer({
  showReflectionModal,
  onCloseReflectionModal,
  onSubmitReflection,
  showSwapModal,
  onCloseSwapModal,
  servers,
  currentUser,
  onSendSwapRequest,
  showNewScheduleModal,
  onCloseNewScheduleModal,
  onAddSchedule,
  showSettingsModal,
  onCloseSettingsModal,
  onUpdatePassword,
  showSupportModal,
  onCloseSupportModal
}: ModalsContainerProps) {
  // Reflection state
  const [reflectionText, setReflectionText] = useState('');

  // Swap state
  const [selectedSwapServerId, setSelectedSwapServerId] = useState('');

  // New Schedule state
  const [dayName, setDayName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [specialService, setSpecialService] = useState('');

  // Password state
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passMessage, setPassMessage] = useState<string | null>(null);

  const availableSwapServers = servers.filter(s => s.id !== currentUser.id);

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. REFLECTION ENTRY MODAL */}
      {/* ------------------------------------------------------------- */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-surface max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">edit_note</span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#d4e4fa]">Reflection Entry</h3>
                  <p className="text-xs text-[#909096]">How did your service glorify Him today?</p>
                </div>
              </div>

              <button
                onClick={onCloseReflectionModal}
                className="text-[#909096] hover:text-[#d4e4fa] p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Share a short word or prayer about your broadcast or PPT service experience..."
                className="w-full h-36 bg-[#051424] border border-[#46464c]/40 rounded-2xl p-4 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#10b981] placeholder-[#909096] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onCloseReflectionModal}
                className="px-5 py-2.5 rounded-xl border border-[#46464c]/40 text-xs font-bold text-[#909096] hover:text-[#d4e4fa] hover:bg-white/5 transition-all cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={() => {
                  if (reflectionText.trim()) {
                    onSubmitReflection(reflectionText);
                    setReflectionText('');
                    onCloseReflectionModal();
                  }
                }}
                className="bg-[#10b981] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[#10b981]/20 hover:brightness-110 transition-all cursor-pointer"
              >
                Post Reflection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. REQUEST A SWAP MODAL */}
      {/* ------------------------------------------------------------- */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-surface max-w-md w-full p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#d4e4fa]">Request a Swap</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#909096]">Choose a media member to replace shift</span>
                  <span className="bg-[#0b57d0]/20 text-[#b2c5ff] px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold border border-[#0b57d0]/30">
                    Verification Required
                  </span>
                </div>
              </div>

              <button
                onClick={onCloseSwapModal}
                className="text-[#909096] hover:text-[#d4e4fa] p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {availableSwapServers.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSwapServerId(s.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedSwapServerId === s.id
                      ? 'bg-[#0b57d0]/20 border-[#0b57d0] text-[#d4e4fa]'
                      : 'bg-[#051424]/60 border-white/5 hover:border-white/20 text-[#909096]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={s.picture} alt={s.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-[#d4e4fa]">{s.name}</p>
                      <p className="text-[10px] text-[#909096] font-mono">
                        Available • Level {s.isAdmin ? '3' : '2'} Operator
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendSwapRequest(s.id);
                      onCloseSwapModal();
                    }}
                    className="bg-[#3e495d] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#0b57d0] transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={onCloseSwapModal}
                className="w-full bg-[#273647] text-[#d4e4fa] py-2.5 rounded-xl text-xs font-bold hover:bg-[#37475a] transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. NEW SCHEDULE ENTRY MODAL */}
      {/* ------------------------------------------------------------- */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-surface max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0b57d0]/20 text-[#b2c5ff] border border-[#0b57d0]/30 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">add_task</span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#d4e4fa]">New Schedule Entry</h3>
                  <p className="text-xs text-[#909096]">Publish a new liturgical mass time slot</p>
                </div>
              </div>

              <button
                onClick={onCloseNewScheduleModal}
                className="text-[#909096] hover:text-[#d4e4fa] p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!dayName) return;

                const newRow: ScheduleRow = {
                  id: `sched-${Date.now()}`,
                  dayName,
                  date,
                  specialService,
                  isLive: false,
                  slots: [
                    { id: `slot-${Date.now()}-1`, time: 'Sat 05:30 PM', ppt: [], live_server: [], documentation: [], reels_editor: [], isGoingLive: false },
                    { id: `slot-${Date.now()}-2`, time: 'Sun 08:00 AM', ppt: [], live_server: [], documentation: [], reels_editor: [], isGoingLive: true },
                    { id: `slot-${Date.now()}-3`, time: 'Sun 10:30 AM', ppt: [], live_server: [], documentation: [], reels_editor: [], isGoingLive: false }
                  ]
                };

                onAddSchedule(newRow);
                setDayName('');
                setSpecialService('');
                onCloseNewScheduleModal();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-mono font-bold text-[#c3c6d7] uppercase mb-1">
                  Liturgical Sunday / Feast Day Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seventeenth Sunday in Ordinary Time"
                  value={dayName}
                  onChange={(e) => setDayName(e.target.value)}
                  className="w-full bg-[#051424] border border-[#46464c]/40 rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#c3c6d7] uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#051424] border border-[#46464c]/40 rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#c3c6d7] uppercase mb-1">
                    Special Event (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fiesta Mass"
                    value={specialService}
                    onChange={(e) => setSpecialService(e.target.value)}
                    className="w-full bg-[#051424] border border-[#46464c]/40 rounded-xl p-3 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onCloseNewScheduleModal}
                  className="px-5 py-2.5 rounded-xl border border-[#46464c]/40 text-xs font-bold text-[#909096] hover:text-[#d4e4fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0b57d0] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[#0b57d0]/20 hover:brightness-110"
                >
                  Publish Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SETTINGS MODAL */}
      {/* ------------------------------------------------------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-surface max-w-md w-full p-6 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-[#d4e4fa]">Portal Settings</h3>
              <button onClick={onCloseSettingsModal} className="text-[#909096] hover:text-[#d4e4fa]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#051424] rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-[#d4e4fa]">Push Notifications</p>
                  <p className="text-[10px] text-[#909096]">Notify me 1 hour before scheduled mass service</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0b57d0]" />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#051424] rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-[#d4e4fa]">Automatic Roster Sync</p>
                  <p className="text-[10px] text-[#909096]">Keep offline shifts cached in local memory</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0b57d0]" />
              </div>

              {/* CHANGE PASSWORD SECTION */}
              <div className="p-3.5 bg-[#051424] rounded-xl border border-gold-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <p className="font-bold text-gold-200 font-mono flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-gold-400">lock_reset</span>
                    Account Password
                  </p>
                  <span className="text-[10px] text-gold-400 font-mono">User: {currentUser.name}</span>
                </div>

                {passMessage && (
                  <p className={`text-[11px] p-2 rounded-lg font-mono ${passMessage.includes('successfully') ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300 border border-red-500/40'}`}>
                    {passMessage}
                  </p>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-gold-300 uppercase font-mono mb-1 font-semibold">1. Enter Old / Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      className="w-full bg-[#030a14] border border-[#46464c]/60 rounded-lg p-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gold-300 uppercase font-mono mb-1 font-semibold">2. Enter New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password (min 3 chars)"
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      className="w-full bg-[#030a14] border border-[#46464c]/60 rounded-lg p-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gold-300 uppercase font-mono mb-1 font-semibold">3. Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassInput}
                      onChange={(e) => setConfirmPassInput(e.target.value)}
                      className="w-full bg-[#030a14] border border-[#46464c]/60 rounded-lg p-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0] font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const actualCurrentPass = (currentUser.password || currentUser.accessToken || 'media123').trim();
                      
                      if (!currentPassInput || currentPassInput.trim() !== actualCurrentPass) {
                        setPassMessage('❌ Incorrect current password. Please enter your old password correctly.');
                        return;
                      }

                      if (!newPassInput || newPassInput.trim().length < 3) {
                        setPassMessage('❌ New password must be at least 3 characters long.');
                        return;
                      }

                      if (newPassInput.trim() !== confirmPassInput.trim()) {
                        setPassMessage('❌ New password and confirmation do not match.');
                        return;
                      }

                      if (newPassInput.trim() === actualCurrentPass) {
                        setPassMessage('⚠️ New password must be different from your current password.');
                        return;
                      }

                      if (onUpdatePassword) {
                        onUpdatePassword(currentUser.id, newPassInput.trim());
                        setPassMessage('✅ Password updated successfully! Your default password has been removed and your account is secured.');
                        setCurrentPassInput('');
                        setNewPassInput('');
                        setConfirmPassInput('');
                      }
                    }}
                    className="w-full bg-gold-600 hover:bg-gold-500 text-church-950 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Update Password & Save
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onCloseSettingsModal}
              className="w-full bg-[#0b57d0] text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer"
            >
              Save & Close
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. SUPPORT MODAL */}
      {/* ------------------------------------------------------------- */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-surface max-w-md w-full p-6 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-[#d4e4fa]">Ministry Help & Support</h3>
              <button onClick={onCloseSupportModal} className="text-[#909096] hover:text-[#d4e4fa]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#909096]">
              <p className="text-[#d4e4fa] font-bold">Auxiladora Social Communication Ministry</p>
              <p>For urgent shift swaps or technical assistance with presentation software & audio consoles, contact the Ministry Head directly.</p>
              
              <div className="p-3 bg-[#051424] rounded-xl border border-white/5 space-y-1 font-mono text-[11px]">
                <p><strong className="text-[#b2c5ff]">Email:</strong> support@auxiladora.org</p>
                <p><strong className="text-[#b2c5ff]">Sacristy Extension:</strong> Local 104</p>
              </div>
            </div>

            <button
              onClick={onCloseSupportModal}
              className="w-full bg-[#273647] text-[#d4e4fa] py-2.5 rounded-xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
