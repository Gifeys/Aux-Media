/**
 * Helper utilities for birthday date selection, formatting, and auto-announcements.
 */
import { Server, Announcement } from '../types';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Extracts month index (0-11) from various birthday string formats.
 * E.g., "July 24", "2026-07-24", "07-24", "7/24", "24 July"
 */
export function getBirthMonthIndex(birthdayStr?: string): number | null {
  if (!birthdayStr || typeof birthdayStr !== 'string') return null;

  const strLower = birthdayStr.trim().toLowerCase();
  if (!strLower) return null;

  // 1. Check for month names in string
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const full = MONTH_NAMES[i].toLowerCase();
    const short = SHORT_MONTH_NAMES[i].toLowerCase();
    if (strLower.includes(full) || strLower.includes(short)) {
      return i;
    }
  }

  // 2. Check for numeric formats: YYYY-MM-DD, MM-DD, YYYY/MM/DD, MM/DD
  const dateObj = new Date(birthdayStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.getMonth();
  }

  // Fallback regex split
  const parts = strLower.split(/[-/.\s]+/);
  if (parts.length >= 2) {
    // If first part is 4-digit year e.g. [2026, 07, 24]
    if (parts[0].length === 4) {
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) return m - 1;
    }
    // If MM-DD
    const m1 = parseInt(parts[0], 10);
    if (m1 >= 1 && m1 <= 12) return m1 - 1;

    const m2 = parseInt(parts[1], 10);
    if (m2 >= 1 && m2 <= 12) return m2 - 1;
  }

  return null;
}

/**
 * Converts any date or birthday string to a clean display format like "July 24"
 */
export function formatBirthdayForDisplay(birthdayStr?: string): string {
  if (!birthdayStr) return 'Not set';

  // If already in "Month DD" format like "July 24"
  for (const m of MONTH_NAMES) {
    if (birthdayStr.toLowerCase().includes(m.toLowerCase())) {
      return birthdayStr;
    }
  }

  const dateObj = new Date(birthdayStr);
  if (!isNaN(dateObj.getTime())) {
    const month = MONTH_NAMES[dateObj.getMonth()];
    const day = dateObj.getDate();
    return `${month} ${day < 10 ? '0' + day : day}`;
  }

  return birthdayStr;
}

/**
 * Converts any birthday string to YYYY-MM-DD format for <input type="date">
 */
export function formatBirthdayForInput(birthdayStr?: string): string {
  if (!birthdayStr) return '';

  const dateObj = new Date(birthdayStr);
  if (!isNaN(dateObj.getTime())) {
    const yyyy = dateObj.getFullYear() || new Date().getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // If "July 24"
  const mIndex = getBirthMonthIndex(birthdayStr);
  if (mIndex !== null) {
    // try to extract day digits
    const dayMatch = birthdayStr.match(/\d+/);
    const day = dayMatch ? parseInt(dayMatch[0], 10) : 1;
    const yyyy = new Date().getFullYear();
    const mm = String(mIndex + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
}

/**
 * Automatically injects birthday announcements for all servers whose birthday
 * month matches the current month!
 */
export function combineWithAutoMonthBirthdays(
  existingAnnouncements: Announcement[],
  servers: Server[],
  targetDate: Date = new Date()
): Announcement[] {
  const currentMonthIndex = targetDate.getMonth(); // 0-11
  const currentYear = targetDate.getFullYear();
  const monthName = MONTH_NAMES[currentMonthIndex];

  // Find all servers having birthday in current month
  const birthdayServers = servers.filter((s) => {
    const bMonth = getBirthMonthIndex(s.birthday);
    return bMonth === currentMonthIndex;
  });

  if (birthdayServers.length === 0) {
    return existingAnnouncements;
  }

  const result = [...existingAnnouncements];

  for (const server of birthdayServers) {
    const formattedBday = formatBirthdayForDisplay(server.birthday);
    // Check if there is already a birthday announcement for this server in existingAnnouncements
    const exists = result.some((a) => 
      a.type === 'birthday' && 
      (a.id.includes(server.id) || a.title.toLowerCase().includes(server.name.toLowerCase()))
    );

    if (!exists) {
      const autoAnn: Announcement = {
        id: `auto-bday-${server.id}-${currentYear}-${currentMonthIndex + 1}`,
        title: `🎂 Birthday Celebration: ${server.name}`,
        content: `Warmest birthday blessings & prayers to our dedicated ${server.role.replace('_', ' ').toUpperCase()} media servant, ${server.name} (${formattedBday}), celebrating this month of ${monthName}! May God shower you with grace, joy, and peace! 🕊️✨`,
        type: 'birthday',
        date: `${monthName} ${currentYear}`,
        imageUrl: server.picture || undefined
      };
      result.unshift(autoAnn);
    }
  }

  return result;
}
