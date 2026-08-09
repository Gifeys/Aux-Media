import { ScheduleRow, Server, ServiceReceipt, SubstitutionRequest, ScheduleAuditRecord, SubAdminAttendanceAlert, SocComRole } from '../types';

export const ROLE_DISPLAY_NAMES: Record<SocComRole, string> = {
  ppt: 'PPT Operator',
  live_server: 'Live Stream Operator',
  documentation: 'Photo & Documentation',
  reels_editor: 'Reels & Video Editor',
};

/**
 * Determines whether a schedule slot is finished based on its date and time string.
 * Mass service is estimated to finish 1.5 hours (90 mins) after start time.
 */
export function isSlotFinished(dateStr: string, timeStr: string): boolean {
  if (!dateStr) return false;

  const now = new Date();
  
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  // Format YYYY-MM-DD
  const dateParts = dateStr.split('-');
  if (dateParts.length === 3) {
    year = parseInt(dateParts[0], 10);
    month = parseInt(dateParts[1], 10) - 1;
    day = parseInt(dateParts[2], 10);
  } else {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }
  }

  // Extract time e.g. "Sat 6:00 PM" -> "6:00 PM" or "6:00 AM"
  let hours = 12;
  let minutes = 0;
  
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }

  const slotStartTime = new Date(year, month, day, hours, minutes);
  // Service finishes 90 minutes after start
  const slotEndTime = new Date(slotStartTime.getTime() + 90 * 60 * 1000);

  return now.getTime() >= slotEndTime.getTime();
}

/**
 * Checks if current time is past 10:00 PM on the service date or on a subsequent date.
 */
export function isPastTenPmCutoff(dateStr: string): boolean {
  if (!dateStr) return false;
  const now = new Date();
  
  let targetDate: Date | null = null;
  const dateParts = dateStr.split('-');
  if (dateParts.length === 3) {
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    targetDate = new Date(year, month, day, 22, 0, 0); // 10:00 PM cutoff on service day
  } else {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 22, 0, 0);
    }
  }

  if (!targetDate) return false;
  return now.getTime() >= targetDate.getTime();
}

/**
 * Audits all finished schedule rows and slots against server responses, reflections, and substitution requests.
 * Generates audit records and notifies all sub-admins for unresponsive/absent members.
 */
export function auditFinishedSchedules(
  schedules: ScheduleRow[],
  servers: Server[],
  receipts: ServiceReceipt[],
  subRequests: SubstitutionRequest[],
  existingAudits: ScheduleAuditRecord[]
): {
  updatedAudits: ScheduleAuditRecord[];
  newAlerts: SubAdminAttendanceAlert[];
} {
  const serverMap: Record<string, Server> = {};
  servers.forEach((s) => {
    serverMap[s.id] = s;
  });

  const auditMap = new Map<string, ScheduleAuditRecord>();
  existingAudits.forEach((record) => {
    auditMap.set(record.id, record);
  });

  const newAlerts: SubAdminAttendanceAlert[] = [];
  const updatedAuditsList: ScheduleAuditRecord[] = [];

  schedules.forEach((row) => {
    row.slots.forEach((slot) => {
      const finished = isSlotFinished(row.date, slot.time);
      if (!finished) return;

      const roles: SocComRole[] = ['ppt', 'live_server', 'documentation', 'reels_editor'];

      roles.forEach((role) => {
        const val = slot[role];
        const assignedIds: string[] = Array.isArray(val)
          ? val
          : typeof val === 'string' && val
          ? [val]
          : [];

        assignedIds.forEach((serverId) => {
          if (!serverId) return;
          const server = serverMap[serverId];
          const auditId = `audit-${row.id}-${slot.id}-${serverId}-${role}`;

          // Check if reflection exists for this server and date/time
          const hasReflection = receipts.some((r) => {
            const isSameServer = r.serverId === serverId;
            const isSameDate = r.date === row.date;
            const isSameTime = r.time === slot.time;
            return isSameServer && (isSameDate || isSameTime);
          });

          // Check if server submitted accepted substitution request
          const hasAcceptedSub = subRequests.some((sub) => {
            return (
              sub.scheduleRowId === row.id &&
              sub.slotId === slot.id &&
              sub.role === role &&
              sub.fromServerId === serverId &&
              sub.status === 'accepted'
            );
          });

          // Check if server sent sub request or acknowledged invitation
          const hasSentSubReq = subRequests.some((sub) => {
            return (
              sub.scheduleRowId === row.id &&
              sub.slotId === slot.id &&
              sub.role === role &&
              sub.fromServerId === serverId
            );
          });

          const existingRecord = auditMap.get(auditId);

          let status: ScheduleAuditRecord['status'] = 'unresponsive_absent';
          if (existingRecord?.status === 'excused') {
            status = 'excused';
          } else if (hasAcceptedSub) {
            status = 'substituted';
          } else if (hasReflection) {
            status = 'attended';
          } else {
            status = 'unresponsive_absent';
          }

          const isUnresponsive = status === 'unresponsive_absent';
          const shouldNotify = isUnresponsive && (!existingRecord || !existingRecord.notifiedSubAdmins);

          const auditRecord: ScheduleAuditRecord = {
            id: auditId,
            scheduleRowId: row.id,
            slotId: slot.id,
            serverId,
            serverName: server?.name || 'Assigned Server',
            serverEmail: server?.email || '',
            role,
            dayName: row.dayName,
            date: row.date,
            time: slot.time,
            status,
            reflectionSubmitted: hasReflection,
            invitationResponded: hasSentSubReq || hasReflection || hasAcceptedSub,
            notifiedSubAdmins: existingRecord?.notifiedSubAdmins || shouldNotify,
            flaggedAt: existingRecord?.flaggedAt || new Date().toISOString(),
            notes: existingRecord?.notes
          };

          auditMap.set(auditId, auditRecord);
          updatedAuditsList.push(auditRecord);

          if (shouldNotify) {
            const roleName = ROLE_DISPLAY_NAMES[role] || role;
            newAlerts.push({
              id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              auditRecordId: auditId,
              serverId,
              serverName: server?.name || 'Assigned Server',
              serverEmail: server?.email,
              role,
              dayName: row.dayName,
              date: row.date,
              time: slot.time,
              message: `⚠️ ABSENCE / NO-RESPONSE ALERT: ${server?.name || 'Server'} was assigned as ${roleName} for ${row.dayName} (${row.date} @ ${slot.time}) but did not respond, log in, or submit a post-service reflection. Sub-admins notified!`,
              createdAt: new Date().toISOString(),
              isRead: false
            });
          }
        });
      });
    });
  });

  return {
    updatedAudits: updatedAuditsList,
    newAlerts
  };
}
