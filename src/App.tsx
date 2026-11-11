import React, { useState, useEffect } from 'react';
import {
  DaySchedule,
  FeedbackItem,
  MealAttendanceRecord,
  MealType,
  Student,
  TimetableDocument,
} from './types';
import { Storage } from './utils/storage';
import { getIsoDateString, hasMarkedAttendance, HOSTEL_CAPACITY } from './utils/messLogic';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/auth/LandingPage';
import { RegisterModal } from './components/auth/RegisterModal';
import { LoginModal } from './components/auth/LoginModal';
import { StudentHome } from './components/student/StudentHome';
import { MessTimetable } from './components/student/MessTimetable';
import { FeedbackSuggestions } from './components/student/FeedbackSuggestions';
import { MyProfile } from './components/student/MyProfile';
import { ContactUs } from './components/student/ContactUs';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  // Load persistent application state
  const [students, setStudents] = useState<Student[]>(() => Storage.getStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<MealAttendanceRecord[]>(() =>
    Storage.getAttendance()
  );
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(() =>
    Storage.getFeedback()
  );
  const [timetableDocs, setTimetableDocs] = useState<TimetableDocument[]>(() =>
    Storage.getDocuments()
  );
  const [weeklyTimetable, setWeeklyTimetable] = useState<DaySchedule[]>(() =>
    Storage.getWeeklyTimetable()
  );

  // Authentication & Session State
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(() =>
    Storage.getCurrentUserId()
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => Storage.isAdminLoggedIn());

  // UI Flow State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'student' | 'admin' | 'forgot'>('student');
  const [loggedInAdminName, setLoggedInAdminName] = useState<string>('Amrendra Krishna');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Synchronize storage whenever state updates
  useEffect(() => {
    Storage.saveStudents(students);
  }, [students]);

  useEffect(() => {
    Storage.saveAttendance(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    Storage.saveFeedback(feedbackList);
  }, [feedbackList]);

  useEffect(() => {
    Storage.saveDocuments(timetableDocs);
  }, [timetableDocs]);

  useEffect(() => {
    Storage.saveWeeklyTimetable(weeklyTimetable);
  }, [weeklyTimetable]);

  useEffect(() => {
    Storage.setCurrentUserId(currentStudentId);
  }, [currentStudentId]);

  useEffect(() => {
    Storage.setAdminLoggedIn(isAdmin);
  }, [isAdmin]);

  // Active student entity
  const currentStudent = students.find((s) => s.id === currentStudentId) || null;

  // Mark meal attendance action
  const handleMarkAttendance = (meal: MealType) => {
    if (!currentStudent) return;
    const todayStr = getIsoDateString();

    if (hasMarkedAttendance(attendanceRecords, currentStudent.id, meal, todayStr)) {
      return;
    }

    const newRecord: MealAttendanceRecord = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      scholarNumber: currentStudent.scholarNumber,
      wing: currentStudent.wing,
      date: todayStr,
      meal,
      timestamp: new Date().toISOString(),
      verifiedBy: 'Student Portal Biometric/Pass',
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
  };

  // Submit feedback action
  const handleSubmitFeedback = (
    feedbackData: Omit<FeedbackItem, 'id' | 'createdAt' | 'status'>
  ) => {
    const newFeedback: FeedbackItem = {
      ...feedbackData,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Under Review',
    };

    setFeedbackList((prev) => [newFeedback, ...prev]);
  };

  // Student Profile update action
  const handleUpdateProfile = (updatedProps: Partial<Student>) => {
    if (!currentStudent) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === currentStudent.id ? { ...s, ...updatedProps } : s))
    );
  };

  // Admin student status update
  const handleUpdateStudentStatus = (studentId: string, status: 'active' | 'disabled') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  // Admin feedback status update
  const handleUpdateFeedbackStatus = (
    feedbackId: string,
    status: 'Reviewed' | 'Resolved',
    notes?: string
  ) => {
    setFeedbackList((prev) =>
      prev.map((f) =>
        f.id === feedbackId
          ? { ...f, status, adminNotes: notes || f.adminNotes }
          : f
      )
    );
  };

  // Timetable upload
  const handleUploadTimetableDoc = (doc: TimetableDocument) => {
    setTimetableDocs((prev) => [doc, ...prev]);
  };

  // Timetable schedule update
  const handleUpdateTimetableSchedule = (newSchedule: DaySchedule[]) => {
    setWeeklyTimetable(newSchedule);
  };

  // Auth Handlers
  const handleRegisterSuccess = (newStudent: Student) => {
    // Strictly prohibit double registration with the same email ID
    const isDuplicate = students.some(
      (s) => s.email.trim().toLowerCase() === newStudent.email.trim().toLowerCase()
    );
    if (isDuplicate) {
      return;
    }

    // Enforce 600 registrations maximum ceiling
    if (students.length >= HOSTEL_CAPACITY.maxRegistrationLimit) {
      return;
    }

    setStudents((prev) => [newStudent, ...prev]);
    setCurrentStudentId(newStudent.id);
    setIsAdmin(false);
    setActiveTab('home');
  };

  const handleStudentLoginSuccess = (student: Student) => {
    setCurrentStudentId(student.id);
    setIsAdmin(false);
    setActiveTab('home');
  };

  const handleResetPassword = (email: string, newPass: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.email.toLowerCase() === email.toLowerCase() ? { ...s, password: newPass } : s
      )
    );
  };

  const handleAdminLoginSuccess = (adminName?: string) => {
    setIsAdmin(true);
    if (adminName) {
      setLoggedInAdminName(adminName);
    }
    setCurrentStudentId(null);
  };

  const handleLogout = () => {
    setCurrentStudentId(null);
    setIsAdmin(false);
    setActiveTab('landing');
  };

  // Demo Login Quick Handlers
  const handleDemoStudentLogin = (scholarNumber: string) => {
    const student = students.find((s) => s.scholarNumber === scholarNumber);
    if (student) {
      handleStudentLoginSuccess(student);
    }
  };

  const handleDemoAdminLogin = () => {
    setLoginModalMode('admin');
    setIsLoginOpen(true);
  };

  const handleClearAllStudents = () => {
    Storage.clearAllStudents();
    setStudents([]);
    setAttendanceRecords([]);
    setFeedbackList([]);
    setCurrentStudentId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar */}
      <Navbar
        adminName={loggedInAdminName}
        currentStudent={currentStudent}
        isAdmin={isAdmin}
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenLogin={() => {
          setLoginModalMode('student');
          setIsLoginOpen(true);
        }}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onToggleAdmin={() => {
          if (isAdmin) {
            setIsAdmin(false);
          } else {
            setLoginModalMode('admin');
            setIsLoginOpen(true);
          }
        }}
      />

      {/* Main View Area */}
      {isAdmin ? (
        /* Separate Private Admin Dashboard */
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AdminDashboard
            adminName={loggedInAdminName}
            students={students}
            attendanceRecords={attendanceRecords}
            feedbackList={feedbackList}
            timetableDocs={timetableDocs}
            weeklyTimetable={weeklyTimetable}
            onUpdateStudentStatus={handleUpdateStudentStatus}
            onUpdateFeedbackStatus={handleUpdateFeedbackStatus}
            onUploadTimetableDoc={handleUploadTimetableDoc}
            onUpdateTimetableSchedule={handleUpdateTimetableSchedule}
            onClearAllStudents={handleClearAllStudents}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onSwitchToStudentView={() => {
              if (students.length > 0) {
                handleStudentLoginSuccess(students[0]);
              } else {
                setIsRegisterOpen(true);
              }
            }}
          />
        </main>
      ) : !currentStudent || activeTab === 'landing' ? (
        /* Welcome / Landing Page */
        <main className="flex-1">
          <LandingPage
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onDemoLoginStudent={handleDemoStudentLogin}
            onDemoLoginAdmin={handleDemoAdminLogin}
          />
        </main>
      ) : (
        /* Authenticated Student Portal with Stack Overflow style Sidebar */
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            activeTab={activeTab}
            onNavigate={(tab) => setActiveTab(tab)}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            currentStudent={currentStudent}
            onLogout={handleLogout}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            {activeTab === 'home' && (
              <StudentHome
                currentStudent={currentStudent}
                attendanceRecords={attendanceRecords}
                onMarkAttendance={handleMarkAttendance}
                weeklyTimetable={weeklyTimetable}
              />
            )}

            {activeTab === 'timetable' && (
              <MessTimetable
                schedule={weeklyTimetable}
                documents={timetableDocs}
                isAdmin={isAdmin}
                onUploadDocument={handleUploadTimetableDoc}
              />
            )}

            {activeTab === 'feedback' && (
              <FeedbackSuggestions
                currentStudent={currentStudent}
                feedbackList={feedbackList}
                onSubmitFeedback={handleSubmitFeedback}
              />
            )}

            {activeTab === 'profile' && (
              <MyProfile
                student={currentStudent}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {activeTab === 'contact' && <ContactUs />}
          </main>
        </div>
      )}

      {/* Modals */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        existingStudents={students}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleStudentLoginSuccess}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onSwitchToRegister={() => setIsRegisterOpen(true)}
        onResetPassword={handleResetPassword}
        students={students}
        initialMode={loginModalMode}
      />

    </div>
  );
}
