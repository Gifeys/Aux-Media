/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Server } from '../types';
import { formatBirthdayForDisplay } from '../lib/birthdayUtils';
import { Sparkles, Heart, Church, PartyPopper, Check, X, Send, Mail } from 'lucide-react';

interface BirthdayGreetingModalProps {
  celebrant: Server;
  isOpen: boolean;
  onClose: () => void;
  onSendBirthdayEmail?: () => Promise<void>;
  isAdmin?: boolean;
}

export default function BirthdayGreetingModal({
  celebrant,
  isOpen,
  onClose,
  onSendBirthdayEmail,
  isAdmin = false
}: BirthdayGreetingModalProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmailSent(false);
      setSendingEmail(false);
    }
  }, [isOpen]);

  if (!isOpen || !celebrant) return null;

  const roleName = celebrant.role ? celebrant.role.replace('_', ' ').toUpperCase() : 'SOCCOM MEDIA SERVER';
  const displayBday = formatBirthdayForDisplay(celebrant.birthday);
  const firstName = celebrant.name ? celebrant.name.split(' ')[0] : 'Media Servant';

  const handleSendEmail = async () => {
    if (!onSendBirthdayEmail) return;
    setSendingEmail(true);
    try {
      await onSendBirthdayEmail();
      setEmailSent(true);
    } catch (e) {
      console.error('Failed to send email:', e);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden bg-gradient-to-b from-[#0f233a] via-[#0b1928] to-[#050f1a] border-2 border-amber-400/80 rounded-3xl shadow-2xl shadow-amber-500/20 text-white p-6 sm:p-8 text-center">
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Close Celebration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Confetti Badges */}
        <div className="flex justify-center items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
            <PartyPopper className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            Birthday Celebrant Today!
          </span>
        </div>

        {/* Avatar with Halo Effect */}
        <div className="relative mx-auto my-3 w-28 h-28">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 opacity-75 blur-md animate-pulse"></div>
          {celebrant.picture ? (
            <img
              src={celebrant.picture}
              alt={celebrant.name}
              className="relative w-28 h-28 rounded-full object-cover border-3 border-amber-300 shadow-xl"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="relative w-28 h-28 rounded-full bg-[#1b3452] flex items-center justify-center border-3 border-amber-300 text-3xl font-bold text-amber-300 font-serif">
              {celebrant.name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* Title & Name */}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-200 mt-2">
          🎂 Happy Birthday, {celebrant.name}! 🎉
        </h2>
        <p className="text-xs text-amber-300/80 font-mono uppercase tracking-widest mt-1">
          {roleName} • {displayBday}
        </p>

        {/* Scripture Blessing */}
        <div className="my-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm italic font-serif leading-relaxed">
          &ldquo;The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.&rdquo;
          <div className="mt-1 text-[11px] font-mono not-italic font-bold text-emerald-400">
            — Numbers 6:24-26
          </div>
        </div>

        {/* Heartfelt Message */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed px-2">
          Dearest <strong className="text-amber-200">{firstName}</strong>, the entire <strong className="text-white">Auxiliadora Media Ministry</strong> and parish community give joyful thanks to God for the blessing of your life, your friendship, and your dedicated service at the altar and media sound booth! May God grant you health, joy, and peace in this coming year!
        </p>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onSendBirthdayEmail && (
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || emailSent}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs font-mono tracking-wide transition-all ${
                emailSent
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95'
              }`}
            >
              {sendingEmail ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                  Dispatching Email...
                </>
              ) : emailSent ? (
                <>
                  <Check className="w-4 h-4" />
                  Birthday Email Sent!
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  {isAdmin ? 'Send Celebrant Email Now' : 'Send Me Birthday Email'}
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-colors"
          >
            Thank You & Amen! 🙏
          </button>
        </div>

        <div className="mt-4 text-[10px] font-mono text-slate-500">
          Auxiliadora Media Ministry • Mary Help of Christians Parish
        </div>
      </div>
    </div>
  );
}
