/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Server, 
  ScheduleRow, 
  SubstitutionRequest, 
  ServiceReceipt, 
  Announcement, 
  SocComOfTheMonth, 
  Applicant, 
  SocComRole, 
  SiteSettings, 
  ActiveSession, 
  ServerNote, 
  ScheduleAuditRecord, 
  SubAdminAttendanceAlert, 
  AttendanceAuditStatus,
  Contribution,
  Expense,
  FinancialAuditLog
} from './types';
import { 
  DEFAULT_SERVERS, 
  DEFAULT_SCHEDULES, 
  DEFAULT_ANNOUNCEMENTS, 
  DEFAULT_SOCOM_OF_THE_MONTH, 
  DEFAULT_SITE_SETTINGS, 
  DEFAULT_NOTES,
  DEFAULT_CONTRIBUTIONS,
  DEFAULT_EXPENSES,
  DEFAULT_FINANCIAL_AUDIT_LOGS
} from './initialData';
import { db, handleFirestoreError, OperationType, resetUserPassword, createFirebaseAuthAccount, cleanFirestorePayload } from './lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ReflectionsView from './components/ReflectionsView';
import NotesView from './components/NotesView';
import ScheduleBoard from './components/ScheduleBoard';
import MyWorkspace from './components/MyWorkspace';
import AdminPanel from './components/AdminPanel';
import CommunityHub from './components/CommunityHub';
import ResiboView from './components/ResiboView';
import ModalsContainer from './components/ModalsContainer';
import AestheticsStudio from './components/AestheticsStudio';
import LoginScreen from './components/LoginScreen';
import SubAdminAttendanceModal from './components/SubAdminAttendanceModal';
import BirthdayGreetingModal from './components/BirthdayGreetingModal';
import { combineWithAutoMonthBirthdays, isBirthdayToday, getTodayBirthdayCelebrants } from './lib/birthdayUtils';
import { auditFinishedSchedules } from './lib/scheduleAudit';

