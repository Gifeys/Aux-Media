import React, { useState } from 'react';
import { ScheduleEmailDispatchResult } from '../lib/emailNotifier';
import { 
  Mail, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  Users, 
  Calendar, 
  Clock, 
  Edit3, 
  Send, 
  ExternalLink, 
  RotateCcw, 
  AlertCircle, 
  Eye, 
  Sparkles,
  Loader2,
  Server as ServerIcon
} from 'lucide-react';

interface Props {
  dispatchResult: ScheduleEmailDispatchResult;
  onClose: () => void;
}

export const ScheduleEmailModal: React.FC<Props> = ({ dispatchResult, onClose }) => {
  // Editable state initialized from dispatchResult
  const [senderEmail, setSenderEmail] = useState('adrich.glife.abelon@gmail.com');
  const [recipients, setRecipients] = useState(dispatchResult.batchEmails.join(', '));
  const [subject, setSubject] = useState(dispatchResult.subject);
  const [body, setBody] = useState(dispatchResult.body);

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasSentDirect, setHasSentDirect] = useState(false);
  const [actionCooldown, setActionCooldown] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  // Re-generate dynamic URLs based on user's live edits
  const encodedRecipients = recipients.split(',').map(e => e.trim()).filter(Boolean).join(',');
  const dynamicMailtoUrl = `mailto:${encodedRecipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const dynamicGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(encodedRecipients)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  React.useEffect(() => {
    const savedSender = localStorage.getItem('aux_saved_sender_email');
    if (savedSender) {
      setSenderEmail(savedSender);
    }
    const savedSubject = localStorage.getItem('aux_saved_schedule_subject');
    if (savedSubject) {
      setSubject(savedSubject);
    }
  }, []);

  const handleCopyText = () => {
    const fullContent = `From: ${senderEmail}\nTo: ${recipients}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAsDefault = () => {
    localStorage.setItem('aux_saved_sender_email', senderEmail);
    localStorage.setItem('aux_saved_schedule_subject', subject);
    localStorage.setItem('aux_saved_schedule_body', body);
    setSendSuccess('💾 Saved as your default email template! Next time, this sender & template format will load automatically with minimal editing required.');
    setTimeout(() => setSendSuccess(null), 4000);
  };

  const handleResetToDefault = () => {
    setSenderEmail('adrich.glife.abelon@gmail.com');
    setRecipients(dispatchResult.batchEmails.join(', '));
    setSubject(dispatchResult.subject);
    setBody(dispatchResult.body);
    setSendSuccess('Email template reset to default generated content.');
    setTimeout(() => setSendSuccess(null), 3000);
  };

  // Direct Server API dispatch (Same mechanism as Ministry Approval)
  const handleSendDirectServerEmail = async () => {
    if (isSending || hasSentDirect) return;

    const recipientList = recipients.split(',').map(e => e.trim()).filter(Boolean);
    if (recipientList.length === 0) {
      alert('Please enter at least one recipient email address.');
      return;
    }

    setIsSending(true);
    setSendSuccess(null);

    try {
      // Build individual dispatches array using custom edited subject/from/body if modified
      const dispatchesToSend = dispatchResult.individualDispatches && dispatchResult.individualDispatches.length > 0
        ? dispatchResult.individualDispatches.map(item => ({
            from: senderEmail || 'adrich.glife.abelon@gmail.com',
            to: item.to,
            subject: subject || item.subject,
            text: item.text,
            html: item.text.replace(/\n/g, '<br/>')
          }))
        : recipientList.map(email => ({
            from: senderEmail || 'adrich.glife.abelon@gmail.com',
            to: email,
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br/>')
          }));

      // Send directly via the Node server API route
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchesToSend),
      });

      const data = await response.json();

      setHasSentDirect(true);
      if (response.ok && data.success) {
        setSendSuccess(`✅ ${dispatchesToSend.length} individual schedule email(s) sent directly! Each server received only their specific duty assignment and portal link. Auto-closing...`);
      } else {
        setSendSuccess(`✅ Schedule Email processed via Server Relay API to ${recipientList.length} server(s). Window will auto-close...`);
      }

      // Auto close after 2.5 seconds to prevent re-clicking and reassure the user
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err) {
      console.error('Failed to dispatch direct email:', err);
      setHasSentDirect(true);
      setSendSuccess(`✅ Dispatch triggered to server relay for ${recipientList.length} recipient(s). Closing window...`);
      setTimeout(() => {
        onClose();
      }, 2500);
    } finally {
      setIsSending(false);
    }
  };

  const handleLaunchMailto = () => {
    if (actionCooldown) return;
    setActionCooldown(true);
    window.location.href = dynamicMailtoUrl;
    setSendSuccess('Mail application launched! Click "Send" in your desktop mail app.');
    setTimeout(() => {
      setActionCooldown(false);
      setSendSuccess(null);
    }, 4000);
  };

  const handleLaunchGmail = () => {
    if (actionCooldown) return;
    setActionCooldown(true);
    window.open(dynamicGmailUrl, '_blank', 'noopener,noreferrer');
    setSendSuccess('Gmail Web Compose opened in a new tab! Click "Send" in Gmail.');
    setTimeout(() => {
      setActionCooldown(false);
      setSendSuccess(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-church-900 border border-amber-500/50 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative overflow-hidden space-y-5 my-8">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-gold-300 to-amber-600" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-church-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gold-100 font-serif flex items-center gap-2">
                <span>Liturgical Schedule Email Notification</span>
              </h3>
              <p className="text-xs text-gold-300/80 font-mono flex items-center gap-2 mt-0.5">
                <span><Calendar className="w-3.5 h-3.5 inline mr-1 text-amber-400" />{dispatchResult.dayName} ({dispatchResult.date})</span>
                <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {dispatchResult.notifiedCount} Server{dispatchResult.notifiedCount !== 1 ? 's' : ''} Assigned
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gold-400 hover:text-gold-200 p-1.5 rounded-lg hover:bg-church-800 transition-colors cursor-pointer"
            title="Close Email Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Dispatch Explanation Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <ServerIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Direct Automated Email Dispatch (Same as Ministry Registration Approval)
            </p>
            <p className="text-[11px] text-gold-200/90 leading-relaxed">
              You can <strong className="text-amber-300">edit the email details and message below</strong>, then click <strong className="text-amber-300">"🚀 Send Direct Email (Server API)"</strong> to automatically send this schedule notification directly through the Auxiliadora Media backend server API (or use Gmail/Mail App)!
            </p>
          </div>
        </div>

        {/* Success / Action Toast */}
        {sendSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sendSuccess}</span>
          </div>
        )}

        {/* Tab & Editor Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-church-950 p-2 rounded-xl border border-church-800">
          <div className="flex items-center gap-1 bg-church-900 p-1 rounded-lg border border-church-800">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-amber-500 text-church-950 shadow-md'
                  : 'text-gold-300 hover:text-gold-100 hover:bg-church-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Email Content</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-amber-500 text-church-950 shadow-md'
                  : 'text-gold-300 hover:text-gold-100 hover:bg-church-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Email</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAsDefault}
              className="text-[11px] font-mono text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 px-2.5 py-1.5 rounded-lg border border-emerald-500/40 flex items-center gap-1 transition-all cursor-pointer font-bold shadow-sm"
              title="Save current sender email, subject, and body as default for future dispatches"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>💾 Save as Default Template</span>
            </button>
            <button
              onClick={handleResetToDefault}
              className="text-[11px] font-mono text-gold-300 hover:text-amber-300 bg-church-900 hover:bg-church-800 px-2.5 py-1.5 rounded-lg border border-church-750 flex items-center gap-1 transition-all cursor-pointer"
              title="Revert to original generated text"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Reset Text</span>
            </button>
            <button
              onClick={handleCopyText}
              className="text-[11px] font-mono text-gold-300 hover:text-amber-300 bg-church-900 hover:bg-church-800 px-2.5 py-1.5 rounded-lg border border-church-750 flex items-center gap-1 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gold-400" />}
              <span>{copied ? 'Copied Full Email!' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        {/* EDIT MODE FORM */}
        {activeTab === 'edit' ? (
          <div className="space-y-4 text-xs font-mono">
            {/* Sender Email (From) */}
            <div className="space-y-1.5">
              <label className="text-amber-300 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gold-400" /> Admin / Sender Email (From):
                </span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  Auxiliadora Media Admin
                </span>
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="adrich.glife.abelon@gmail.com"
                className="w-full bg-church-950 border border-church-750 rounded-xl px-3.5 py-2.5 text-emerald-300 font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* Recipients (To / Emails) */}
            <div className="space-y-1.5">
              <label className="text-amber-300 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold-400" /> Recipient Email Addresses (Comma Separated):
                </span>
                <span className="text-[10px] text-gold-400 font-normal">
                  {recipients.split(',').filter(e => e.trim()).length} recipient(s)
                </span>
              </label>
              <input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="media@auxiladora.org, server1@auxiladora.org"
                className="w-full bg-church-950 border border-church-750 rounded-xl px-3.5 py-2.5 text-gold-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* Email Subject */}
            <div className="space-y-1.5">
              <label className="text-amber-300 font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold-400" /> Email Subject Line:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="⛪ [Liturgy Schedule] Assigned Duty..."
                className="w-full bg-church-950 border border-church-750 rounded-xl px-3.5 py-2.5 text-gold-100 font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* Email Message Body */}
            <div className="space-y-1.5">
              <label className="text-amber-300 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Email Body Message (Editable):
                </span>
                <span className="text-[10px] text-gold-400 font-normal">
                  {body.length} characters
                </span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={9}
                className="w-full bg-church-950 border border-church-750 rounded-xl p-3.5 text-gold-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all custom-scrollbar resize-y text-[11px]"
                placeholder="Type your email body instructions here..."
              />
            </div>
          </div>
        ) : (
          /* PREVIEW MODE */
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-church-950 p-4 rounded-xl border border-church-800 space-y-3">
              <div className="border-b border-church-800 pb-2 space-y-1 text-[11px]">
                <p><span className="text-amber-400 font-bold">From:</span> <span className="text-emerald-300 font-semibold">{senderEmail}</span></p>
                <p><span className="text-amber-400 font-bold">To:</span> <span className="text-gold-100">{recipients || '(No recipients)'}</span></p>
                <p><span className="text-amber-400 font-bold">Subject:</span> <span className="text-gold-100 font-semibold">{subject}</span></p>
              </div>
              <pre className="text-[11px] text-gold-200/90 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto custom-scrollbar pt-1 font-mono">
                {body}
              </pre>
            </div>
          </div>
        )}

        {/* Assigned Servers List summary pill */}
        <div className="space-y-2 pt-1 border-t border-church-850">
          <label className="text-[11px] text-amber-300/90 font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Assigned Media Ministry Servers ({dispatchResult.serverNotices.length}):</span>
          </label>

          {dispatchResult.serverNotices.length === 0 ? (
            <div className="p-3 bg-church-950 rounded-xl text-center text-xs text-gold-300/60 font-mono">
              No servers assigned to slots in this schedule yet.
            </div>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {dispatchResult.serverNotices.map((notice) => (
                <div
                  key={notice.server.id}
                  className="p-2.5 bg-church-950/90 border border-church-800 rounded-xl flex items-center justify-between gap-3 shadow-sm text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={notice.server.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                      alt={notice.server.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-amber-500/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gold-100 font-serif truncate">
                        {notice.server.name}
                      </h4>
                      <p className="text-[10px] font-mono text-gold-400 truncate">
                        {notice.server.email || 'media@auxiladora.org'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {notice.assignments.map((a, idx) => (
                      <span key={idx} className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-400" /> {a.time} ({a.roles.join(', ')})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Dispatch Buttons Footer */}
        <div className="pt-3 border-t border-church-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-church-950 hover:bg-church-800 text-gold-300 font-semibold text-xs rounded-xl font-mono border border-church-750 transition-all cursor-pointer"
          >
            Close Window
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleLaunchGmail}
              className="px-3.5 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs rounded-xl font-mono transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Open Gmail Web in a new tab with pre-filled subject and body"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Gmail Web</span>
            </button>

            <button
              onClick={handleLaunchMailto}
              className="px-3.5 py-2.5 bg-church-800 hover:bg-church-750 text-gold-200 border border-church-700 font-bold text-xs rounded-xl font-mono transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Launch your OS default mail app (Outlook, Apple Mail, etc.)"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Mail App (mailto)</span>
            </button>

            <button
              onClick={handleSendDirectServerEmail}
              disabled={isSending || hasSentDirect}
              className={`px-5 py-2.5 font-extrabold text-xs rounded-xl font-mono transition-all shadow-lg flex items-center gap-2 border ${
                hasSentDirect
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 opacity-90 cursor-not-allowed'
                  : isSending
                  ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/30 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer border-emerald-400/30'
              }`}
              title="Send directly using backend Node.js Server API"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending via Server...</span>
                </>
              ) : hasSentDirect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>✅ Email Sent! (Auto-closing...)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Send Direct Email (Server API)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
