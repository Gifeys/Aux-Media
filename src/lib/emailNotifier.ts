import { ScheduleRow, Server, SocComRole } from '../types';

export interface AssignedServerEmailNotice {
  server: Server;
  assignments: {
    time: string;
    roles: string[];
  }[];
}

export interface IndividualEmailDispatch {
  to: string;
  serverName: string;
  subject: string;
  text: string;
  body: string;
  html?: string;
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
  individualDispatches: IndividualEmailDispatch[];
}

const ROLE_DISPLAY_NAMES: Record<SocComRole, string> = {
  ppt: 'PPT Operator',
  live_server: 'Live Stream Operator',
  documentation: 'Photo & Documentation',
  reels_editor: 'Reels & Video Highlights Editor',
};

export function formatIndividualServerEmailBody(
  serverName: string,
  scheduleRow: { dayName: string; date: string; specialService?: string },
  assignments: { time: string; roles: string[] }[],
  siteUrl: string,
  customIntroMessage?: string
): string {
  let body = `Greetings ${serverName},\n\n`;
  body += customIntroMessage 
    ? `${customIntroMessage}\n\n` 
    : `Peace be with you! You have been scheduled for liturgical duty at Mary Help of Christians Parish:\n\n`;
  
  body += `📅 LITURGY / EVENT: ${scheduleRow.dayName}\n`;
  body += `📆 DATE: ${scheduleRow.date}\n`;
  if (scheduleRow.specialService) {
    body += `✨ SPECIAL EVENT: ${scheduleRow.specialService}\n`;
  }

  body += `\n========================================\n`;
  body += `YOUR INDIVIDUAL DUTY ASSIGNMENT:\n`;
  body += `========================================\n`;

  if (!assignments || assignments.length === 0) {
    body += `(No specific time slots assigned)\n`;
  } else {
    assignments.forEach((a) => {
      body += `⏰ Mass / Service Time: ${a.time}\n`;
      body += `🎯 Role(s): ${a.roles.join(', ')}\n\n`;
    });
  }

  body += `========================================\n`;
  body += `Please ensure you arrive at least 15 minutes before your scheduled service time.\n`;
  body += `If you need a proxy or substitution, please inform the SocCom Executive Team promptly.\n\n`;
  body += `🌐 VIEW YOUR SCHEDULE ON THE WEBSITE PORTAL:\n`;
  body += `To view your full master schedule, attendance status, and team roster, please visit:\n${siteUrl}\n\n`;
  body += `In Christ,\n`;
  body += `Auxiliadora Media Ministry & SocCom Team\n`;
  body += `Mary Help of Christians Parish`;

  return body;
}

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

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auxiliadora-media.web.app';
  const subject = `⛪ [Liturgy Schedule] Assigned Duty: ${scheduleRow.dayName} (${scheduleRow.date})`;

  // Generate individual personalized emails for each assigned server
  const individualDispatches: IndividualEmailDispatch[] = serverNotices.map((notice) => {
    const textBody = formatIndividualServerEmailBody(notice.server.name, scheduleRow, notice.assignments, siteUrl);
    const toEmail = notice.server.email || `${notice.server.name.toLowerCase().replace(/\s+/g, '')}@auxiladora.org`;
    return {
      to: toEmail,
      serverName: notice.server.name,
      subject,
      text: textBody,
      body: textBody,
    };
  });

  // Default preview template format
  let body = `Greetings {Server Name},\n\n`;
  body += `Peace be with you! You have been scheduled for liturgical duty at Mary Help of Christians Parish:\n\n`;
  body += `📅 LITURGY / EVENT: ${scheduleRow.dayName}\n`;
  body += `📆 DATE: ${scheduleRow.date}\n`;
  if (scheduleRow.specialService) {
    body += `✨ SPECIAL EVENT: ${scheduleRow.specialService}\n`;
  }
  body += `\n========================================\n`;
  body += `YOUR ASSIGNED SERVE SCHEDULE & ROLES:\n`;
  body += `========================================\n`;
  body += `⏰ Mass / Service Time: [Server Assigned Mass Time]\n`;
  body += `🎯 Role(s): [Assigned Role, e.g. PPT / Live Stream]\n\n`;
  body += `========================================\n`;
  body += `Please ensure you arrive at least 15 minutes before your scheduled service time.\n`;
  body += `If you need a proxy or substitution, please inform the SocCom Executive Team promptly.\n\n`;
  body += `🌐 VIEW YOUR SCHEDULE ON THE WEBSITE PORTAL:\n`;
  body += `To view your full master schedule, attendance status, and team roster, please visit:\n${siteUrl}\n\n`;
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
    individualDispatches,
  };
}