export default function App() {
  // ---------------------------------------------------------
  // CORE STATES (Synced with Firebase Firestore + LocalStorage fallback)
  // ---------------------------------------------------------
  
  const [servers, setServers] = useState<Server[]>(DEFAULT_SERVERS);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [subRequests, setSubRequests] = useState<SubstitutionRequest[]>([]);
  const [receipts, setReceipts] = useState<ServiceReceipt[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financialAuditLogs, setFinancialAuditLogs] = useState<FinancialAuditLog[]>([]);
  const [birthdayCelebrantToShow, setBirthdayCelebrantToShow] = useState<Server | null>(null);
  const [soccomOfMonth, setSoccomOfMonth] = useState<SocComOfTheMonth>(() => {
    try {
      const saved = localStorage.getItem('aux_soccom_of_the_month');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SOCOM_OF_THE_MONTH;
  });
  const [applicants, setApplicants] = useState<Applicant[]>(() => {
    try {
      const saved = localStorage.getItem('aux_applicants');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('aux_site_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SITE_SETTINGS;
  });
  const [notes, setNotes] = useState<ServerNote[]>([]);
  const [auditRecords, setAuditRecords] = useState<ScheduleAuditRecord[]>([]);
  const [subAdminAlerts, setSubAdminAlerts] = useState<SubAdminAttendanceAlert[]>([]);

  const [showSubAdminAuditModal, setShowSubAdminAuditModal] = useState(false);

  // ---------------------------------------------------------
  // FIREBASE FIRESTORE REAL-TIME SUBSCRIPTIONS
  // ---------------------------------------------------------
  useEffect(() => {
    // 1. Users / Roster
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Server[] = [];
        snapshot.forEach((d) => loaded.push(d.data() as Server));
        
        // Ensure Adrich Glife Abelon (admin-1) is ALWAYS present as the Lead Admin
        const adminIndex = loaded.findIndex((u) => u.id === 'admin-1' || u.email?.toLowerCase() === 'adrich.glife.abelon@gmail.com');
        if (adminIndex === -1) {
          const leadAdmin = DEFAULT_SERVERS[0];
          loaded.unshift(leadAdmin);
          setDoc(doc(db, 'users', leadAdmin.id), leadAdmin).catch(console.warn);
        } else {
          // Update & sync Adrich Glife Abelon's admin credentials
          const currentAdmin = loaded[adminIndex];
          const updatedAdmin: Server = {
            ...currentAdmin,
            name: 'Adrich Glife Abelon',
            email: 'adrich.glife.abelon@gmail.com',
            password: currentAdmin.password || currentAdmin.accessToken || 'media123',
            accessToken: currentAdmin.accessToken || currentAdmin.password || 'media123',
            isAdmin: true,
            isSubAdmin: true,
          };
          if (
            currentAdmin.name !== updatedAdmin.name ||
            currentAdmin.email !== updatedAdmin.email ||
            !currentAdmin.isAdmin
          ) {
            loaded[adminIndex] = updatedAdmin;
            setDoc(doc(db, 'users', updatedAdmin.id), updatedAdmin).catch(console.warn);
          }
        }

        // Strictly enforce ONLY Adrich Glife Abelon has isAdmin = true and remove dummy bot users
        const dummyBotIds = new Set([
          'subadmin-1', 'server-ppt-1', 'server-live-1', 'server-doc-1', 
          'server-reels-1', 'server-ppt-2', 'server-live-2', 'server-doc-2', 'server-reels-2'
        ]);

        const filtered: Server[] = [];
        loaded.forEach((u) => {
          const isDummy = dummyBotIds.has(u.id) || (u.email && (u.email.endsWith('@auxiliadora.org') || u.email.endsWith('@auxiladora.org')) && u.id !== 'admin-1');
          if (isDummy) {
            deleteDoc(doc(db, 'users', u.id)).catch(console.warn);
          } else {
            if (u.id !== 'admin-1' && u.email?.toLowerCase() !== 'adrich.glife.abelon@gmail.com' && u.isAdmin) {
              const demoted = { ...u, isAdmin: false };
              setDoc(doc(db, 'users', u.id), demoted).catch(console.warn);
              filtered.push(demoted);
            } else {
              filtered.push(u);
            }
          }
        });

        setServers(filtered);
      } else {
        // Seed initial default servers to Firestore
        DEFAULT_SERVERS.forEach((srv) => {
          setDoc(doc(db, 'users', srv.id), srv).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${srv.id}`));
        });
        setServers(DEFAULT_SERVERS);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    // 2. Applicants
    const unsubApplicants = onSnapshot(collection(db, 'applicants'), (snapshot) => {
      const loaded: Applicant[] = [];
      snapshot.forEach((d) => loaded.push(d.data() as Applicant));
      
      // Check if there are local applicants in state/localStorage not yet in Firestore, and push them to cloud
      let localSaved: Applicant[] = [];
      try {
        const raw = localStorage.getItem('aux_applicants');
        if (raw) localSaved = JSON.parse(raw);
      } catch (e) {
        console.warn('LocalStorage read warning:', e);
      }

      localSaved.forEach((localApp) => {
        if (localApp && localApp.id) {
          const localEmail = (localApp.email || '').toLowerCase().trim();
          if (!loaded.some((l) => l.id === localApp.id || (localEmail.length > 0 && (l.email || '').toLowerCase().trim() === localEmail))) {
            loaded.push(localApp);
            // Auto-sync missing local applicant to cloud Firestore
            setDoc(doc(db, 'applicants', localApp.id), localApp).catch(console.warn);
          }
        }
      });

      setApplicants(loaded);
      try {
        localStorage.setItem('aux_applicants', JSON.stringify(loaded));
      } catch (e) {
        console.warn('LocalStorage write warning:', e);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'applicants'));

    // 3. Announcements
    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const loaded: Announcement[] = [];
      snapshot.forEach((d) => loaded.push(d.data() as Announcement));
      setAnnouncements(loaded);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'announcements'));

    // 4. Schedules
    const unsubSchedules = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const loaded: ScheduleRow[] = [];
      snapshot.forEach((d) => loaded.push(d.data() as ScheduleRow));
      setSchedules(loaded);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'schedules'));

    // 5. SocCom of the Month
    const unsubSoccom = onSnapshot(doc(db, 'settings', 'soccom_of_the_month'), (snapshot) => {
      if (snapshot.exists()) {
        setSoccomOfMonth(snapshot.data() as SocComOfTheMonth);
      } else {
        setDoc(doc(db, 'settings', 'soccom_of_the_month'), DEFAULT_SOCOM_OF_THE_MONTH).catch(console.warn);
        setSoccomOfMonth(DEFAULT_SOCOM_OF_THE_MONTH);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/soccom_of_the_month'));

    // 6. Server Notes
    const unsubNotes = onSnapshot(collection(db, 'server_notes'), (snapshot) => {
      const loaded: ServerNote[] = [];
      snapshot.forEach((d) => loaded.push(d.data() as ServerNote));
      setNotes(loaded);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'server_notes'));

    // 7. Site Settings (Band Logo, Login Picture, Custom Branding & Texts)
    const unsubSiteSettings = onSnapshot(doc(db, 'settings', 'site_settings'), (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as SiteSettings;
        setSiteSettings(prev => ({
          ...DEFAULT_SITE_SETTINGS,
          ...prev,
          ...cloudData
        }));
      } else {
        setDoc(doc(db, 'settings', 'site_settings'), DEFAULT_SITE_SETTINGS).catch(console.warn);
        setSiteSettings(DEFAULT_SITE_SETTINGS);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/site_settings'));

    // 8. Substitution Requests
    const unsubSubReqs = onSnapshot(collection(db, 'sub_requests'), (snapshot) => {
      const loaded: SubstitutionRequest[] = [];
      snapshot.forEach((d) => loaded.push(d.data() as SubstitutionRequest));
      setSubRequests(loaded);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sub_requests'));

    // 9. Service Receipts
    const unsubReceipts = onSnapshot(collection(db, 'receipts'), (snapshot) => {
      const loadedMap = new Map<string, ServiceReceipt>();
      snapshot.forEach((d) => {
        const item = d.data() as ServiceReceipt;
        if (item && item.id) {
          loadedMap.set(item.id, item);
        }
      });
      setReceipts(Array.from(loadedMap.values()));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'receipts'));

    // 10. Resibo — Contributions
    const unsubContributions = onSnapshot(collection(db, 'contributions'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Contribution[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Contribution;
          // Delete old demo contributions if encountered
          if (['contrib-1', 'contrib-2', 'contrib-3', 'contrib-4', 'contrib-5', 'contrib-6', 'contrib-7', 'contrib-8', 'contrib-9', 'contrib-10'].includes(d.id)) {
            deleteDoc(doc(db, 'contributions', d.id)).catch(console.warn);
          } else {
            loaded.push(data);
          }
        });
        setContributions(loaded);
      } else {
        setContributions([]);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contributions'));

    // 11. Resibo — Expenses
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Expense[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Expense;
          // Clean up old mock sample expenses from Firestore if encountered
          if (['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5', 'exp-6', 'exp-7', 'exp-8', 'exp-9', 'exp-10'].includes(d.id)) {
            deleteDoc(doc(db, 'expenses', d.id)).catch(console.warn);
          } else {
            loaded.push(data);
          }
        });
        setExpenses(loaded);
      } else {
        setExpenses([]);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'expenses'));

    // 12. Resibo — Financial Audit Logs
    const unsubAuditLogs = onSnapshot(collection(db, 'financial_audit_logs'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: FinancialAuditLog[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as FinancialAuditLog;
          if (['audit-1', 'audit-2', 'audit-3', 'audit-4', 'audit-5', 'audit-6', 'audit-7'].includes(d.id)) {
            deleteDoc(doc(db, 'financial_audit_logs', d.id)).catch(console.warn);
          } else {
            loaded.push(data);
          }
        });
        setFinancialAuditLogs(loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        setFinancialAuditLogs([]);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'financial_audit_logs'));

    // Cleanup lingering fund_deposits if any exist in Firestore
    getDocs(collection(db, 'fund_deposits')).then((snap) => {
      snap.forEach((d) => deleteDoc(doc(db, 'fund_deposits', d.id)).catch(console.warn));
    }).catch(() => {});

    return () => {
      unsubUsers();
      unsubApplicants();
      unsubAnnouncements();
      unsubSchedules();
      unsubSoccom();
      unsubNotes();
      unsubSiteSettings();
      unsubSubReqs();
      unsubReceipts();
      unsubContributions();
      unsubExpenses();
      unsubAuditLogs();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('aux_server_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('aux_site_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('aux_soccom_of_the_month', JSON.stringify(soccomOfMonth));
  }, [soccomOfMonth]);

  useEffect(() => {
    localStorage.setItem('aux_applicants', JSON.stringify(applicants));
  }, [applicants]);

  // Automated Schedule Attendance & Sub-Admin Alert Auditor
  const handleRunScheduleAudit = () => {
    if (schedules.length > 0 && servers.length > 0) {
      const { updatedAudits, newAlerts } = auditFinishedSchedules(
        schedules,
        servers,
        receipts,
        subRequests,
        auditRecords
      );

      if (updatedAudits.length > 0) {
        setAuditRecords(updatedAudits);
        localStorage.setItem('aux_audit_records', JSON.stringify(updatedAudits));
      }

      if (newAlerts.length > 0) {
        setSubAdminAlerts((prev) => {
          const combined = [...newAlerts, ...prev];
          localStorage.setItem('aux_subadmin_alerts', JSON.stringify(combined));
          return combined;
        });
      }
    }
  };

  useEffect(() => {
    handleRunScheduleAudit();
    const interval = setInterval(() => {
      handleRunScheduleAudit();
    }, 30000); // Audit check every 30 seconds
    return () => clearInterval(interval);
  }, [schedules, servers, receipts, subRequests]);

  const handleUpdateAuditStatus = (auditId: string, newStatus: AttendanceAuditStatus, notesText?: string) => {
    setAuditRecords((prev) => {
      const updated = prev.map((item) =>
        item.id === auditId ? { ...item, status: newStatus, notes: notesText || item.notes } : item
      );
      localStorage.setItem('aux_audit_records', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDismissSubAdminAlert = (alertId: string) => {
    setSubAdminAlerts((prev) => {
      const updated = prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a));
      localStorage.setItem('aux_subadmin_alerts', JSON.stringify(updated));
      return updated;
    });
  };

  // Active navigation tab (default to 'dashboard')
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Theme preference state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('aux_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  // Currently logged-in profile ID
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('aux_current_user_id');
    return saved || '';
  });

  // Authentication status
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('aux_is_logged_in');
    return saved === 'true';
  });

  // Modal Visibility States
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [dismissedAnnIds, setDismissedAnnIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aux_dismissed_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Derived current user object - strictly requires valid user match from database Roster
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return servers.find(s => s.id === currentUserId) || null;
  }, [servers, currentUserId]);

  // Security Lock Enforcement: If logged in but account was deleted by Admin or doesn't exist, force immediate logout
  useEffect(() => {
    if (isLoggedIn) {
      if (!currentUserId) {
        setIsLoggedIn(false);
      } else if (servers.length > 0) {
        const userExists = servers.some(s => s.id === currentUserId);
        if (!userExists) {
          console.warn("Security enforcement: Account deleted or revoked by Admin. Access locked.");
          setIsLoggedIn(false);
          setCurrentUserId('');
          localStorage.removeItem('aux_is_logged_in');
          localStorage.removeItem('aux_current_user_id');
        }
      }
    }
  }, [isLoggedIn, currentUserId, servers]);

  // Dynamic Announcements: Automatically includes birthday announcements for all servers born in current month
  const effectiveAnnouncements = useMemo(() => {
    const combined = combineWithAutoMonthBirthdays(announcements, servers);
    return combined.filter(a => !dismissedAnnIds.includes(a.id));
  }, [announcements, servers, dismissedAnnIds]);

  // ---------------------------------------------------------
  // SYNCHRONIZATION (Save to LocalStorage on Change)
  // ---------------------------------------------------------

  useEffect(() => {
    localStorage.setItem('aux_servers', JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    localStorage.setItem('aux_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('aux_sub_requests', JSON.stringify(subRequests));
  }, [subRequests]);

  useEffect(() => {
    localStorage.setItem('aux_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('aux_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('aux_current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('aux_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aux_theme', theme);
  }, [theme]);

  // Session and Single Account Active Entry Enforcement
  const currentSessionId = useRef('sess_' + Math.random().toString(36).substring(2) + '_' + Date.now()).current;
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  // Real-time listener for active sessions across devices/tabs
  useEffect(() => {
    const unsubSessions = onSnapshot(collection(db, 'active_sessions'), (snapshot) => {
      const loaded: ActiveSession[] = [];
      const now = Date.now();
      snapshot.forEach((docSnap) => {
        const sess = docSnap.data() as ActiveSession;
        if (sess && sess.lastHeartbeat && (now - sess.lastHeartbeat < 45000)) {
          loaded.push(sess);
        }
      });
      setActiveSessions(loaded);
    }, (err) => console.warn("Active sessions snapshot info:", err));

    return () => unsubSessions();
  }, []);

  // Helper to determine device type
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return '📱 Mobile';
    if (/iPad|Tablet/i.test(ua)) return '📱 Tablet';
    return '💻 Desktop/Laptop';
  };

  // Automatic Birthday In-App Greeting & Midnight Email Dispatch
  useEffect(() => {
    if (!servers || servers.length === 0) return;

    // 1. In-App Birthday Greeting Modal for logged in celebrant
    if (currentUser && isBirthdayToday(currentUser.birthday)) {
      const todayKey = new Date().toISOString().split('T')[0];
      const seenKey = `aux_bday_modal_seen_${currentUser.id}_${todayKey}`;
      if (!sessionStorage.getItem(seenKey)) {
        setBirthdayCelebrantToShow(currentUser);
        sessionStorage.setItem(seenKey, 'true');
      }
    }

    // 2. Automated Midnight Email Dispatch Trigger
    const checkAndDispatchBirthdays = async () => {
      try {
        const celebrants = getTodayBirthdayCelebrants(servers);
        if (celebrants.length > 0) {
          const res = await fetch('/api/dispatch-birthdays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ servers })
          });
          const data = await res.json().catch(() => ({}));
          if (data.dispatched && data.dispatched.length > 0) {
            console.log('🎂 Birthday email greetings automatically dispatched:', data.dispatched);
          }
        }
      } catch (err) {
        console.warn('Birthday dispatch check notice:', err);
      }
    };

    // Run on mount
    checkAndDispatchBirthdays();

    // Set interval to check every 60 seconds (catches exact 12:00 midnight crossover)
    const bdayInterval = setInterval(checkAndDispatchBirthdays, 60000);

    return () => clearInterval(bdayInterval);
  }, [servers, currentUser]);

  // Heartbeat when user is logged in
  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;

    const updateHeartbeat = async () => {
      const docId = `${currentUserId}_${currentSessionId}`;
      const sessionData: ActiveSession = {
        userId: currentUserId,
        email: currentUser?.email || '',
        userName: currentUser?.name || 'Member',
        deviceType: getDeviceType(),
        sessionId: currentSessionId,
        lastHeartbeat: Date.now()
      };
      try {
        await setDoc(doc(db, 'active_sessions', docId), sessionData);
      } catch (e) {
        console.warn("Heartbeat update info:", e);
      }
    };

    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 12000);

    return () => {
      clearInterval(interval);
      const docId = `${currentUserId}_${currentSessionId}`;
      deleteDoc(doc(db, 'active_sessions', docId)).catch(console.warn);
    };
  }, [isLoggedIn, currentUserId, currentUser, currentSessionId]);

  // Automatic logout for deleted members: if an account is removed from the database, invalidate active session
  useEffect(() => {
    if (isLoggedIn && currentUserId && currentUserId !== 'admin-1') {
      const isStillInDatabase = servers.some(s => s.id === currentUserId);
      if (!isStillInDatabase && servers.length > 0) {
        setIsLoggedIn(false);
        setCurrentUserId('admin-1');
        alert("⚠️ Access Revoked: Your member account has been deleted by the Ministry Administrator.");
      }
    }
  }, [servers, isLoggedIn, currentUserId]);

  // List of user IDs that are currently logged in from OTHER active sessions
  const activeUserIdsFromOtherSessions = useMemo(() => {
    const now = Date.now();
    return activeSessions
      .filter(s => (now - s.lastHeartbeat < 45000))
      .map(s => s.userId);
  }, [activeSessions]);

  // ---------------------------------------------------------
  // USER OPERATIONS
  // ---------------------------------------------------------

  const handleLoginSuccess = (userId: string): { success: boolean; error?: string } => {
    setCurrentUserId(userId);
    setIsLoggedIn(true);
    return { success: true };
  };

  const handleLogout = () => {
    const docId = `${currentUserId}_${currentSessionId}`;
    deleteDoc(doc(db, 'active_sessions', docId)).catch(console.warn);
    setIsLoggedIn(false);
  };

  const handleUserChange = (user: Server) => {
    setCurrentUserId(user.id);
  };

  const handleUpdateProfilePicture = (base64Picture: string) => {
    if (!currentUser) return;
    const updatedUser: Server = { ...currentUser, picture: base64Picture };
    setServers(prev => prev.map(s => {
      if (s.id === currentUser.id) {
        return updatedUser;
      }
      return s;
    }));
    setDoc(doc(db, 'users', currentUser.id), updatedUser).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}`));
  };

  // ---------------------------------------------------------
  // SUBSTITUTION & REFLECTION OPERATIONS
  // ---------------------------------------------------------

  const handleSendSubRequest = (reqData: Omit<SubstitutionRequest, 'id' | 'timestamp' | 'status'>) => {
    const newRequest: SubstitutionRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    setSubRequests(prev => [newRequest, ...prev]);
    setDoc(doc(db, 'sub_requests', newRequest.id), newRequest).catch((err) => handleFirestoreError(err, OperationType.WRITE, `sub_requests/${newRequest.id}`));
  };

  const handleRespondSubRequest = (requestId: string, accept: boolean) => {
    const request = subRequests.find(r => r.id === requestId);
    if (!request) return;

    const newStatus = accept ? 'accepted' : 'declined';
    const updatedSubReq: SubstitutionRequest = { ...request, status: newStatus };

    setSubRequests(prev => prev.map(r => r.id === requestId ? updatedSubReq : r));
    setDoc(doc(db, 'sub_requests', requestId), cleanFirestorePayload(updatedSubReq)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `sub_requests/${requestId}`));

    if (accept) {
      setSchedules(prevSchedules => prevSchedules.map(row => {
        if (row.id === request.scheduleRowId) {
          const updatedSlots = row.slots.map(slot => {
            if (slot.id === request.slotId) {
              const currentArr = slot[request.role] || [];
              const updatedArr = currentArr.includes(request.fromServerId)
                ? currentArr.map(id => id === request.fromServerId ? request.toServerId : id)
                : [...currentArr.filter(id => id !== request.toServerId), request.toServerId];

              return {
                ...slot,
                [request.role]: updatedArr
              };
            }
            return slot;
          });
          const updatedRow = { ...row, slots: updatedSlots };
          setDoc(doc(db, 'schedules', row.id), cleanFirestorePayload(updatedRow)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `schedules/${row.id}`));
          return updatedRow;
        }
        return row;
      }));
    }
  };

  const handleSaveReceipt = (receiptData: Omit<ServiceReceipt, 'id' | 'timestamp'>) => {
    // Check if a receipt for this exact serverId, date, and role ALREADY EXISTS
    const existing = receipts.find(r => 
      r.serverId === receiptData.serverId &&
      r.date === receiptData.date &&
      r.role === receiptData.role
    );

    if (existing) {
      // Update existing receipt instead of creating a duplicate entry
      const updatedReceipt: ServiceReceipt = {
        ...existing,
        reflection: receiptData.reflection,
        dayName: receiptData.dayName || existing.dayName,
        time: receiptData.time || existing.time,
        timestamp: new Date().toISOString()
      };
      setReceipts(prev => prev.map(r => r.id === existing.id ? updatedReceipt : r));
      setDoc(doc(db, 'receipts', existing.id), cleanFirestorePayload(updatedReceipt))
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, `receipts/${existing.id}`));
    } else {
      const newReceipt: ServiceReceipt = {
        ...receiptData,
        id: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString()
      };
      setReceipts(prev => {
        if (prev.some(r => r.id === newReceipt.id)) return prev;
        return [newReceipt, ...prev];
      });
      setDoc(doc(db, 'receipts', newReceipt.id), cleanFirestorePayload(newReceipt))
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, `receipts/${newReceipt.id}`));
    }
  };

  const handleSubmitReflectionText = (text: string) => {
    handleSaveReceipt({
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: '05:30 PM',
      dayName: 'Liturgical Mass Service',
      serverId: currentUser.id,
      serverName: currentUser.name,
      role: currentUser.role,
      reflection: text
    });
  };

  const handleDeleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
    deleteDoc(doc(db, 'receipts', id)).catch((err) => handleFirestoreError(err, OperationType.DELETE, `receipts/${id}`));
  };

  // ---------------------------------------------------------
  // ADMINISTRATIVE & SCHEDULE OPERATIONS (Firestore Persisted)
  // ---------------------------------------------------------

  const handleAddSchedule = (newRow: ScheduleRow) => {
    setSchedules(prev => [newRow, ...prev]);
    setDoc(doc(db, 'schedules', newRow.id), cleanFirestorePayload(newRow)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `schedules/${newRow.id}`));
  };

  const handleUpdateSchedule = (updatedRow: ScheduleRow) => {
    setSchedules(prev => prev.map(s => s.id === updatedRow.id ? updatedRow : s));
    setDoc(doc(db, 'schedules', updatedRow.id), cleanFirestorePayload(updatedRow)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `schedules/${updatedRow.id}`));
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    deleteDoc(doc(db, 'schedules', id)).catch((err) => handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`));
  };

  const handleAddServer = (newServer: Server) => {
    const emailNormalized = (newServer.email || '').trim().toLowerCase();
    const duplicate = servers.find(s => (s.email || '').trim().toLowerCase() === emailNormalized);
    if (duplicate) {
      alert(`⚠️ Account Creation Blocked: An account with email "${newServer.email}" already exists (${duplicate.name})! Strictly 1 account per email address.`);
      return;
    }
    setServers(prev => [...prev, newServer]);
    setDoc(doc(db, 'users', newServer.id), cleanFirestorePayload(newServer)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${newServer.id}`));
  };

  const handleUpdateSoccomOfMonth = (updated: SocComOfTheMonth) => {
    setSoccomOfMonth(updated);
    setDoc(doc(db, 'settings', 'soccom_of_the_month'), cleanFirestorePayload(updated)).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/soccom_of_the_month'));
    alert(`🏆 SocCom of the Month updated to ${updated.name}!`);
  };

  const handleUpdateServer = (updatedServer: Server) => {
    setServers(prev => prev.map(s => s.id === updatedServer.id ? updatedServer : s));
    setDoc(doc(db, 'users', updatedServer.id), cleanFirestorePayload(updatedServer)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${updatedServer.id}`));
  };

  const handleDeleteServer = (id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
    deleteDoc(doc(db, 'users', id)).catch((err) => handleFirestoreError(err, OperationType.DELETE, `users/${id}`));
  };

  const handleAddAnnouncement = (ann: Announcement) => {
    setAnnouncements(prev => [ann, ...prev]);
    setDoc(doc(db, 'announcements', ann.id), cleanFirestorePayload(ann)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `announcements/${ann.id}`));
  };

  const handleUpdateAnnouncement = (updated: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
    setDoc(doc(db, 'announcements', updated.id), cleanFirestorePayload(updated)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `announcements/${updated.id}`));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDismissedAnnIds(prev => {
      const updated = [...prev, id];
      localStorage.setItem('aux_dismissed_announcements', JSON.stringify(updated));
      return updated;
    });
    deleteDoc(doc(db, 'announcements', id)).catch((err) => handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`));
  };

  const handleRegisterApplicant = async (newApp: Omit<Applicant, 'id' | 'submittedAt' | 'status'>) => {
    const emailNorm = (newApp.email || '').trim().toLowerCase();
    if (!emailNorm) {
      throw new Error("Email address is required to register.");
    }

    const existingServer = servers.find(s => (s.email || '').trim().toLowerCase() === emailNorm && emailNorm.length > 0);
    if (existingServer) {
      const msg = `An account with email "${newApp.email}" is already an active member of Auxiliadora Media Ministry. Please log in directly.`;
      alert(`⚠️ Registration Notice: ${msg}`);
      throw new Error(msg);
    }

    const existingApp = applicants.find(a => (a.email || '').trim().toLowerCase() === emailNorm && emailNorm.length > 0);

    const fullApp: Applicant = {
      id: existingApp ? existingApp.id : `applicant-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: (newApp.name || '').trim(),
      email: emailNorm,
      password: newApp.password || 'media123',
      preferredMinistry: newApp.preferredMinistry || 'Digital Liturgy & Live Streaming',
      experience: newApp.experience || 'No previous experience provided.',
      submittedAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setApplicants(prev => {
      const updated = [fullApp, ...prev.filter(a => a.id !== fullApp.id && (a.email || '').toLowerCase() !== emailNorm)];
      try {
        localStorage.setItem('aux_applicants', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'applicants', fullApp.id), cleanFirestorePayload(fullApp));
      console.log('✅ Applicant registered and synced to Firestore DB:', fullApp.id);
    } catch (err: any) {
      console.error('Error saving applicant to Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `applicants/${fullApp.id}`);
    }
  };

  const handleApproveApplicant = async (applicant: Applicant) => {
    const emailNorm = (applicant.email || '').trim().toLowerCase();
    const existingServer = servers.find(s => (s.email || '').trim().toLowerCase() === emailNorm && emailNorm.length > 0);
    if (existingServer) {
      alert(`⚠️ Approval Notice: An active user account with email "${applicant.email}" already exists (${existingServer.name}). Strictly 1 account per email.`);
      return;
    }
    let role: SocComRole = 'live_server';
    const ministryLower = (applicant.preferredMinistry || '').toLowerCase();
    if (ministryLower.includes('ppt') || ministryLower.includes('presentation')) {
      role = 'ppt';
    } else if (ministryLower.includes('photo') || ministryLower.includes('doc')) {
      role = 'documentation';
    } else if (ministryLower.includes('reel') || ministryLower.includes('edit')) {
      role = 'reels_editor';
    }

    const newServer: Server = {
      id: `server-${Date.now()}`,
      name: applicant.name,
      email: applicant.email,
      password: applicant.password || 'media123',
      accessToken: applicant.password || 'media123',
      role: role,
      roles: [role],
      picture: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=300&q=80`,
      workImages: [
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
      ],
      isSubAdmin: false,
      isAdmin: false,
      birthday: 'January 1'
    };

    setServers(prev => [...prev, newServer]);
    setDoc(doc(db, 'users', newServer.id), cleanFirestorePayload(newServer)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${newServer.id}`));

    const updatedApp: Applicant = { ...applicant, status: 'approved' };
    setApplicants(prev => prev.map(a => a.id === applicant.id ? updatedApp : a));
    setDoc(doc(db, 'applicants', applicant.id), cleanFirestorePayload(updatedApp)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `applicants/${applicant.id}`));

    // Ensure account exists in Firebase Authentication
    await createFirebaseAuthAccount(applicant.email, applicant.password || 'media123').catch(console.warn);

    // Automatically trigger Firebase Password Reset email upon approval!
    resetUserPassword(applicant.email)
      .then(() => {
        console.log(`Password reset email sent via Firebase Auth to ${applicant.email}`);
      })
      .catch((e) => {
        console.warn("Firebase Auth password reset notice:", e);
      });

    alert(`Application approved for ${applicant.name}! User account provisioned in Auxiliadora Media Portal with email: ${applicant.email}. A password reset and verification email was dispatched.`);
  };

  const handleRejectApplicant = (id: string) => {
    const appToReject = applicants.find(a => a.id === id);
    if (appToReject) {
      const updated = { ...appToReject, status: 'rejected' as const };
      setApplicants(prev => prev.map(a => a.id === id ? updated : a));
      setDoc(doc(db, 'applicants', id), cleanFirestorePayload(updated)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `applicants/${id}`));
    }
  };

  const handleScheduleMeetingApplicant = (applicantId: string, meetingInfo: { dateTime: string; location: string; notes?: string }) => {
    const target = applicants.find(a => a.id === applicantId);
    if (target) {
      const cleanMeetingInfo = {
        dateTime: meetingInfo.dateTime || '',
        location: meetingInfo.location || '',
        notes: meetingInfo.notes || ''
      };
      const updated: Applicant = {
        ...target,
        status: 'under_review',
        meetingInfo: cleanMeetingInfo
      };
      setApplicants(prev => prev.map(a => a.id === applicantId ? updated : a));
      setDoc(doc(db, 'applicants', applicantId), cleanFirestorePayload(updated)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `applicants/${applicantId}`));
    }
  };

  const handleAddNote = (note: ServerNote) => {
    setNotes(prev => [note, ...prev]);
    setDoc(doc(db, 'server_notes', note.id), cleanFirestorePayload(note)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `server_notes/${note.id}`));
  };

  const handleUpdateNote = (note: ServerNote) => {
    setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    setDoc(doc(db, 'server_notes', note.id), cleanFirestorePayload(note)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `server_notes/${note.id}`));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    deleteDoc(doc(db, 'server_notes', noteId)).catch((err) => handleFirestoreError(err, OperationType.DELETE, `server_notes/${noteId}`));
  };

  const handleUpdatePassword = (serverId: string, newPass: string) => {
    setServers(prev => prev.map(s => {
      if (s.id === serverId) {
        const updated = {
          ...s,
          password: newPass,
          accessToken: newPass
        };
        setDoc(doc(db, 'users', s.id), cleanFirestorePayload(updated)).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${s.id}`));
        return updated;
      }
      return s;
    }));
  };

  const handleUpdateSiteSettings = (updated: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const merged = { ...prev, ...updated };
      setDoc(doc(db, 'settings', 'site_settings'), cleanFirestorePayload(merged)).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/site_settings'));
      try {
        localStorage.setItem('aux_site_settings', JSON.stringify(merged));
      } catch (e) {
        console.warn('LocalStorage write error:', e);
      }
      return merged;
    });
  };

  // ---------------------------------------------------------
  // RESIBO — FINANCIAL MANAGEMENT HANDLERS
  // ---------------------------------------------------------

  const handleAddContribution = (
    contribData: Omit<Contribution, 'id' | 'createdAt' | 'status'> & { proofImageUrl?: string }
  ) => {
    const newId = `contrib-${Date.now()}`;
    const newContrib: Contribution = {
      ...contribData,
      id: newId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setContributions(prev => [newContrib, ...prev]);
    setDoc(doc(db, 'contributions', newId), cleanFirestorePayload(newContrib)).catch(err =>
      handleFirestoreError(err, OperationType.WRITE, `contributions/${newId}`)
    );

    // Record in Financial Audit Log
    const auditId = `audit-fin-${Date.now()}`;
    const newAuditLog: FinancialAuditLog = {
      id: auditId,
      action: 'contribution_submitted',
      performedBy: currentUser ? currentUser.name : contribData.submittedBy,
      performedById: currentUser ? currentUser.id : contribData.submittedById,
      performedByRole: currentUser?.isAdmin ? 'admin' : currentUser?.isSubAdmin ? 'subadmin' : 'member',
      targetId: newId,
      targetType: 'contribution',
      amount: contribData.amount,
      description: `Submitted member contribution of ₱${contribData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${contribData.purpose}) - Pending Review`,
      timestamp: new Date().toISOString()
    };

    setFinancialAuditLogs(prev => [newAuditLog, ...prev]);
    setDoc(doc(db, 'financial_audit_logs', auditId), cleanFirestorePayload(newAuditLog)).catch(console.warn);
  };

  const handleApproveContribution = (contribId: string, note?: string) => {
    const isAuth = Boolean(currentUser?.isAdmin || currentUser?.isSubAdmin || currentUser?.isFinanceAdmin);
    if (!isAuth) {
      alert('Only Admins, Sub-Admins, or Finance Reviewers have permission to approve financial contributions.');
      return;
    }

    const target = contributions.find(c => c.id === contribId);
    if (!target) return;

    const userRoleLabel = currentUser.isAdmin ? 'Admin' : currentUser.isFinanceAdmin ? 'Finance Reviewer' : 'Sub-Admin';

    const updated: Contribution = {
      ...target,
      status: 'approved',
      reviewedBy: currentUser.id,
      reviewedByName: `${currentUser.name} (${userRoleLabel})`,
      reviewedAt: new Date().toISOString(),
      note: note ? (target.note ? `${target.note} [Approved: ${note}]` : note) : target.note
    };

    setContributions(prev => prev.map(c => c.id === contribId ? updated : c));
    setDoc(doc(db, 'contributions', contribId), cleanFirestorePayload(updated)).catch(err =>
      handleFirestoreError(err, OperationType.WRITE, `contributions/${contribId}`)
    );

    // Audit Log for Approval (Official Balance Increase)
    const auditId = `audit-fin-${Date.now()}`;
    const newAuditLog: FinancialAuditLog = {
      id: auditId,
      action: 'contribution_approved',
      performedBy: currentUser.name,
      performedById: currentUser.id,
      performedByRole: currentUser.isAdmin ? 'admin' : currentUser.isFinanceAdmin ? 'finance' : 'subadmin',
      targetId: contribId,
      targetType: 'contribution',
      amount: target.amount,
      description: `Verified and Approved contribution from ${target.submittedBy} (+₱${target.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
      timestamp: new Date().toISOString()
    };

    setFinancialAuditLogs(prev => [newAuditLog, ...prev]);
    setDoc(doc(db, 'financial_audit_logs', auditId), cleanFirestorePayload(newAuditLog)).catch(console.warn);
  };

  const handleRejectContribution = (contribId: string, reason?: string) => {
    const isAuth = Boolean(currentUser?.isAdmin || currentUser?.isSubAdmin || currentUser?.isFinanceAdmin);
    if (!isAuth) {
      alert('Only Admins, Sub-Admins, or Finance Reviewers have permission to reject financial contributions.');
      return;
    }

    const target = contributions.find(c => c.id === contribId);
    if (!target) return;

    const userRoleLabel = currentUser.isAdmin ? 'Admin' : currentUser.isFinanceAdmin ? 'Finance Reviewer' : 'Sub-Admin';

    const updated: Contribution = {
      ...target,
      status: 'rejected',
      rejectionReason: reason || 'Not verified',
      reviewedBy: currentUser.id,
      reviewedByName: `${currentUser.name} (${userRoleLabel})`,
      reviewedAt: new Date().toISOString()
    };

    setContributions(prev => prev.map(c => c.id === contribId ? updated : c));
    setDoc(doc(db, 'contributions', contribId), cleanFirestorePayload(updated)).catch(err =>
      handleFirestoreError(err, OperationType.WRITE, `contributions/${contribId}`)
    );

    // Audit Log for Rejection
    const auditId = `audit-fin-${Date.now()}`;
    const newAuditLog: FinancialAuditLog = {
      id: auditId,
      action: 'contribution_rejected',
      performedBy: currentUser.name,
      performedById: currentUser.id,
      performedByRole: currentUser.isAdmin ? 'admin' : currentUser.isFinanceAdmin ? 'finance' : 'subadmin',
      targetId: contribId,
      targetType: 'contribution',
      amount: target.amount,
      description: `Rejected contribution from ${target.submittedBy} (₱${target.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) - Reason: ${reason || 'Not verified'}`,
      timestamp: new Date().toISOString()
    };

    setFinancialAuditLogs(prev => [newAuditLog, ...prev]);
    setDoc(doc(db, 'financial_audit_logs', auditId), cleanFirestorePayload(newAuditLog)).catch(console.warn);
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    const isAuth = Boolean(currentUser?.isAdmin || currentUser?.isSubAdmin || currentUser?.isFinanceAdmin);
    if (!isAuth) {
      alert('Only Admins, Sub-Admins, or Finance Reviewers have permission to record disbursements & expenses.');
      return;
    }

    const newId = `exp-${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id: newId,
      timestamp: new Date().toISOString()
    };

    setExpenses(prev => [newExpense, ...prev]);
    setDoc(doc(db, 'expenses', newId), cleanFirestorePayload(newExpense)).catch(err =>
      handleFirestoreError(err, OperationType.WRITE, `expenses/${newId}`)
    );

    // Audit Log for Expense
    const auditId = `audit-fin-${Date.now()}`;
    const newAuditLog: FinancialAuditLog = {
      id: auditId,
      action: 'expense_added',
      performedBy: currentUser.name,
      performedById: currentUser.id,
      performedByRole: currentUser.isAdmin ? 'admin' : currentUser.isFinanceAdmin ? 'finance' : 'subadmin',
      targetId: newId,
      targetType: 'expense',
      amount: expenseData.amount,
      description: `Recorded disbursement for ${expenseData.category}: ₱${expenseData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${expenseData.item})`,
      timestamp: new Date().toISOString()
    };

    setFinancialAuditLogs(prev => [newAuditLog, ...prev]);
    setDoc(doc(db, 'financial_audit_logs', auditId), cleanFirestorePayload(newAuditLog)).catch(console.warn);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!expenseId) return;
    const target = expenses.find(e => e.id === expenseId);

    // Instant local state update
    setExpenses(prev => prev.filter(e => e.id !== expenseId));

    // Delete in Firestore
    deleteDoc(doc(db, 'expenses', expenseId)).catch(err => {
      console.warn('Firestore delete expense error:', err);
    });

    if (target) {
      const auditId = `audit-fin-${Date.now()}`;
      const newAuditLog: FinancialAuditLog = {
        id: auditId,
        action: 'expense_deleted',
        performedBy: currentUser?.name || 'Admin',
        performedById: currentUser?.id || 'admin-1',
        performedByRole: currentUser?.isAdmin ? 'admin' : currentUser?.isFinanceAdmin ? 'finance' : 'subadmin',
        targetId: expenseId,
        targetType: 'expense',
        amount: target.amount,
        description: `Deleted disbursement record for "${target.item}" (₱${target.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
        timestamp: new Date().toISOString()
      };
      setFinancialAuditLogs(prev => [newAuditLog, ...prev]);
      setDoc(doc(db, 'financial_audit_logs', auditId), cleanFirestorePayload(newAuditLog)).catch(console.warn);
    }
  };

  const handleClearAllExpenses = () => {
    const currentList = [...expenses];
    setExpenses([]);
    currentList.forEach(exp => {
      deleteDoc(doc(db, 'expenses', exp.id)).catch(console.warn);
    });

    if (currentList.length > 0) {
      const auditId = `audit-fin-${Date.now()}`;
      const totalAmount = currentList.reduce((sum, e) => sum + (e.amount || 0), 0);
      const newAuditLog: FinancialAuditLog = {
        id: auditId,
        action: 'expense_deleted',
        performedBy: currentUser?.name || 'Admin',
        performedById: currentUser?.id || 'admin-1',
        performedByRole: currentUser?.isAdmin ? 'admin' : currentUser?.isFinanceAdmin ? 'finance' : 'subadmin',
        targetId: 'all_expenses',
        targetType: 'expense',
        amount: totalAmount,
        description: `Removed all ${currentList.length} expenses totalling ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from the record`,
        timestamp: new Date().toISOString()
      };
      setFinancialAuditLogs(prev => [newAuditLog, ...prev]);
      setDoc(doc(db, 'financial_audit_logs', auditId), cleanFirestorePayload(newAuditLog)).catch(console.warn);
    }
  };

  const handleDeleteContribution = (contribId: string) => {
    if (!contribId) return;
    const target = contributions.find(c => c.id === contribId);

    // Instant local state update
    setContributions(prev => prev.filter(c => c.id !== contribId));

    // Delete in Firestore
    deleteDoc(doc(db, 'contributions', contribId)).catch(err => {
      console.warn('Firestore delete contribution error:', err);
    });

    // Audit Log for deleted contribution
    const auditId = `audit-fin-${Date.now()}`;
    const newAuditLog: FinancialAuditLog = {
      id: auditId,
      action: 'contribution_rejected',
      performedBy: currentUser?.name || 'Admin',
      performedById: currentUser?.id || 'admin-1',
      performedByRole: currentUser?.isAdmin ? 'admin' : currentUser?.isFinanceAdmin ? 'finance' : 'subadmin',
      targetId: contribId,
      targetType: 'contribution',
      amount: target ? target.amount : 0,
      description: `Deleted contribution record${target ? `: "${target.purpose}" (${target.submittedBy}, ₱${target.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})` : ''}`,
      timestamp: new Date().toISOString()
    };
    setFinancialAuditLogs(prev => [newAuditLog, ...prev]);
    setDoc(doc(db, 'financial_audit_logs', auditId), cleanFirestorePayload(newAuditLog)).catch(console.warn);
  };

  const handleRestoreDefaults = () => {
    if (confirm('Are you sure you want to reset all modifications back to default preset data?')) {
      localStorage.clear();
      setServers(DEFAULT_SERVERS);
      setSchedules(DEFAULT_SCHEDULES);
      setSubRequests([]);
      setReceipts([]);
      setAnnouncements(DEFAULT_ANNOUNCEMENTS);
      setApplicants([]);
      setSiteSettings(DEFAULT_SITE_SETTINGS);
      setCurrentUserId('admin-1');
      setActiveTab('dashboard');
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginScreen
        servers={servers}
        siteSettings={siteSettings}
        activeUserIds={activeUserIdsFromOtherSessions}
        onLoginSuccess={handleLoginSuccess}
        onRegisterApplicant={handleRegisterApplicant}
        onUpdateSiteSettings={handleUpdateSiteSettings}
        onUpdateServer={handleUpdateServer}
      />
    );
  }

  const pendingContributionsCount = useMemo(() => {
    return contributions.filter(c => c.status === 'pending').length;
  }, [contributions]);

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#d4e4fa] flex flex-col font-sans selection:bg-[#0b57d0]/30 selection:text-white bg-watermark">
      
      {/* Top Navigation Header */}
      <Header
        servers={servers}
        currentUser={currentUser}
        siteSettings={siteSettings}
        announcements={announcements}
        schedules={schedules}
        applicants={applicants}
        pendingContributionsCount={pendingContributionsCount}
        activeUserIds={activeUserIdsFromOtherSessions}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        onOpenReflectionModal={() => setShowReflectionModal(true)}
      />

      {/* Main App Layout Grid */}
      <div className="flex flex-1 relative">
        
        {/* Left Fixed Sidebar */}
        <Sidebar
          currentUser={currentUser}
          siteSettings={siteSettings}
          applicants={applicants}
          pendingContributionsCount={pendingContributionsCount}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewScheduleModal={() => setShowNewScheduleModal(true)}
          onOpenSettingsModal={() => setShowSettingsModal(true)}
          onOpenSupportModal={() => setShowSupportModal(true)}
        />

        {/* Main Stage View Area */}
        <main className="flex-1 min-w-0 lg:ml-[280px] p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              servers={servers}
              schedules={schedules}
              announcements={effectiveAnnouncements}
              soccomOfMonth={soccomOfMonth}
              onUpdateSoccomOfMonth={handleUpdateSoccomOfMonth}
              siteSettings={siteSettings}
              onUpdateSiteSettings={handleUpdateSiteSettings}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onOpenReflectionModal={() => setShowReflectionModal(true)}
              onOpenSwapModal={() => setShowSwapModal(true)}
              onNavigateToSchedule={() => setActiveTab('schedule')}
              subAdminAlerts={subAdminAlerts}
              auditRecords={auditRecords}
              onOpenSubAdminAudit={() => setShowSubAdminAuditModal(true)}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleBoard
              schedules={schedules}
              servers={servers}
              currentUser={currentUser}
              onUpdateSchedule={handleUpdateSchedule}
              onAddSchedule={handleAddSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onAddAnnouncement={handleAddAnnouncement}
              onOpenReflectionModal={() => setShowReflectionModal(true)}
              onOpenSwapModal={() => setShowSwapModal(true)}
              auditRecords={auditRecords}
              subAdminAlerts={subAdminAlerts}
              onOpenSubAdminAudit={() => setShowSubAdminAuditModal(true)}
              onSubmitReceipt={handleSaveReceipt}
            />
          )}

          {activeTab === 'workspace' && (
            <MyWorkspace
              currentUser={currentUser}
              schedules={schedules}
              servers={servers}
              subRequests={subRequests}
              auditRecords={auditRecords}
              receipts={receipts}
              onUpdateProfile={handleUpdateProfilePicture}
              onUpdateServer={handleUpdateServer}
              onSendSubRequest={handleSendSubRequest}
              onRespondSubRequest={handleRespondSubRequest}
              onSubmitReceipt={handleSaveReceipt}
            />
          )}


          {activeTab === 'community' && (
            <CommunityHub
              soccomOfMonth={soccomOfMonth}
              announcements={effectiveAnnouncements}
              currentUser={currentUser}
              servers={servers}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onUpdateSoccomOfMonth={handleUpdateSoccomOfMonth}
            />
          )}

          {activeTab === 'reflections' && (
            <ReflectionsView
              receipts={receipts}
              currentUser={currentUser}
              onOpenReflectionModal={() => setShowReflectionModal(true)}
            />
          )}

          {activeTab === 'notes' && (
            <NotesView
              notes={notes}
              currentUser={currentUser}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === 'resibo' && (
            <ResiboView
              currentUser={currentUser}
              servers={servers}
              contributions={contributions}
              expenses={expenses}
              auditLogs={financialAuditLogs}
              siteSettings={siteSettings}
              onAddContribution={handleAddContribution}
              onApproveContribution={handleApproveContribution}
              onRejectContribution={handleRejectContribution}
              onDeleteContribution={handleDeleteContribution}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onClearAllExpenses={handleClearAllExpenses}
            />
          )}

          {activeTab === 'admin' && (currentUser.isAdmin || currentUser.isSubAdmin) && (
            <AdminPanel
              servers={servers}
              schedules={schedules}
              receipts={receipts}
              soccomOfMonth={soccomOfMonth}
              applicants={applicants}
              siteSettings={siteSettings}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onAddServer={handleAddServer}
              onDeleteServer={handleDeleteServer}
              onDeleteReceipt={handleDeleteReceipt}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateSoccomOfMonth={handleUpdateSoccomOfMonth}
              onApproveApplicant={handleApproveApplicant}
              onRejectApplicant={handleRejectApplicant}
              onScheduleMeetingApplicant={handleScheduleMeetingApplicant}
              onUpdatePassword={handleUpdatePassword}
              onUpdateSiteSettings={handleUpdateSiteSettings}
              onUpdateServer={handleUpdateServer}
              currentUser={currentUser}
              activeSessions={activeSessions}
              subAdminAlerts={subAdminAlerts}
              auditRecords={auditRecords}
              onOpenSubAdminAudit={() => setShowSubAdminAuditModal(true)}
              onUpdateAuditStatus={handleUpdateAuditStatus}
              onRunAuditNow={handleRunScheduleAudit}
              onSubmitReceipt={handleSaveReceipt}
            />
          )}
        </main>

      </div>

      {/* Sub-Admin Attendance & Schedule Responsiveness Audit Modal */}
      <SubAdminAttendanceModal
        isOpen={showSubAdminAuditModal}
        onClose={() => setShowSubAdminAuditModal(false)}
        schedules={schedules}
        servers={servers}
        receipts={receipts}
        subRequests={subRequests}
        auditRecords={auditRecords}
        subAdminAlerts={subAdminAlerts}
        onUpdateAuditStatus={handleUpdateAuditStatus}
        onDismissAlert={handleDismissSubAdminAlert}
        onRunAuditNow={handleRunScheduleAudit}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer className="border-t border-[#46464c]/30 bg-[#051424] py-6 px-4 lg:pl-[300px]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[#909096] text-xs font-mono">
          <div>
            <p className="font-serif font-bold text-[#d4e4fa]">© 2026 {siteSettings.appName} Scheduling System</p>
            <p className="text-[10px] text-[#909096] mt-0.5">{siteSettings.parishName} • {siteSettings.footerText}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRestoreDefaults}
              className="hover:text-white transition-colors py-1 px-2.5 rounded border border-[#46464c]/40 bg-[#122131] hover:bg-[#1c2b3c] text-[#b2c5ff] font-sans font-semibold text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Reset Preset Defaults
            </button>
            <span className="text-[#46464c]">|</span>
            <span className="text-[#10b981] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping"></span>
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      <ModalsContainer
        showReflectionModal={showReflectionModal}
        onCloseReflectionModal={() => setShowReflectionModal(false)}
        onSubmitReflection={handleSubmitReflectionText}
        showSwapModal={showSwapModal}
        onCloseSwapModal={() => setShowSwapModal(false)}
        servers={servers}
        currentUser={currentUser}
        onSendSwapRequest={(targetId) => {
          if (schedules.length > 0 && schedules[0].slots.length > 0) {
            handleSendSubRequest({
              scheduleRowId: schedules[0].id,
              slotId: schedules[0].slots[0].id,
              role: currentUser.role,
              fromServerId: currentUser.id,
              toServerId: targetId
            });
            alert('Swap request sent to media member!');
          }
        }}
        showNewScheduleModal={showNewScheduleModal}
        onCloseNewScheduleModal={() => setShowNewScheduleModal(false)}
        onAddSchedule={handleAddSchedule}
        showSettingsModal={showSettingsModal}
        onCloseSettingsModal={() => setShowSettingsModal(false)}
        onUpdatePassword={handleUpdatePassword}
        showSupportModal={showSupportModal}
        onCloseSupportModal={() => setShowSupportModal(false)}
      />

      {/* Aesthetics Studio */}
      <AestheticsStudio theme={theme} onThemeChange={setTheme} />

      {/* Birthday Greeting Modal */}
      {birthdayCelebrantToShow && (
        <BirthdayGreetingModal
          celebrant={birthdayCelebrantToShow}
          isOpen={Boolean(birthdayCelebrantToShow)}
          onClose={() => setBirthdayCelebrantToShow(null)}
          isAdmin={Boolean(currentUser?.isAdmin || currentUser?.isSubAdmin)}
          onSendBirthdayEmail={async () => {
            try {
              const resp = await fetch('/api/dispatch-birthdays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ servers: [birthdayCelebrantToShow] })
              });
              const data = await resp.json().catch(() => ({}));
              if (data.success) {
                alert(`🎂 Birthday blessing email sent to ${birthdayCelebrantToShow.name} (${birthdayCelebrantToShow.email})!`);
              } else {
                alert(`Notice: ${data.error || 'Email dispatched or already sent today.'}`);
              }
            } catch (e) {
              console.error('Failed to trigger birthday email:', e);
              alert('Could not dispatch birthday email at this moment.');
            }
          }}
        />
      )}
    </div>
  );
}
