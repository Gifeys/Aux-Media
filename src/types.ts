/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SocComRole = 'ppt' | 'live_server' | 'documentation' | 'reels_editor';

export interface Server {
  id: string;
  name: string;
  role: SocComRole;
  roles?: SocComRole[]; // Multiple primary liturgy roles
  skills?: string[]; // Multiple editable skills / ministry capabilities
  picture: string; // URL or base64
  bio?: string; // Inspiring media bio / ministry statement
  workImages?: string[]; // 3 portfolio / ministry work images
  isSubAdmin: boolean;
  isAdmin: boolean;
  birthday: string; // "MM-DD" or "July 24"
  email?: string;
  password?: string; // Default or custom login password
  accessToken?: string;
  serviceLogs?: { slotId: string; date: string; time: string; status: 'served' | 'not_served'; timestamp: string }[];
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  password?: string;
  birthday?: string;
  preferredMinistry: string;
  experience?: string;
  submittedAt: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  meetingInfo?: {
    dateTime: string;
    location: string;
    notes?: string;
  };
}

export interface ServerNote {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPicture?: string;
  isPublic: boolean; // true = shared with all servers; false = private to author
  category: 'reminder' | 'duty' | 'general' | 'quick';
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleSlot {
  id: string; // unique for this slot
  time: string; // e.g. "Sat 6:00 PM", "Sun 6:00 AM", etc.
  ppt: string[]; // Server IDs (can be multiple)
  live_server: string[]; // Server IDs (can be multiple)
  documentation: string[]; // Server IDs (can be multiple)
  reels_editor: string[]; // Server IDs (can be multiple)
  isGoingLive?: boolean; // Whether this slot is going live
}

export interface ScheduleRow {
  id: string;
  dayName: string; // e.g. "Sixteenth Sunday in Ordinary Time (Mary Help of Christians)"
  date: string; // e.g. "2026-07-26"
  specialService: string; // e.g. "Fiesta Celebration" or empty
  isLive: boolean; // turns the specific row red / alerts user
  isSpecial?: boolean; // indicates if it goes to the "Special Liturgy" table
  slots: ScheduleSlot[];
}

export interface SubstitutionRequest {
  id: string;
  scheduleRowId: string;
  slotId: string;
  role: SocComRole;
  fromServerId: string;
  toServerId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface ServiceReceipt {
  id: string;
  date: string;
  time: string;
  dayName: string;
  serverId: string;
  serverName: string;
  role: SocComRole;
  reflection: string;
  timestamp: string;
}

export interface SocComOfTheMonth {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  workImages: string[]; // precisely 3 pictures
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'birthday' | 'reminder' | 'bible_verse' | 'daily_word' | 'event' | 'general';
  date: string;
  imageUrl?: string;
}

export interface CommunityCard {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface ActiveSession {
  userId: string;
  email: string;
  userName?: string;
  deviceType?: string;
  sessionId: string;
  lastHeartbeat: number;
}

export interface SiteSettings {
  appName: string;
  appSubtitle: string;
  logoUrl: string;
  loginTitle: string;
  loginSubtitle: string;
  loginGreeting: string;
  loginBgUrl?: string;
  communityCards?: CommunityCard[];
  parishName: string;
  contactEmail: string;
  footerText: string;

  // About & History Section
  aboutTitle?: string;
  aboutContentP1?: string;
  aboutContentP2?: string;

  // Media Services Section
  service1Title?: string;
  service1Desc?: string;
  service2Title?: string;
  service2Desc?: string;
  service3Title?: string;
  service3Desc?: string;
  service4Title?: string;
  service4Desc?: string;

  // Gallery / Carousel Cards
  card1Title?: string;
  card1Subtitle?: string;
  card1ImageUrl?: string;
  card2Title?: string;
  card2Subtitle?: string;
  card2ImageUrl?: string;
  card3Title?: string;
  card3Subtitle?: string;
  card3ImageUrl?: string;
  card4Title?: string;
  card4Subtitle?: string;
  card4ImageUrl?: string;

  // Our Community Section
  communityTitle?: string;
  communitySubtitle?: string;

  // Daily Verses Settings
  customDailyVerseQuote?: string;
  customDailyVerseReference?: string;
  dailyVerseImageUrl?: string;
  dailyVerseAuthorName?: string;
  dailyVersesList?: { quote: string; reference: string; authorPaintingUrl?: string; authorName?: string }[];
}

export type AttendanceAuditStatus = 'attended' | 'unresponsive_absent' | 'substituted' | 'excused';

export interface ScheduleAuditRecord {
  id: string; // e.g. "audit-schRowId-slotId-serverId-role"
  scheduleRowId: string;
  slotId: string;
  serverId: string;
  serverName: string;
  serverEmail?: string;
  role: SocComRole;
  dayName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // e.g. "Sun 6:00 AM"
  status: AttendanceAuditStatus;
  reflectionSubmitted: boolean;
  invitationResponded: boolean;
  notifiedSubAdmins: boolean;
  flaggedAt: string; // ISO timestamp
  notes?: string;
}

export interface SubAdminAttendanceAlert {
  id: string;
  auditRecordId: string;
  serverId: string;
  serverName: string;
  serverEmail?: string;
  role: SocComRole;
  dayName: string;
  date: string;
  time: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
}

