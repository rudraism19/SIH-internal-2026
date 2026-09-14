/**
 * Multi-User Scoped Chat Session Storage Service
 * Isolates and persists conversation archives per authenticated user account.
 */

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  imageData?: string | null;
  timestamp: string;
  verified?: boolean;
  grounded?: boolean;
  response_mode?: string;
  product?: string | null;
  standards?: any[];
  sections?: any[];
  next_question?: string | null;
  actions?: any[];
  identified_standards?: any[];
  citations?: any[];
  compliance_info?: any | null;
  testing_info?: any | null;
  customs_info?: any | null;
  renewal_info?: any | null;
  batch_info?: any | null;
  hallmarking_info?: any | null;
  next_steps?: string[];
  audio_base64?: string | null;
  audio_format?: string | null;
  detected_language?: string | null;
  timings?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userEmail: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  lastPreview?: string;
}

export interface SessionGroup {
  label: string;
  sessions: ChatSession[];
}

export function normalizeUserKey(email?: string | null): string {
  if (!email || !email.trim()) return 'guest_user';
  return email.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
}

export function getUserStorageKey(email?: string | null): string {
  return 'bis_saarthi_user_sessions_' + normalizeUserKey(email);
}

export function getActiveSessionIdKey(email?: string | null): string {
  return 'bis_saarthi_active_session_id_' + normalizeUserKey(email);
}

export function generateSessionTitle(firstQuery: string, hasImage: boolean = false): string {
  if (hasImage && (!firstQuery || firstQuery.trim().length < 4)) {
    return 'ISI Mark / Label Inspection';
  }
  const clean = (firstQuery || '').trim().replace(/^###?\s*/, '').replace(/[?.,!]+$/, '');
  if (!clean) return 'New Consultation';
  if (clean.length <= 38) return clean;
  return clean.substring(0, 36) + '...';
}

export function createNewSession(email?: string | null, customTitle?: string): ChatSession {
  const now = new Date().toISOString();
  const user = email ? email.trim() : 'officer@bis.gov.in';
  return {
    id: 'bis-session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    userEmail: user,
    title: customTitle || 'New Consultation',
    createdAt: now,
    updatedAt: now,
    messages: [],
    lastPreview: 'Ready for statutory BIS consultation',
  };
}

export function getUserSessions(email?: string | null): ChatSession[] {
  try {
    const raw = localStorage.getItem(getUserStorageKey(email));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load user chat sessions from localStorage:', err);
  }
  return [];
}

export function saveUserSessions(email: string | null, sessions: ChatSession[]): void {
  try {
    const key = getUserStorageKey(email);
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (err) {
    console.warn('LocalStorage save error, attempting quota safety cleanup:', err);
    try {
      const lightened = sessions.map((sess, idx) => {
        if (idx === 0) return sess;
        return {
          ...sess,
          messages: sess.messages.slice(-20).map((m) => {
            if (m.imageData && m.imageData.length > 50000) {
              return { ...m, imageData: undefined };
            }
            return m;
          }),
        };
      });
      localStorage.setItem(getUserStorageKey(email), JSON.stringify(lightened));
    } catch (innerErr) {
      console.error('Critical quota exceeded in localStorage:', innerErr);
    }
  }
}

export function getActiveSessionId(email?: string | null): string | null {
  try {
    return localStorage.getItem(getActiveSessionIdKey(email));
  } catch {
    return null;
  }
}

export function setActiveSessionId(email: string | null, sessionId: string): void {
  try {
    localStorage.setItem(getActiveSessionIdKey(email), sessionId);
  } catch (err) {
    console.warn('Failed to persist active session ID:', err);
  }
}

export function upsertSession(email: string | null, session: ChatSession): ChatSession[] {
  const sessions = getUserSessions(email);
  const idx = sessions.findIndex((s) => s.id === session.id);
  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
    lastPreview:
      session.messages.length > 0
        ? session.messages[session.messages.length - 1].text.substring(0, 60)
        : session.lastPreview || 'New consultation',
  };

  let newSessions: ChatSession[];
  if (idx >= 0) {
    newSessions = [
      updatedSession,
      ...sessions.filter((s) => s.id !== session.id),
    ];
  } else {
    newSessions = [updatedSession, ...sessions];
  }

  saveUserSessions(email, newSessions);
  setActiveSessionId(email, updatedSession.id);
  return newSessions;
}

export function deleteUserSession(email: string | null, sessionId: string): ChatSession[] {
  const sessions = getUserSessions(email);
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveUserSessions(email, filtered);
  return filtered;
}

export function renameUserSession(email: string | null, sessionId: string, newTitle: string): ChatSession[] {
  const sessions = getUserSessions(email);
  const updated = sessions.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim() || s.title } : s));
  saveUserSessions(email, updated);
  return updated;
}

export function clearAllUserSessions(email: string | null): void {
  try {
    localStorage.removeItem(getUserStorageKey(email));
    localStorage.removeItem(getActiveSessionIdKey(email));
  } catch (err) {
    console.warn('Failed to clear sessions:', err);
  }
}

export function groupSessionsByDate(sessions: ChatSession[]): SessionGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const todaySessions: ChatSession[] = [];
  const yesterdaySessions: ChatSession[] = [];
  const pastWeekSessions: ChatSession[] = [];
  const olderSessions: ChatSession[] = [];

  for (const s of sessions) {
    const d = new Date(s.updatedAt || s.createdAt);
    if (d >= today) {
      todaySessions.push(s);
    } else if (d >= yesterday) {
      yesterdaySessions.push(s);
    } else if (d >= sevenDaysAgo) {
      pastWeekSessions.push(s);
    } else {
      olderSessions.push(s);
    }
  }

  const groups: SessionGroup[] = [];
  if (todaySessions.length) groups.push({ label: 'Today', sessions: todaySessions });
  if (yesterdaySessions.length) groups.push({ label: 'Yesterday', sessions: yesterdaySessions });
  if (pastWeekSessions.length) groups.push({ label: 'Previous 7 Days', sessions: pastWeekSessions });
  if (olderSessions.length) groups.push({ label: 'Older', sessions: olderSessions });

  return groups;
}
