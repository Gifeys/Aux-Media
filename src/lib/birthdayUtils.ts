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
 * Checks if a member's birthday is TODAY based on current date / local timezone (e.g. Philippines UTC+8)
 */
export function isBirthdayToday(birthdayStr?: string, targetDate: Date = new Date()): boolean {
  if (!birthdayStr || typeof birthdayStr !== 'string') return false;

  const targetMonth = targetDate.getMonth(); // 0-11
  const targetDay = targetDate.getDate(); // 1-31

  // Extract month index
  const bMonth = getBirthMonthIndex(birthdayStr);
  if (bMonth === null || bMonth !== targetMonth) return false;

  // Extract day number
  // Format like "July 24", "2026-07-24", "07-24", "7/24"
  const dayMatches = birthdayStr.match(/\d+/g);
  if (!dayMatches || dayMatches.length === 0) return false;

  let parsedDay: number | null = null;

  if (dayMatches.length === 1) {
    parsedDay = parseInt(dayMatches[0], 10);
  } else if (dayMatches.length >= 2) {
    // If YYYY-MM-DD
    if (dayMatches[0].length === 4) {
      parsedDay = parseInt(dayMatches[2] || dayMatches[1], 10);
    } else {
      // MM-DD or DD-MM
      const d1 = parseInt(dayMatches[0], 10);
      const d2 = parseInt(dayMatches[1], 10);
      // Since bMonth is known, find which number matches the day
      if (d1 === bMonth + 1) {
        parsedDay = d2;
      } else {
        parsedDay = d1;
      }
    }
  }

  return parsedDay === targetDay;
}

/**
 * Returns all active servers who are celebrating their birthday TODAY
 */
export function getTodayBirthdayCelebrants(servers: Server[], targetDate: Date = new Date()): Server[] {
  return servers.filter(s => isBirthdayToday(s.birthday, targetDate));
}

/**
 * Generates an inspiring, liturgical birthday greeting email for a ministry member
 */
