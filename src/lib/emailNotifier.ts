import { ScheduleRow, Server, SocComRole } from '../types';

export interface AssignedServerEmailNotice {
  server: Server;
  assignments: {
    time: string;
    roles: string[];
  }[];
}

export interface ScheduleEmailDispatchResult {
  dayName: string;
  date: string;
  notifiedCount: number;
  serverNotices: AssignedServerEmailNotice[];
  batchEmails: string[];
  subject: string;
  body: string;
  mailtoUrl: string;
}

const ROLE_DISPLAY_NAMES: Record<SocComRole, string> = {
  ppt: 'PPT Operator',
  live_server: 'Live Stream Operator',
  documentation: 'Photo & Documentation',
  reels_editor: 'Reels & Video Highlights Editor',
};

/**
 * Extracts assigned servers from a schedule row and formats email dispatch data.
 */
export function generateScheduleEmailData(
  scheduleRow: ScheduleRow,
  servers: Server[]
): ScheduleEmailDispatchResult {
  const serverMap: Record<string, Server> = {};
  servers.forEach((s) => {
    serverMap[s.id] = s;
  });

  // Map of serverId -> Map<slotTime, Set<roleDisplayName>>
  const assignmentMap = new Map<string, Map<string, Set<string>>>();

  scheduleRow.slots.forEach((slot) => {
    const processRoleGroup = (serverIds: string[] | undefined, role: SocComRole) => {
      if (!Array.isArray(serverIds)) return;
      serverIds.forEach((sId) => {
        if (!sId || !serverMap[sId]) return;
        if (!assignmentMap.has(sId)) {
          assignmentMap.set(sId, new Map());
        }
        const timeMap = assignmentMap.get(sId)!;
        if (!timeMap.has(slot.time)) {
          timeMap.set(slot.time, new Set());
        }
        timeMap.get(slot.time)!.add(ROLE_DISPLAY_NAMES[role] || role);
      });
    };

    processRoleGroup(slot.ppt, 'ppt');
    processRoleGroup(slot.live_server, 'live_server');
    processRoleGroup(slot.documentation, 'documentation');
    processRoleGroup(slot.reels_editor, 'reels_editor');
  });

  const serverNotices: AssignedServerEmailNotice[] = [];
  const batchEmails: string[] = [];

  assignmentMap.forEach((timeMap, sId) => {
    const server = serverMap[sId];
    if (!server) return;

    const assignments: { time: string; roles: string[] }[] = [];
    timeMap.forEach((rolesSet, time) => {
      assignments.push({
        time,
        roles: Array.from(rolesSet),
      });
    });

    serverNotices.push({
      server,
      assignments,
    });

    const email = server.email || `${server.name.toLowerCase().replace(/\s+/g, '')}@auxiladora.org`;
    if (!batchEmails.includes(email)) {
      batchEmails.push(email);
    }
  });

  const subject = `⛪ [Liturgy Schedule] Assigned Duty: ${scheduleRow.dayName} (${scheduleRow.date})`;

  let body = `Greetings Media Ministry Server,\n\n`;
  body += `Peace be with you! You have been scheduled for liturgical duty at Mary Help of Christians Parish:\n\n`;
  body += `📅 LITURGY / EVENT: ${scheduleRow.dayName}\n`;
  body += `📆 DATE: ${scheduleRow.date}\n`;
  if (scheduleRow.specialService) {
    body += `✨ SPECIAL EVENT: ${scheduleRow.specialService}\n`;
  }
  body += `\n========================================\n`;
  body += `DUTY BREAKDOWN & TIME OF SERVICE:\n`;
  body += `========================================\n`;

  serverNotices.forEach((notice) => {
    body += `\n👤 Server: ${notice.server.name} (${notice.server.email || 'media@auxiladora.org'})\n`;
    notice.assignments.forEach((a) => {
      body += `   ⏰ Time of Mass/Service: ${a.time}\n`;
      body += `   🎯 Role(s): ${a.roles.join(', ')}\n`;
    });
  });

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auxiliadora-media.web.app';

  body += `\n========================================\n`;
  body += `Please ensure you arrive 15 minutes before your scheduled service time.\n`;
  body += `If you need a proxy or substitution, please inform the SocCom Executive Team promptly.\n\n`;
  body += `🌐 AUXILIADORA MEDIA PORTAL WEBSITE:\n${siteUrl}\n\n`;
  body += `In Christ,\n`;
  body += `Auxiliadora Media Ministry & SocCom Team\n`;
  body += `Mary Help of Christians Parish`;

  // Encode for mailto:
  const mailtoUrl = `mailto:${batchEmails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    dayName: scheduleRow.dayName,
    date: scheduleRow.date,
    notifiedCount: serverNotices.length,
    serverNotices,
    batchEmails,
    subject,
    body,
    mailtoUrl,
  };
}
