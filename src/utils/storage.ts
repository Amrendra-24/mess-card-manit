import { DaySchedule, FeedbackItem, MealAttendanceRecord, Student, TimetableDocument } from '../types';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_FEEDBACK,
  INITIAL_STUDENTS,
  INITIAL_TIMETABLE_DOCS,
  WEEKLY_MESS_TIMETABLE,
} from '../data/mockData';

const STORAGE_KEYS = {
  STUDENTS: 'manit_h10_students_v4_clean',
  ATTENDANCE: 'manit_h10_attendance_v4_clean',
  FEEDBACK: 'manit_h10_feedback_v4_clean',
  DOCUMENTS: 'manit_h10_docs_v3',
  TIMETABLE: 'manit_h10_timetable_v5',
  CURRENT_USER_ID: 'manit_h10_curr_user_v4',
  ADMIN_SESSION: 'manit_h10_admin_sess_v1',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Storage load failed for ${key}, falling back to default`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Storage save failed for ${key}`, err);
  }
}

export const Storage = {
  getStudents: (): Student[] => safeGet(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS),
  saveStudents: (students: Student[]) => safeSet(STORAGE_KEYS.STUDENTS, students),
  clearAllStudents: () => {
    safeSet(STORAGE_KEYS.STUDENTS, []);
    safeSet(STORAGE_KEYS.ATTENDANCE, []);
    safeSet(STORAGE_KEYS.FEEDBACK, []);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch {
      // ignore
    }
  },

  getAttendance: (): MealAttendanceRecord[] => safeGet(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS),
  saveAttendance: (records: MealAttendanceRecord[]) => safeSet(STORAGE_KEYS.ATTENDANCE, records),

  getFeedback: (): FeedbackItem[] => safeGet(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK),
  saveFeedback: (feedback: FeedbackItem[]) => safeSet(STORAGE_KEYS.FEEDBACK, feedback),

  getDocuments: (): TimetableDocument[] => safeGet(STORAGE_KEYS.DOCUMENTS, INITIAL_TIMETABLE_DOCS),
  saveDocuments: (docs: TimetableDocument[]) => safeSet(STORAGE_KEYS.DOCUMENTS, docs),

  getWeeklyTimetable: (): DaySchedule[] => safeGet(STORAGE_KEYS.TIMETABLE, WEEKLY_MESS_TIMETABLE),
  saveWeeklyTimetable: (schedule: DaySchedule[]) => safeSet(STORAGE_KEYS.TIMETABLE, schedule),

  getCurrentUserId: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;
    } catch {
      return null;
    }
  },
  setCurrentUserId: (id: string | null) => {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
    } catch (err) {
      console.warn(err);
    }
  },

  isAdminLoggedIn: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
    } catch {
      return false;
    }
  },
  setAdminLoggedIn: (val: boolean) => {
    try {
      if (val) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      }
    } catch (err) {
      console.warn(err);
    }
  },

  // Reset to default seeds helper
  resetToDefaults: () => {
    try {
      localStorage.clear();
    } catch (err) {
      console.warn(err);
    }
  },
};
