import React, { useState, useMemo } from 'react';
import { ScheduleRow, Server, ServiceReceipt, SubstitutionRequest, ScheduleAuditRecord, SubAdminAttendanceAlert, AttendanceAuditStatus, SocComRole } from '../types';
import { ROLE_DISPLAY_NAMES } from '../lib/scheduleAudit';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, Mail, Search, RefreshCw, Calendar, Clock, UserX, Check, FileText, ArrowRightLeft } from 'lucide-react';

interface SubAdminAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ScheduleRow[];
  servers: Server[];
  receipts: ServiceReceipt[];
  subRequests: SubstitutionRequest[];
  auditRecords: ScheduleAuditRecord[];
  subAdminAlerts: SubAdminAttendanceAlert[];
  onUpdateAuditStatus: (auditId: string, newStatus: AttendanceAuditStatus, notes?: string) => void;
  onDismissAlert: (alertId: string) => void;
  onRunAuditNow: () => void;
  currentUser: Server;
}

export default function SubAdminAttendanceModal({
  isOpen,
  onClose,
  schedules,
  servers,
  receipts,
  subRequests,
  auditRecords,
  subAdminAlerts,
  onUpdateAuditStatus,
  onDismissAlert,
  onRunAuditNow,
  currentUser
}: SubAdminAttendanceModalProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'audits' | 'summary'>('alerts');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');

  if (!isOpen) return null;

  const serverMap = useMemo(() => {
    const map: Record<string, Server> = {};
    servers.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [servers]);

  // Unread or active alerts for sub-admins
  const activeAlerts = useMemo(() => {
    return subAdminAlerts.filter((a) => !a.isRead);
  }, [subAdminAlerts]);

  // Filtered audit records
  const filteredAudits = useMemo(() => {
    return auditRecords.filter((record) => {
      const matchesSearch =
        record.serverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.date.includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;
      return record.status === filterStatus;
    });
  }, [auditRecords, searchQuery, filterStatus]);

  // Summary metrics
  const stats = useMemo(() => {
    const total = auditRecords.length;
    const absent = auditRecords.filter((r) => r.status === 'unresponsive_absent').length;
    const attended = auditRecords.filter((r) => r.status === 'attended').length;
    const substituted = auditRecords.filter((r) => r.status === 'substituted').length;
    const excused = auditRecords.filter((r) => r.status === 'excused').length;
    const complianceRate = total > 0 ? Math.round(((attended + substituted + excused) / total) * 100) : 100;

    return { total, absent, attended, substituted, excused, complianceRate };
  }, [auditRecords]);

  const handleSendWarningEmail = (record: ScheduleAuditRecord) => {
    const roleTitle = ROLE_DISPLAY_NAMES[record.role] || record.role;
    const email = record.serverEmail || `${record.serverName.toLowerCase().replace(/\s+/g, '')}@auxiliadora.org`;
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auxiliadora-media.web.app';
    const subject = `⚠️ [SocCom Sub-Admin Attendance Notice] Missed Shift / Pending Reflection: ${record.dayName} (${record.date})`;
    const body = `Dear ${record.serverName},\n\n` +
      `This is an automated attendance & responsiveness notification from the Auxiliadora Media Ministry Sub-Admin Panel.\n\n` +
      `Our liturgical schedule audit system detected that your assigned duty on completed schedule:\n` +
      `📅 Event/Liturgy: ${record.dayName}\n` +
      `📆 Date & Time: ${record.date} @ ${record.time}\n` +
      `🎯 Assigned Role: ${roleTitle}\n\n` +
      `Status: NO REFLECTION SUBMITTED / NO RESPONSE CONFIRMED.\n\n` +
      `Please log in to your Auxiliadora Media portal immediately (Workspace tab) to submit your post-service reflection receipt or contact the Sub-Admin team if you had an emergency:\n\n` +
      `🌐 PORTAL WEBSITE LINK:\n${siteUrl}\n\n` +
      `Blessings in Christ,\n` +
      `Auxiliadora Media Ministry Sub-Admin Team\n` +
      `Mary Help of Christians Parish`;

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleSaveStatusUpdate = (recordId: string, newStatus: AttendanceAuditStatus) => {
    onUpdateAuditStatus(recordId, newStatus, editNoteText);
    setEditingAuditId(null);
    setEditNoteText('');
  };

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b1928] border border-gold-500/40 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#051424] border-b border-gold-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gold-100 font-serif">
                  Sub-Admin Attendance & Schedule Audit
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 font-mono text-[10px] font-bold">
                  Sub-Admin Level
                </span>
              </div>
              <p className="text-xs text-gold-300/80">
                Responsive monitoring for finished liturgical schedules, member reflections & responsiveness
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onRunAuditNow}
              className="px-3 py-1.5 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 text-gold-200 border border-gold-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Run schedule attendance audit check now"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gold-400" />
              <span>Run Audit Now</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gold-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-4 bg-[#081a2e] border-b border-white/10 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-[#0b1928] border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase">Schedule Compliance</span>
            <span className={`text-lg font-bold ${stats.complianceRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {stats.complianceRate}%
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0b1928] border border-red-500/30">
            <span className="text-[10px] text-red-400 block uppercase font-bold flex items-center gap-1">
              <UserX className="w-3 h-3" /> Unresponsive / Absent
            </span>
            <span className="text-lg font-bold text-red-300">{stats.absent}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0b1928] border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 block uppercase font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Attended & Reflected
            </span>
            <span className="text-lg font-bold text-emerald-300">{stats.attended}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0b1928] border border-amber-500/30">
            <span className="text-[10px] text-amber-400 block uppercase font-bold flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" /> Substituted
            </span>
            <span className="text-lg font-bold text-amber-300">{stats.substituted}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0b1928] border border-blue-500/30 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-blue-400 block uppercase font-bold">Excused / Verbal</span>
            <span className="text-lg font-bold text-blue-300">{stats.excused}</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-white/10 bg-[#051424] px-4 pt-2 gap-2 text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-[#0b1928] text-amber-300 border-t-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-gold-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Sub-Admin Alerts ({activeAlerts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audits')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'audits'
                ? 'bg-[#0b1928] text-amber-300 border-t-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-gold-200'
            }`}
          >
            <FileText className="w-4 h-4 text-gold-400" />
            <span>All Schedule Audit Records ({auditRecords.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          
          {/* TAB 1: SUB-ADMIN ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-gold-300/80">
                <span>Real-time alerts triggered when a finished mass service lacks member reflection or response:</span>
                {subAdminAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => subAdminAlerts.forEach((a) => onDismissAlert(a.id))}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Mark All Alerts as Read
                  </button>
                )}
              </div>

              {subAdminAlerts.length === 0 ? (
                <div className="p-8 text-center bg-[#051424] rounded-2xl border border-white/5 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-gold-100 font-serif font-bold text-base">No Pending Attendance Alerts</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All finished liturgical schedule shifts have been fulfilled, reflected upon, or excused by sub-admins.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subAdminAlerts.map((alert) => {
                    const auditRec = auditRecords.find((r) => r.id === alert.auditRecordId);
                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border transition-all ${
                          alert.isRead
                            ? 'bg-[#051424] border-white/10 opacity-70'
                            : 'bg-[#150d1a] border-red-500/40 shadow-lg'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold uppercase">
                                ⚠️ UNRESPONSIVE / ABSENT
                              </span>
                              <span className="text-xs font-bold text-gold-100 font-serif">
                                {alert.serverName}
                              </span>
                              <span className="text-[11px] text-gold-300/70 font-mono">
                                ({ROLE_DISPLAY_NAMES[alert.role] || alert.role})
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {alert.message}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gold-400" /> {alert.dayName} ({alert.date})
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gold-400" /> {alert.time}
                              </span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                            {auditRec && (
                              <button
                                type="button"
                                onClick={() => handleSendWarningEmail(auditRec)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Mail className="w-3.5 h-3.5 text-amber-400" />
                                <span>Send Warning Email</span>
                              </button>
                            )}

                            {auditRec && (
                              <button
                                type="button"
                                onClick={() => onUpdateAuditStatus(auditRec.id, 'excused', 'Excused by sub-admin')}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Excused</span>
                              </button>
                            )}

                            {!alert.isRead && (
                              <button
                                type="button"
                                onClick={() => onDismissAlert(alert.id)}
                                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                              >
                                Dismiss Alert
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT RECORDS LIST */}
          {activeTab === 'audits' && (
            <div className="space-y-4">
              
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#051424] p-3 rounded-xl border border-white/10">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search member, event, date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0b1928] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gold-100 placeholder-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs font-mono">
                  <span className="text-slate-400 text-[11px] shrink-0">Filter Status:</span>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'unresponsive_absent', label: '🔴 Absent' },
                    { key: 'attended', label: '🟢 Attended' },
                    { key: 'substituted', label: '🟡 Substituted' },
                    { key: 'excused', label: '🔵 Excused' }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => setFilterStatus(btn.key)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                        filterStatus === btn.key
                          ? 'bg-gold-500/20 text-gold-300 border-gold-500/50 font-bold'
                          : 'bg-[#0b1928] text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Records List */}
              {filteredAudits.length === 0 ? (
                <div className="p-8 text-center bg-[#051424] rounded-xl border border-white/5 text-slate-400 text-xs">
                  No schedule audit records match your search or filter.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAudits.map((record) => {
                    const serverObj = serverMap[record.serverId];
                    const roleName = ROLE_DISPLAY_NAMES[record.role] || record.role;

                    return (
                      <div
                        key={record.id}
                        className="p-3.5 bg-[#051424] rounded-xl border border-white/10 hover:border-gold-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={serverObj?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt={record.serverName}
                            className="w-10 h-10 rounded-xl object-cover border border-gold-500/30 shrink-0 mt-0.5"
                            referrerPolicy="no-referrer"
                          />

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gold-100 font-serif text-sm">
                                {record.serverName}
                              </span>
                              <span className="text-xs text-gold-300/80 font-mono">
                                • {roleName}
                              </span>

                              {/* Status Badge */}
                              {record.status === 'unresponsive_absent' && (
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">
                                  🔴 UNRESPONSIVE / ABSENT
                                </span>
                              )}
                              {record.status === 'attended' && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                                  🟢 ATTENDED & REFLECTED
                                </span>
                              )}
                              {record.status === 'substituted' && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                                  🟡 SUBSTITUTED
                                </span>
                              )}
                              {record.status === 'excused' && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                                  🔵 EXCUSED
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-300 font-sans">
                              📅 <strong className="text-gold-200">{record.dayName}</strong> ({record.date} @ {record.time})
                            </p>

                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                              <span>Reflection: {record.reflectionSubmitted ? '✅ Submitted' : '❌ Pending'}</span>
                              <span>•</span>
                              <span>Invitation Ack: {record.invitationResponded ? '✅ Acknowledged' : '❌ No Response'}</span>
                              {record.notes && <span className="text-amber-300">• Note: {record.notes}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                          {record.status === 'unresponsive_absent' && (
                            <button
                              type="button"
                              onClick={() => handleSendWarningEmail(record)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Send warning email notice"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Notice</span>
                            </button>
                          )}

                          {editingAuditId === record.id ? (
                            <div className="flex items-center gap-1.5 bg-[#0b1928] p-1.5 rounded-lg border border-gold-500/40">
                              <select
                                defaultValue={record.status}
                                onChange={(e) => handleSaveStatusUpdate(record.id, e.target.value as AttendanceAuditStatus)}
                                className="bg-[#051424] text-gold-100 text-xs font-mono p-1 rounded border border-white/20"
                              >
                                <option value="attended">Attended</option>
                                <option value="unresponsive_absent">Unresponsive / Absent</option>
                                <option value="substituted">Substituted</option>
                                <option value="excused">Excused</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => setEditingAuditId(null)}
                                className="p-1 text-slate-400 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingAuditId(record.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold-300 border border-white/10 text-xs font-mono transition-all cursor-pointer"
                            >
                              Update Status
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#051424] border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Logged in Sub-Admin: <strong className="text-gold-200">{currentUser.name}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gold-500 text-church-950 font-bold hover:bg-gold-400 transition-all cursor-pointer"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