export function generateBirthdayEmailContent(
  celebrant: Server,
  adminName: string = 'Adrich Glife Abelon',
  adminEmail: string = 'adrich.glife.abelon@gmail.com',
  siteUrl: string = typeof window !== 'undefined' ? window.location.origin : 'https://auxiliadora-media.web.app'
) {
  const roleName = celebrant.role ? celebrant.role.replace('_', ' ').toUpperCase() : 'SOCCOM MEDIA SERVER';
  const displayBday = formatBirthdayForDisplay(celebrant.birthday);
  const firstName = celebrant.name ? celebrant.name.split(' ')[0] : 'Media Servant';

  const subject = `🎂 Happy Blessed Birthday, ${celebrant.name}! 🎉 | Auxiliadora Media Ministry`;

  const text = `Dear ${celebrant.name},\n\n` +
    `🎉 "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace." — Numbers 6:24-26\n\n` +
    `Peace and joy in Christ!\n\n` +
    `On this most special day of your birth (${displayBday}), the entire Auxiliadora Media Ministry family and Mary Help of Christians Parish community lift up our hearts in joyful thanksgiving to Almighty God for the precious gift of your life and faithful liturgical service!\n\n` +
    `Thank you for your tireless dedication, technical excellence, and cheerful heart as our ${roleName}. Through every slide flashed, camera operated, live broadcast streamed, and reflection shared, you help bring Christ's loving presence into the hearts and homes of thousands of faithful parishioners.\n\n` +
    `May our Blessed Mother, Mary Help of Christians, wrap you under her loving mantle, guide your steps, and grant all the desires of your heart. May the year ahead be filled with abundant blessings, good health, peace, prosperity, and renewed spiritual fervor!\n\n` +
    `Log into the Auxiliadora Media Portal to see your birthday greetings card on the ministry bulletin:\n` +
    `🌐 ${siteUrl}\n\n` +
    `With heartfelt prayers and warmest birthday blessings,\n\n` +
    `${adminName}\n` +
    `Lead Admin, Auxiliadora Media Ministry\n` +
    `Mary Help of Christians Parish\n` +
    `Contact: ${adminEmail}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #051424; margin: 0; padding: 24px; color: #d4e4fa; }
        .card { max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #102235, #081a2e); border: 2px solid #f59e0b; border-radius: 20px; padding: 36px 28px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); text-align: center; }
        .logo-badge { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; font-family: monospace; }
        .title { font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #fef3c7; margin: 8px 0 4px 0; font-weight: bold; line-height: 1.2; }
        .subtitle { font-size: 13px; color: #93c5fd; margin-bottom: 24px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; }
        .avatar-box { margin: 20px auto; width: 110px; height: 110px; border-radius: 50%; border: 3px solid #fbbf24; overflow: hidden; box-shadow: 0 8px 24px rgba(245,158,11,0.3); background-color: #1e3a8a; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .verse-box { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 18px 20px; margin: 24px 0; text-align: center; font-style: italic; font-family: Georgia, serif; color: #a7f3d0; font-size: 14px; line-height: 1.6; }
        .body-p { font-size: 14px; line-height: 1.7; color: #cbd5e1; text-align: left; margin: 16px 0; }
        .highlight { color: #fde68a; font-weight: bold; }
        .btn-portal { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #051424 !important; text-decoration: none; font-weight: 800; font-size: 13px; padding: 14px 32px; border-radius: 12px; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 1px; font-family: monospace; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #64748b; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo-badge">⛪ Auxiliadora Media Ministry • Birthday Blessing</div>
        <h1 class="title">🎂 Happy Blessed Birthday, ${celebrant.name}! 🎉</h1>
        <div class="subtitle">Celebrant • ${roleName} • ${displayBday}</div>

        ${celebrant.picture ? `
        <div class="avatar-box">
          <img class="avatar-img" src="${celebrant.picture}" alt="${celebrant.name}" />
        </div>` : ''}

        <div class="verse-box">
          "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace."<br>
          <strong style="color: #6ee7b7; font-style: normal; font-size: 12px; margin-top: 6px; display: inline-block;">— Numbers 6:24-26</strong>
        </div>

        <p class="body-p">
          Peace and blessings in Christ, <span class="highlight">${firstName}</span>!
        </p>

        <p class="body-p">
          On this beautiful day of your birthday (<span class="highlight">${displayBday}</span>), our entire Media Ministry council and parish family celebrate the gift of your life and faithfully applaud your dedication as our <span class="highlight">${roleName}</span>.
        </p>

        <p class="body-p">
          Through your liturgical service at the altar sound booth, live streaming cameras, and digital evangelization, you touch countless souls and bring the joy of the Gospel to our parish. May Our Lady, Mary Help of Christians, protect you and may God reward you with health, joy, and peace!
        </p>

        <div>
          <a class="btn-portal" href="${siteUrl}" target="_blank">🌐 Open Media Ministry Portal</a>
        </div>

        <div class="footer">
          With prayers & gratitude,<br>
          <strong>${adminName}</strong> (Lead Admin)<br>
          Auxiliadora Media Ministry • Mary Help of Christians Parish<br>
          ${adminEmail}
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: celebrant.email || '',
    subject,
    text,
    html,
    from: adminEmail
  };
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
    const isToday = isBirthdayToday(server.birthday, targetDate);

    // Check if there is already a birthday announcement for this server in existingAnnouncements
    const exists = result.some((a) => 
      a.type === 'birthday' && 
      (a.id.includes(server.id) || a.title.toLowerCase().includes(server.name.toLowerCase()))
    );

    if (!exists) {
      const autoAnn: Announcement = {
        id: `auto-bday-${server.id}-${currentYear}-${currentMonthIndex + 1}`,
        title: isToday ? `🎂 TODAY'S BIRTHDAY CELEBRANT: ${server.name} 🎉` : `🎂 Birthday Celebration: ${server.name}`,
        content: isToday 
          ? `🌟 TODAY IS ${server.name.toUpperCase()}'S BIRTHDAY! 🎂 Join the Auxiliadora Media Ministry in offering heartfelt prayers and warmest blessings to our beloved ${server.role.replace('_', ' ').toUpperCase()}! May Almighty God bestow abundant graces, joy, and peace upon you today!`
          : `Warmest birthday blessings & prayers to our dedicated ${server.role.replace('_', ' ').toUpperCase()} media servant, ${server.name} (${formattedBday}), celebrating this month of ${monthName}! May God shower you with grace, joy, and peace! 🕊️✨`,
        type: 'birthday',
        date: isToday ? `Today (${monthName} ${targetDate.getDate()})` : `${monthName} ${currentYear}`,
        imageUrl: server.picture || undefined
      };
      result.unshift(autoAnn);
    }
  }

  return result;
}
