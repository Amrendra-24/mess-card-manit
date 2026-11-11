import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  UtensilsCrossed,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Download,
  Upload,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  Building,
  Eye,
  Edit2,
  Save,
  X,
  BarChart3,
  Calendar,
  CalendarDays,
  Plus,
  Trash2,
  Check,
  Sparkles,
  RotateCcw,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Cloud,
} from 'lucide-react';
import { WEEKLY_MESS_TIMETABLE } from '../../data/mockData';
import {
  DaySchedule,
  FeedbackItem,
  HostelWing,
  MealAttendanceRecord,
  MealType,
  Student,
  TimetableDocument,
} from '../../types';
import {
  calculateAdminStats,
  calculateMonthlyProvisioningStats,
  formatIndianDate,
  generateAttendanceCsv,
  generateBillingAttendanceCsv,
  getIsoDateString,
} from '../../utils/messLogic';
import { GoogleDriveManager } from './GoogleDriveManager';

const POPULAR_DISH_SUGGESTIONS: Record<MealType, string[]> = {
  breakfast: [
    'Poha Jalebi',
    'Aloo Paratha & Dahi',
    'Uttapam & Chutney',
    'Dosa Sambar',
    'Chai / Dudh',
    'Sprouts',
    '2 Banana / 2 Eggs',
    'Corn Flakes',
    'Bread Butter Jam',
  ],
  lunch: [
    'Rajma, Rice',
    'Chole, Rice',
    'Kadahi Paneer',
    'Kadhi Pakoda, Rice',
    'Soya Chunks & Dal',
    'Sev Tamatar',
    'Cucumber Raita',
    'Boondi Raita',
    'Ghee Roti & Dal',
    'Achar & Fresh Salad',
  ],
  snacks: [
    'Samosa & Tea',
    'Dhokla / Pani Puri',
    'Aloo Tikki Chaat',
    'Pakora / Bhajiya',
    'Pasta & Tea',
    'Vada Pav',
    'Green & Tomato Chutney',
  ],
  dinner: [
    'Butter Paneer Masala',
    'Kadahi Chicken',
    'Egg Curry',
    'Dal Makhni',
    'Veg Biryani',
    'Palak Paneer',
    'Desi Ghee Roti',
    'Hot Gulab Jamun',
    'Kheer',
    'Ice Cream',
  ],
};

interface AdminDashboardProps {
  adminName: string;
  students: Student[];
  attendanceRecords: MealAttendanceRecord[];
  feedbackList: FeedbackItem[];
  timetableDocs: TimetableDocument[];
  weeklyTimetable: DaySchedule[];
  onUpdateStudentStatus: (studentId: string, status: 'active' | 'disabled') => void;
  onUpdateFeedbackStatus: (feedbackId: string, status: 'Reviewed' | 'Resolved', notes?: string) => void;
  onUploadTimetableDoc: (doc: TimetableDocument) => void;
  onUpdateTimetableSchedule: (schedule: DaySchedule[]) => void;
  onSwitchToStudentView: () => void;
  onClearAllStudents?: () => void;
  onOpenRegister?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminName,
  students,
  attendanceRecords,
  feedbackList,
  timetableDocs,
  weeklyTimetable,
  onUpdateStudentStatus,
  onUpdateFeedbackStatus,
  onUploadTimetableDoc,
  onUpdateTimetableSchedule,
  onSwitchToStudentView,
  onClearAllStudents,
  onOpenRegister,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'reports' | 'students' | 'timetable' | 'specialDinner' | 'feedback' | 'googleDrive'
  >('overview');

  const [hostSelectedDay, setHostSelectedDay] = useState<DaySchedule['day']>('Sunday');

  const todayStr = getIsoDateString();
  const formattedToday = formatIndianDate();

  // Admin Overview Statistics
  const adminStats = calculateAdminStats(attendanceRecords, students, todayStr);

  // Monthly Provisioning & Billing Statistics
  const currentYearMonth = todayStr.slice(0, 7); // e.g. "2026-11"
  const [selectedProvisioningMonth, setSelectedProvisioningMonth] = useState<string>(currentYearMonth);
  const monthlyStats = calculateMonthlyProvisioningStats(
    attendanceRecords,
    students,
    selectedProvisioningMonth
  );

  // Reports Filters
  const [reportDate, setReportDate] = useState<string>(todayStr);
  const [reportMeal, setReportMeal] = useState<string>('all');
  const [reportWing, setReportWing] = useState<string>('all');
  const [reportSearch, setReportSearch] = useState<string>('');

  // Student Directory Filter
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentWingFilter, setStudentWingFilter] = useState<string>('all');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Feedback Filter
  const [feedbackMealFilter, setFeedbackMealFilter] = useState<string>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>('all');
  const [adminNoteInput, setAdminNoteInput] = useState<{ [id: string]: string }>({});

  // Timetable & Meal Editor State (Particular Meal OR Full Day on Any Day)
  const [editingDay, setEditingDay] = useState<DaySchedule['day']>('Monday');
  const [mealEditScope, setMealEditScope] = useState<'particular' | 'full_day'>('particular');
  const [selectedParticularMeal, setSelectedParticularMeal] = useState<MealType>('lunch');
  const [newDishInput, setNewDishInput] = useState<string>('');
  const [editScheduleState, setEditScheduleState] = useState<DaySchedule[]>(weeklyTimetable);
  const [timetableSaveMsg, setTimetableSaveMsg] = useState<string | null>(null);
  const [isQuickMealModalOpen, setIsQuickMealModalOpen] = useState(false);

  useEffect(() => {
    setEditScheduleState(weeklyTimetable);
  }, [weeklyTimetable]);

  // Filter Attendance Records for Reports
  const filteredAttendance = attendanceRecords.filter((rec) => {
    if (reportDate && rec.date !== reportDate) return false;
    if (reportMeal !== 'all' && rec.meal !== reportMeal) return false;
    if (reportWing !== 'all' && rec.wing !== reportWing) return false;
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      return (
        rec.studentName.toLowerCase().includes(q) ||
        rec.scholarNumber.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter Students
  const filteredStudents = students.filter((s) => {
    if (studentWingFilter !== 'all' && s.wing !== studentWingFilter) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.scholarNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.roomNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // High Concurrency Pagination: enables smooth rendering of up to 2,000 students
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentPageSize, setStudentPageSize] = useState<number>(25);

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, studentWingFilter]);

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * studentPageSize,
    studentPage * studentPageSize
  );

  // Filter Feedback
  const filteredFeedback = feedbackList.filter((f) => {
    if (feedbackMealFilter !== 'all' && f.meal !== feedbackMealFilter) return false;
    if (feedbackStatusFilter !== 'all' && f.status !== feedbackStatusFilter) return false;
    return true;
  });

  // Handle Export CSV
  const handleExportCsv = () => {
    const csvContent = generateAttendanceCsv(filteredAttendance);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MANIT_Hostel10_Attendance_Report_${reportDate || 'All'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Download Complete Attendance & Billing CSV
  const handleDownloadBillingAttendanceCsv = () => {
    const csvContent = generateBillingAttendanceCsv(attendanceRecords, students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MANIT_Hostel10_Attendance_Billing_${selectedProvisioningMonth || todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Timetable & Meal Saves (Particular Meal or Full Day)
  const handleSaveTimetable = () => {
    onUpdateTimetableSchedule(editScheduleState);
    setTimetableSaveMsg('Timetable updated successfully! Changes are live across all student dashboards.');
    setTimeout(() => setTimetableSaveMsg(null), 3500);
  };

  const handleSaveSingleMeal = (day: DaySchedule['day'], meal: MealType) => {
    onUpdateTimetableSchedule(editScheduleState);
    const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1);
    setTimetableSaveMsg(`✓ Successfully saved ${mealLabel} for ${day}! Live across all student dashboards.`);
    setTimeout(() => setTimetableSaveMsg(null), 3500);
  };

  const handleSaveFullDay = (day: DaySchedule['day']) => {
    onUpdateTimetableSchedule(editScheduleState);
    setTimetableSaveMsg(`✓ Successfully saved all 4 meals for ${day}! Live across all student dashboards.`);
    setTimeout(() => setTimetableSaveMsg(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Private Administrative Dashboard · Role-Based Access Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Hostel 10 C/D Mess Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authorized session for <strong className="text-amber-300 font-bold">{adminName || 'Amrendra Krishna'}</strong> · Chief Warden, Mess Warden & Committee Secretaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveAdminTab('timetable')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
            title="Change any particular meal or full day schedule on any day"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-blue-200" />
            <span>+ Change Any Meal / Full Day</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('specialDinner')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
            title="Declare Special Dinner for any day of the week (Host Privilege)"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>+ Host Add Special Dinner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('googleDrive')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
            title="Backup & Store Student Photos & Records in Google One / Google Drive (website data mess)"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-200" />
            <span>Google One Storage</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadBillingAttendanceCsv}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
            title="Download current attendance records as CSV file for record-keeping and billing"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span>Download Attendance CSV (Billing & Records)</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToStudentView}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Preview Student Dashboard
          </button>
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Today</span>
            <span className="text-xs font-bold text-white">{formattedToday}</span>
          </div>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveAdminTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'overview'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Daily & Live Statistics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'reports'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Attendance Reports & CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('students')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'students'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Directory (582 Base · {students.length}/2,000 Registered)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('timetable')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'timetable'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Timetable & Uploads</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('specialDinner')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'specialDinner'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-900 bg-amber-50/70 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Special Dinner (Host Only)</span>
          {editScheduleState.some((s) => s.specialOccasion?.isActive) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {editScheduleState.filter((s) => s.specialOccasion?.isActive).length} Active
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'feedback'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Student Feedback ({feedbackList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('googleDrive')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeAdminTab === 'googleDrive'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>Google One / Drive (website data mess)</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW & LIVE STATISTICS ================= */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* A. Daily Mess Attendance Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                Total Hostel Students
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1 tabular-nums">
                {adminStats.totalStudents}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">582 Base · Concurrency to 2,000</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider block">
                Hostel 10 Wing C
              </span>
              <div className="text-2xl font-extrabold text-blue-800 font-mono mt-1 tabular-nums">
                {adminStats.hostel10CCount}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Wing 10C students</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-cyan-600 tracking-wider block">
                Hostel 10 Wing D
              </span>
              <div className="text-2xl font-extrabold text-cyan-800 font-mono mt-1 tabular-nums">
                {adminStats.hostel10DCount}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Wing 10D students</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider block">
                Breakfast Attendance
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 tabular-nums">
                {adminStats.breakfast.total}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Taken today</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider block">
                Lunch Attendance
              </span>
              <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1 tabular-nums">
                {adminStats.lunch.total}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Taken today</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">
                Snacks Attendance
              </span>
              <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1 tabular-nums">
                {adminStats.snacks.total}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Taken today</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider block">
                Dinner Attendance
              </span>
              <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-1 tabular-nums">
                {adminStats.dinner.total}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Taken today</span>
            </div>
          </div>

          {/* B. Live Attendance Statistics Comparison (10C vs 10D) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Live Attendance Statistics by Wing & Meal (Today)
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time student headcount across Hostel 10 Wing C (291 students) and Wing D (291 students) · Total 582 Students.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Hostel 10C (291)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-cyan-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  Hostel 10D (291)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lunch Live Card */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    Lunch Live Attendance
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Total: {adminStats.lunch.total} / 582 Students
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Hostel 10C: {adminStats.lunch.wing10C} / {adminStats.hostel10CCount} students</span>
                      <span className="font-mono text-slate-500">
                        {adminStats.lunch.percent10C}% of wing
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, adminStats.lunch.percent10C)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Hostel 10D: {adminStats.lunch.wing10D} / {adminStats.hostel10DCount} students</span>
                      <span className="font-mono text-slate-500">
                        {adminStats.lunch.percent10D}% of wing
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, adminStats.lunch.percent10D)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Counters: 1 & 2 (Wing 10C · 291 students) · Counters 3 & 4 (Wing 10D · 291 students)
                </div>
              </div>

              {/* Breakfast Card */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    Breakfast Attendance
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Total: {adminStats.breakfast.total} / 582 Students
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Hostel 10C: {adminStats.breakfast.wing10C} / {adminStats.hostel10CCount} students</span>
                      <span className="font-mono text-slate-500">
                        {adminStats.breakfast.percent10C}% of wing
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, adminStats.breakfast.percent10C)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Hostel 10D: {adminStats.breakfast.wing10D} / {adminStats.hostel10DCount} students</span>
                      <span className="font-mono text-slate-500">
                        {adminStats.breakfast.percent10D}% of wing
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, adminStats.breakfast.percent10D)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Completed morning session (07:30 – 09:30 AM)
                </div>
              </div>
            </div>
          </div>

          {/* ================= B. MONTHLY MEALS SERVED BY TYPE & MESS PROVISIONING ================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-blue-200/60">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-blue-700" />
                  Mess Provisioning & Procurement Analytics
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Monthly Meals Served by Type ({monthlyStats.monthName})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                  Calculates total meals served by category (Breakfast, Lunch, Snacks, Dinner) for the month to estimate bulk ration consumption and assist in store provisioning.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Month Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={selectedProvisioningMonth}
                    onChange={(e) => setSelectedProvisioningMonth(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="2026-11">November 2026 (Current)</option>
                    <option value="2026-10">October 2026</option>
                    <option value="2026-09">September 2026</option>
                    <option value="2026-08">August 2026</option>
                  </select>
                </div>

                {/* Download Attendance & Billing CSV Button */}
                <button
                  type="button"
                  onClick={handleDownloadBillingAttendanceCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                  title="Download complete attendance records as CSV for billing & record-keeping"
                >
                  <Download className="w-4 h-4 text-emerald-100" />
                  <span>Download Attendance CSV (Billing & Records)</span>
                </button>
              </div>
            </div>

            {/* Monthly High-Level Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Meals This Month
                </span>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  {monthlyStats.totalMealsServed}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Across all 4 meal sessions
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Active Dining Days
                </span>
                <div className="text-2xl font-extrabold text-blue-800 font-mono mt-1">
                  {monthlyStats.activeDaysRecorded}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Logged in {monthlyStats.monthName}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Avg. Meals Per Day
                </span>
                <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                  {Math.round(monthlyStats.totalMealsServed / Math.max(1, monthlyStats.activeDaysRecorded))}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Daily total dining volume
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">
                  Resident Strength
                </span>
                <div className="text-2xl font-extrabold text-purple-800 font-mono mt-1">
                  582
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Wing C: 291 · Wing D: 291
                </span>
              </div>
            </div>

            {/* 4 Cards: Meals Served by Type for the Current Month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Breakfast */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      ☕
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Breakfast</h4>
                      <span className="text-[10px] text-emerald-700 font-semibold">07:30 – 09:30 AM</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                    {monthlyStats.breakfast.percentage}% Vol
                  </span>
                </div>

                <div className="border-t border-emerald-200/60 pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Served:</span>
                    <strong className="font-mono text-emerald-950 font-bold text-sm">
                      {monthlyStats.breakfast.total} meals
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing C:</span>
                    <span className="font-mono">{monthlyStats.breakfast.wing10C}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing D:</span>
                    <span className="font-mono">{monthlyStats.breakfast.wing10D}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-100 font-semibold">
                    <span>Daily Average:</span>
                    <span className="font-mono">~{monthlyStats.breakfast.avgDaily} students/day</span>
                  </div>
                </div>

                <div className="p-2 bg-white/70 rounded-lg border border-emerald-100 text-[10px] text-slate-600">
                  <strong className="text-emerald-900">Provisioning Focus:</strong> Milk (~{Math.round(monthlyStats.breakfast.total * 0.2)}L), Bread, Sprouts, Poha, Boiled Eggs.
                </div>
              </div>

              {/* 2. Lunch */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      🍛
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Lunch</h4>
                      <span className="text-[10px] text-blue-700 font-semibold">12:30 – 02:00 PM</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-200/70 text-blue-900">
                    {monthlyStats.lunch.percentage}% Vol
                  </span>
                </div>

                <div className="border-t border-blue-200/60 pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Served:</span>
                    <strong className="font-mono text-blue-950 font-bold text-sm">
                      {monthlyStats.lunch.total} meals
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing C:</span>
                    <span className="font-mono">{monthlyStats.lunch.wing10C}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing D:</span>
                    <span className="font-mono">{monthlyStats.lunch.wing10D}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-blue-800 pt-1 border-t border-blue-100 font-semibold">
                    <span>Daily Average:</span>
                    <span className="font-mono">~{monthlyStats.lunch.avgDaily} students/day</span>
                  </div>
                </div>

                <div className="p-2 bg-white/70 rounded-lg border border-blue-100 text-[10px] text-slate-600">
                  <strong className="text-blue-900">Provisioning Focus:</strong> Rice (~{Math.round(monthlyStats.lunch.total * 0.12)}kg), Atta (~{Math.round(monthlyStats.lunch.total * 0.15)}kg), Dal (~{Math.round(monthlyStats.lunch.total * 0.07)}kg), Curd.
                </div>
              </div>

              {/* 3. Snacks */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      🥪
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Evening Snacks</h4>
                      <span className="text-[10px] text-amber-700 font-semibold">05:00 – 06:00 PM</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                    {monthlyStats.snacks.percentage}% Vol
                  </span>
                </div>

                <div className="border-t border-amber-200/60 pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Served:</span>
                    <strong className="font-mono text-amber-950 font-bold text-sm">
                      {monthlyStats.snacks.total} meals
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing C:</span>
                    <span className="font-mono">{monthlyStats.snacks.wing10C}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing D:</span>
                    <span className="font-mono">{monthlyStats.snacks.wing10D}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-amber-800 pt-1 border-t border-amber-100 font-semibold">
                    <span>Daily Average:</span>
                    <span className="font-mono">~{monthlyStats.snacks.avgDaily} students/day</span>
                  </div>
                </div>

                <div className="p-2 bg-white/70 rounded-lg border border-amber-100 text-[10px] text-slate-600">
                  <strong className="text-amber-900">Provisioning Focus:</strong> Tea leaves, Sugar, Milk (~{Math.round(monthlyStats.snacks.total * 0.15)}L), Biscuits, Samosa/Patties.
                </div>
              </div>

              {/* 4. Dinner */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                      🍽️
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Dinner</h4>
                      <span className="text-[10px] text-purple-700 font-semibold">07:30 – 09:30 PM</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-200/70 text-purple-900">
                    {monthlyStats.dinner.percentage}% Vol
                  </span>
                </div>

                <div className="border-t border-purple-200/60 pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Served:</span>
                    <strong className="font-mono text-purple-950 font-bold text-sm">
                      {monthlyStats.dinner.total} meals
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing C:</span>
                    <span className="font-mono">{monthlyStats.dinner.wing10C}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hostel 10 Wing D:</span>
                    <span className="font-mono">{monthlyStats.dinner.wing10D}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-purple-800 pt-1 border-t border-purple-100 font-semibold">
                    <span>Daily Average:</span>
                    <span className="font-mono">~{monthlyStats.dinner.avgDaily} students/day</span>
                  </div>
                </div>

                <div className="p-2 bg-white/70 rounded-lg border border-purple-100 text-[10px] text-slate-600">
                  <strong className="text-purple-900">Provisioning Focus:</strong> Atta (~{Math.round(monthlyStats.dinner.total * 0.15)}kg), Rice, Paneer/Egg Curry, Gulab Jamun/Ice-cream.
                </div>
              </div>
            </div>

            {/* Mess Provisioning Raw Material & Supply Planner */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Mess Raw Material Provisioning & Grocery Estimate ({monthlyStats.monthName})</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estimated bulk rations based on {monthlyStats.totalMealsServed} total verified meals served to guide procurement and vendor orders.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  Norms: MANIT Mess Committee Standards
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">🌾 Wheat Flour (Atta)</span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {monthlyStats.estimatedProvisioning.attaFlourKg} <span className="text-xs font-normal">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-400">~150g / main meal</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">🍚 Basmati Rice</span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {monthlyStats.estimatedProvisioning.riceKg} <span className="text-xs font-normal">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-400">~120g / main meal</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">🥣 Dal & Pulses</span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {monthlyStats.estimatedProvisioning.dalLentilsKg} <span className="text-xs font-normal">kg</span>
                  </div>
                  <span className="text-[10px] text-slate-400">~70g / main meal</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">🥛 Fresh Milk</span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {monthlyStats.estimatedProvisioning.milkLiters} <span className="text-xs font-normal">L</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Breakfast & Snacks</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">🥚 Eggs Provision</span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {monthlyStats.estimatedProvisioning.eggsUnits} <span className="text-xs font-normal">pcs</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Egg & Non-veg diets</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">🛢️ Refined Oil</span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                    {monthlyStats.estimatedProvisioning.cookingOilLiters} <span className="text-xs font-normal">L</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Cooking & Frying</span>
                </div>
              </div>

              {/* Billing and Record-Keeping Direct CSV Action Footer */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Official student attendance records can be exported with full verification timestamps, dietary preferences, room numbers, and fee status for semester billing audits.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBillingAttendanceCsv}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export {monthlyStats.monthName} Billing CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ATTENDANCE REPORTS & CSV ================= */}
      {activeAdminTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Attendance Reports & Search
              </h2>
              <p className="text-xs text-slate-500">
                Filter attendance records by date, meal, and hostel wing. Export directly to CSV.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Filtered CSV Report ({filteredAttendance.length})</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBillingAttendanceCsv}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                title="Download all attendance records formatted for semester billing and record-keeping"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Download All Records Billing CSV ({attendanceRecords.length})</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Filter by Date
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Filter by Meal
              </label>
              <select
                value={reportMeal}
                onChange={(e) => setReportMeal(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">All Meals</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snacks">Evening Snacks</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Filter by Hostel Wing
              </label>
              <select
                value={reportWing}
                onChange={(e) => setReportWing(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">All Wings (10C & 10D)</option>
                <option value="10C">Wing 10C Only</option>
                <option value="10D">Wing 10D Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Search Student
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Name or Scholar No."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Meal</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Scholar No.</th>
                  <th className="py-2.5 px-3">Hostel Wing</th>
                  <th className="py-2.5 px-3">Recorded Time</th>
                  <th className="py-2.5 px-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No attendance records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono">{row.date}</td>
                      <td className="py-2.5 px-3 font-bold uppercase text-blue-700">
                        {row.meal}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {row.studentName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {row.scholarNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.wing === '10C'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}
                        >
                          Wing {row.wing}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(row.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">
                        ✓ Verified
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: STUDENT MANAGEMENT ================= */}
      {activeAdminTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Student Directory & Verification
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  582 Base Residents (Wing C: 291 · Wing D: 291)
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  Engineered for 2,000 Registrations at a Time ({students.length}/2,000 Registered)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review registered scholars across Hostel 10 Wing C & Wing D. Double registration with the same email ID is strictly prohibited.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={studentWingFilter}
                onChange={(e) => setStudentWingFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">All Wings</option>
                <option value="10C">Wing 10C</option>
                <option value="10D">Wing 10D</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Scholar No.</th>
                  <th className="py-2.5 px-3">Diet Category</th>
                  <th className="py-2.5 px-3">College Email</th>
                  <th className="py-2.5 px-3">Wing & Room</th>
                  <th className="py-2.5 px-3">Mess Card ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      {students.length === 0 ? (
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Ready for Real Student Registrations</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              All assumed/mock students have been removed. Real residential students across Wing 10C & Wing 10D can register now with their official institutional @stu.manit.ac.in email ID.
                            </p>
                          </div>
                          {onOpenRegister && (
                            <button
                              type="button"
                              onClick={onOpenRegister}
                              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Register Real Student Now</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        'No registered students found matching your filters.'
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {stu.profilePhoto ? (
                            <img
                              src={stu.profilePhoto}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                              {stu.fullName.charAt(0)}
                            </div>
                          )}
                          <span>{stu.fullName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {stu.scholarNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stu.dietaryPreference === 'Pure Veg'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : stu.dietaryPreference === 'Veg + Only Egg'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {stu.dietaryPreference || 'Pure Veg'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-900">
                        {stu.email}
                      </td>
                      <td className="py-2.5 px-3">
                        Wing {stu.wing} · {stu.roomNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {stu.feeDetails.messCardId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stu.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {stu.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForModal(stu)}
                            className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600 text-[11px] font-medium"
                          >
                            View
                          </button>
                          {stu.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => onUpdateStudentStatus(stu.id, 'disabled')}
                              className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onUpdateStudentStatus(stu.id, 'active')}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* High Concurrency Pagination Bar */}
          {filteredStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900 font-mono">
                    {(studentPage - 1) * studentPageSize + 1}
                  </strong>
                  –
                  <strong className="text-slate-900 font-mono">
                    {Math.min(studentPage * studentPageSize, filteredStudents.length)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900 font-mono">
                    {filteredStudents.length}
                  </strong>{' '}
                  registered scholars
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Scale: 2,000 registrations supported
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Per page:</span>
                  <select
                    value={studentPageSize}
                    onChange={(e) => {
                      setStudentPageSize(Number(e.target.value));
                      setStudentPage(1);
                    }}
                    className="px-2 py-1 rounded border border-slate-300 bg-white font-medium"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={studentPage <= 1}
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg font-mono">
                    Page {studentPage} of {totalStudentPages}
                  </span>

                  <button
                    type="button"
                    disabled={studentPage >= totalStudentPages}
                    onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: TIMETABLE & SPECIAL DINNER MANAGEMENT ================= */}
      {activeAdminTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
                <Utensils className="w-4 h-4" />
                <span>Mess Schedule & Festival Feasts</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Mess Timetable & Special Occasion Dinner Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Modify meal items for any day of the week or configure a Special Dinner feast with custom dishes, occasion titles, and glowing student highlights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onUpdateTimetableSchedule(WEEKLY_MESS_TIMETABLE);
                  setEditScheduleState(WEEKLY_MESS_TIMETABLE);
                  setTimetableSaveMsg('Restored original circular timetable for all 7 days.');
                  setTimeout(() => setTimetableSaveMsg(null), 3500);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Restore original 7-day institute circular timetable"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset All to Default</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document (PDF/Image)</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadTimetableDoc({
                        id: `doc-${Date.now()}`,
                        title: `Official Hostel 10 C/D Mess Timetable (${file.name})`,
                        fileName: file.name,
                        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                        fileType: file.name.endsWith('.pdf') ? 'pdf' : 'image',
                        uploadedAt: new Date().toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                        uploadedBy: 'Hostel 10 Administration',
                        downloadUrl: '#',
                      });
                      setTimetableSaveMsg(`Uploaded timetable document ${file.name} successfully.`);
                      setTimeout(() => setTimetableSaveMsg(null), 3500);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {timetableSaveMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{timetableSaveMsg}</span>
            </div>
          )}

          {/* Day Selector with Special Occasion Badges */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Select Day to Configure Timetable & Meals:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as DaySchedule['day'][]).map((day) => {
                const dayData = editScheduleState.find((s) => s.day === day);
                const hasOccasion = dayData?.specialOccasion?.isActive;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setEditingDay(day)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      editingDay === day
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span>{day}</span>
                    {hasOccasion && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold flex items-center gap-0.5 ${
                        editingDay === day ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        <span>Special</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Inputs & Special Dinner Controls for Selected Day */}
          {(() => {
            const currentSchedule =
              editScheduleState.find((s) => s.day === editingDay) || editScheduleState[0];

            const updateItems = (meal: 'breakfast' | 'lunch' | 'snacks' | 'dinner', textVal: string) => {
              const items = textVal
                .split(',')
                .map((i) => i.trim())
                .filter(Boolean);
              setEditScheduleState((prev) =>
                prev.map((s) => (s.day === editingDay ? { ...s, [meal]: items } : s))
              );
            };

            const toggleSpecialOccasion = (active: boolean) => {
              setEditScheduleState((prev) =>
                prev.map((s) => {
                  if (s.day !== editingDay) return s;
                  const prevOccasion = s.specialOccasion || {
                    isActive: false,
                    occasionName: `${editingDay} Special Gala Feast`,
                    highlightNote: `Chief Warden Special Notice: Special celebratory feast served across Counter 1–4.`,
                    specialDinnerItems: s.dinner,
                  };
                  return {
                    ...s,
                    specialOccasion: {
                      ...prevOccasion,
                      isActive: active,
                      occasionName: prevOccasion.occasionName || `${editingDay} Grand Feast`,
                    },
                  };
                })
              );
            };

            const updateOccasionProps = (partial: Partial<DaySchedule['specialOccasion']>) => {
              setEditScheduleState((prev) =>
                prev.map((s) => {
                  if (s.day !== editingDay) return s;
                  const existing = s.specialOccasion || {
                    isActive: true,
                    occasionName: `${editingDay} Special Dinner`,
                  };
                  return {
                    ...s,
                    specialOccasion: {
                      ...existing,
                      ...partial,
                    },
                  };
                })
              );
            };

            const isOccasionActive = Boolean(currentSchedule.specialOccasion?.isActive);
            const occasionConfig = currentSchedule.specialOccasion || {
              isActive: false,
              occasionName: `${editingDay} Grand Feast`,
              highlightNote: '',
              specialDinnerItems: currentSchedule.dinner,
            };

            const quickPresets = [
              {
                name: 'Diwali Grand Feast',
                note: 'Chief Warden Announcement: Special festive Diwali dinner with sweets & paneer. Dining counters open till 10:00 PM.',
                items: ['Paneer Tikka', 'Shahi Paneer', 'Butter Naan', 'Jeera Pulao', 'Dal Makhni', 'Hot Gulab Jamun', 'Rasmalai', 'Cold Drink'],
              },
              {
                name: 'Sunday Chicken & Paneer Feast',
                note: 'Special Weekend Dinner: Non-Veg Counter 4 & Pure Veg Counters 1–3 with Jeera Pulao & Desi Ghee Rotis.',
                items: ['Kadahi Paneer', 'Kadahi Chicken', 'Pulao / Jeera Rice', 'Desi Ghee Roti', 'Achar & Salad', 'Special Sweet'],
              },
              {
                name: 'Hostel 10 Annual Fest Gala',
                note: 'Complimentary Hostel 10 Annual Fest dinner arranged by Warden & Mess Committee. Ice-cream counter open.',
                items: ['Kadhai Paneer', 'Veg Manchurian', 'Fried Rice', 'Butter Roti', 'Ice Cream Bar', 'Gulab Jamun'],
              },
              {
                name: 'Holi Festival Celebration Dinner',
                note: 'Special festive Holi dining arrangement for all residential scholars of Wing 10C & 10D.',
                items: ['Chole Bhature', 'Malpua / Gujiya', 'Jeera Rice', 'Boondi Raita', 'Sweet Lassi', 'Salad'],
              },
              {
                name: 'Freshers Welcome Special Dinner',
                note: 'Warm welcome feast for 1st Year scholars residing in Hostel 10 with chef specials.',
                items: ['Butter Paneer Masala', 'Egg Curry', 'Veg Pulao', 'Tandoori Roti', 'Custard with Fruits', 'Gulab Jamun'],
              },
            ];

            return (
              <div className="space-y-6">
                
                {/* 1. Meal Configuration Scope Switcher & Editor */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4 text-blue-700" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Configure Meals for {editingDay}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                          {mealEditScope === 'particular' ? 'Single Meal Scope' : 'Full Day Scope (All 4 Meals)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Admin authorization: Modify any specific meal (Breakfast, Lunch, Snacks, Dinner) or the entire full day meal schedule on {editingDay}.
                      </p>
                    </div>

                    {/* Mode Toggle Buttons */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMealEditScope('particular')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          mealEditScope === 'particular'
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Particular Meal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMealEditScope('full_day')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          mealEditScope === 'full_day'
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Full Day (All 4)</span>
                      </button>
                    </div>
                  </div>

                  {/* PARTICULAR MEAL SCOPE */}
                  {mealEditScope === 'particular' ? (
                    <div className="space-y-4 pt-1">
                      {/* Meal Selector Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(
                          [
                            { key: 'breakfast', label: 'Breakfast', time: '07:30 – 09:30 AM', icon: '🌅' },
                            { key: 'lunch', label: 'Lunch', time: '12:30 – 02:00 PM', icon: '🍛' },
                            { key: 'snacks', label: 'Evening Snacks', time: '05:00 – 06:00 PM', icon: '☕' },
                            { key: 'dinner', label: 'Dinner', time: '07:30 – 09:30 PM', icon: '🍽️' },
                          ] as const
                        ).map((m) => {
                          const isSel = selectedParticularMeal === m.key;
                          const count = currentSchedule[m.key].length;
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => setSelectedParticularMeal(m.key)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isSel
                                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                                  : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-base">{m.icon}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                  {count} items
                                </span>
                              </div>
                              <div className="font-bold text-xs text-slate-900 mt-1">{m.label}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{m.time}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Particular Meal Dish Editor */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                          <div>
                            <span className="text-xs font-bold text-slate-900 capitalize">
                              Current {selectedParticularMeal} Menu on {editingDay}:
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              ({currentSchedule[selectedParticularMeal].length} dishes configured)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveSingleMeal(editingDay, selectedParticularMeal)}
                            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save {selectedParticularMeal.charAt(0).toUpperCase() + selectedParticularMeal.slice(1)} Only ({editingDay})</span>
                          </button>
                        </div>

                        {/* Interactive Dish Chips */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            Active Dishes (Click × to remove):
                          </label>
                          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white rounded-xl border border-slate-200">
                            {currentSchedule[selectedParticularMeal].length === 0 ? (
                              <span className="text-xs text-slate-400 italic">No dishes in this meal yet. Add below.</span>
                            ) : (
                              currentSchedule[selectedParticularMeal].map((dish, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold"
                                >
                                  <span>{dish}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = currentSchedule[selectedParticularMeal].filter((_, i) => i !== idx);
                                      setEditScheduleState((prev) =>
                                        prev.map((s) => (s.day === editingDay ? { ...s, [selectedParticularMeal]: updated } : s))
                                      );
                                    }}
                                    className="w-3.5 h-3.5 rounded-full hover:bg-blue-200 text-blue-700 inline-flex items-center justify-center text-[10px] font-bold"
                                    title="Remove dish"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Add Dish Input & Popular Suggestions */}
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Add New Dish to {selectedParticularMeal.charAt(0).toUpperCase() + selectedParticularMeal.slice(1)}:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newDishInput}
                              onChange={(e) => setNewDishInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newDishInput.trim()) {
                                    const updated = [...currentSchedule[selectedParticularMeal], newDishInput.trim()];
                                    setEditScheduleState((prev) =>
                                      prev.map((s) => (s.day === editingDay ? { ...s, [selectedParticularMeal]: updated } : s))
                                    );
                                    setNewDishInput('');
                                  }
                                }
                              }}
                              placeholder={`Type dish name e.g. ${POPULAR_DISH_SUGGESTIONS[selectedParticularMeal][0]}...`}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newDishInput.trim()) {
                                  const updated = [...currentSchedule[selectedParticularMeal], newDishInput.trim()];
                                  setEditScheduleState((prev) =>
                                    prev.map((s) => (s.day === editingDay ? { ...s, [selectedParticularMeal]: updated } : s))
                                  );
                                  setNewDishInput('');
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Dish</span>
                            </button>
                          </div>

                          {/* Quick Popular Suggestions Chips */}
                          <div className="pt-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Quick Popular Additions (Click to append):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {POPULAR_DISH_SUGGESTIONS[selectedParticularMeal].map((dish) => {
                                const isAlreadyAdded = currentSchedule[selectedParticularMeal].includes(dish);
                                return (
                                  <button
                                    key={dish}
                                    type="button"
                                    onClick={() => {
                                      if (!isAlreadyAdded) {
                                        const updated = [...currentSchedule[selectedParticularMeal], dish];
                                        setEditScheduleState((prev) =>
                                          prev.map((s) => (s.day === editingDay ? { ...s, [selectedParticularMeal]: updated } : s))
                                        );
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                                      isAlreadyAdded
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default'
                                        : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border-slate-200'
                                    }`}
                                  >
                                    <span>{isAlreadyAdded ? '✓' : '+'}</span>
                                    <span>{dish}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Direct Comma-Separated Textarea */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Or Edit Complete Dish List as Comma-Separated Text:
                          </label>
                          <textarea
                            rows={2}
                            value={currentSchedule[selectedParticularMeal].join(', ')}
                            onChange={(e) => updateItems(selectedParticularMeal, e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            placeholder="e.g. Rajma, Rice, Raita, Roti, Dal"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* FULL DAY SCOPE (ALL 4 MEALS) */
                    <div className="space-y-4 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-600">
                          Editing all 4 meals for <strong>{editingDay}</strong> simultaneously. Save individual meals or publish all 4 together below.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveFullDay(editingDay)}
                          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save All 4 Meals for {editingDay}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(
                          [
                            { key: 'breakfast', label: 'Breakfast', time: '07:30 – 09:30 AM', icon: '🌅' },
                            { key: 'lunch', label: 'Lunch', time: '12:30 – 02:00 PM', icon: '🍛' },
                            { key: 'snacks', label: 'Evening Snacks', time: '05:00 – 06:00 PM', icon: '☕' },
                            { key: 'dinner', label: 'Dinner', time: '07:30 – 09:30 PM', icon: '🍽️' },
                          ] as const
                        ).map((m) => (
                          <div key={m.key} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span>{m.icon}</span>
                                <span>{m.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-normal">({m.time})</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleSaveSingleMeal(editingDay, m.key)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700 text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save {m.label}</span>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={currentSchedule[m.key].join(', ')}
                              onChange={(e) => updateItems(m.key, e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                              placeholder={`Enter dishes for ${m.label}...`}
                            />
                            <div className="flex flex-wrap gap-1">
                              {POPULAR_DISH_SUGGESTIONS[m.key].slice(0, 4).map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    if (!currentSchedule[m.key].includes(d)) {
                                      const updated = [...currentSchedule[m.key], d];
                                      setEditScheduleState((prev) =>
                                        prev.map((s) => (s.day === editingDay ? { ...s, [m.key]: updated } : s))
                                      );
                                    }
                                  }}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-900"
                                >
                                  + {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Special Occasion Dinner / Feast Manager (Host-Only Option) */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isOccasionActive
                    ? 'bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 border-amber-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Host Special Occasion Dinner Controller
                        </h3>
                        <p className="text-xs text-slate-600">
                          Friday & Sunday serve authentic timetable meals by default. Only the Host (Warden) can add and publish a Special Occasion Dinner when a celebration occurs.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOccasionActive ? (
                        <button
                          type="button"
                          onClick={() => toggleSpecialOccasion(false)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Remove special dinner and revert to standard timetable dinner"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove Special Dinner</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSpecialOccasion(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+ Add Special Dinner on {editingDay}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isOccasionActive ? (
                    <div className="mt-4 space-y-4">
                      <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-950 flex items-center justify-between gap-2">
                        <span>
                          ✨ <strong>Active:</strong> Special dinner declared for <strong>{editingDay}</strong>. Once saved, students will see festive spotlight banners and highlighted dinner cards.
                        </span>
                        <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded">
                          Live on Save
                        </span>
                      </div>

                      {/* Preset Templates */}
                      <div>
                        <span className="text-[11px] font-bold text-amber-900 block mb-1.5">
                          Quick Occasion Presets (Click to autofill):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {quickPresets.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                updateOccasionProps({
                                  occasionName: preset.name,
                                  highlightNote: preset.note,
                                  specialDinnerItems: preset.items,
                                });
                              }}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-white hover:bg-amber-100 text-amber-950 font-semibold border border-amber-200 transition-colors shadow-2xs"
                            >
                              🎉 {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Occasion Title Input */}
                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Occasion / Festival Name (Displayed to Students)
                        </label>
                        <input
                          type="text"
                          value={occasionConfig.occasionName}
                          onChange={(e) => updateOccasionProps({ occasionName: e.target.value })}
                          placeholder="e.g. Diwali Grand Feast, Hostel 10 Annual Fest Gala, etc."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* Special Dinner Items Input */}
                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Special Dinner Feast Menu (Comma-separated items)
                        </label>
                        <textarea
                          rows={2}
                          value={(occasionConfig.specialDinnerItems || currentSchedule.dinner).join(', ')}
                          onChange={(e) => {
                            const items = e.target.value
                              .split(',')
                              .map((i) => i.trim())
                              .filter(Boolean);
                            updateOccasionProps({ specialDinnerItems: items });
                          }}
                          placeholder="e.g. Paneer Tikka, Shahi Paneer, Butter Naan, Jeera Pulao, Hot Gulab Jamun"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* Highlight Announcement Note */}
                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Chief Warden Special Highlight Announcement (Shown in banner)
                        </label>
                        <textarea
                          rows={2}
                          value={occasionConfig.highlightNote || ''}
                          onChange={(e) => updateOccasionProps({ highlightNote: e.target.value })}
                          placeholder="e.g. Chief Warden Announcement: Extra hot Gulab Jamun and fresh dessert arranged across Counter 1–4. Extended dining till 10:00 PM."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* Live Student Preview Card */}
                      <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-300" />
                            Live Student Preview on {editingDay}
                          </span>
                          <span className="text-[11px] font-mono text-amber-100">07:30 PM – 09:30 PM</span>
                        </div>
                        <h4 className="text-base font-extrabold text-white">
                          🎉 {occasionConfig.occasionName || `${editingDay} Special Dinner`}
                        </h4>
                        <p className="text-xs text-amber-100 leading-snug">
                          {occasionConfig.highlightNote || 'Complimentary festive dinner served across all dining counters.'}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {(occasionConfig.specialDinnerItems || currentSchedule.dinner).map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white/20 text-white text-[11px] font-medium">
                              ★ {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span>Standard timetable dinner applies on <strong>{editingDay}</strong>: </span>
                        <span className="font-semibold text-slate-700">
                          {currentSchedule.dinner.join(', ')}
                        </span>.
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No special dinner will be shown to students unless the Host clicks "+ Add Special Dinner on {editingDay}".
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSpecialOccasion(true)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold whitespace-nowrap shadow-2xs"
                      >
                        + Add Special Dinner
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Editing <strong>{editingDay}</strong> schedule. Click save to publish changes instantly.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const original = WEEKLY_MESS_TIMETABLE.find((s) => s.day === editingDay);
                        if (original) {
                          setEditScheduleState((prev) =>
                            prev.map((s) => (s.day === editingDay ? original : s))
                          );
                          setTimetableSaveMsg(`Reset ${editingDay} schedule to standard timetable.`);
                          setTimeout(() => setTimetableSaveMsg(null), 3500);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                    >
                      Reset {editingDay} Only
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTimetable}
                      className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save {editingDay} Timetable & Special Occasion</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* ================= TAB 4.5 / DEDICATED: HOST ONLY SPECIAL DINNER ================= */}
      {activeAdminTab === 'specialDinner' && (
        <div className="space-y-6">
          {/* Host Exclusive Header Notice */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
            <div
              className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-black/25 backdrop-blur-xs text-amber-200 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    Host Exclusive Privilege
                  </span>
                  <span className="text-xs text-amber-100 font-medium">
                    Chief Warden & Mess Administration
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Special Dinner Feast Scheduler (Any Day of the Week)
                </h2>
                <p className="text-xs sm:text-sm text-amber-100 max-w-3xl leading-relaxed">
                  As the Host, you have the exclusive authority to schedule, customize, and publish celebratory Special Dinners for <strong>any day of the week</strong> (Monday through Sunday). When declared, the student dashboard and digital pass instantly display celebratory feast banners, custom festive dishes, and official announcements.
                </p>
              </div>

              {/* Quick Save Alert if recently saved */}
              {timetableSaveMsg && (
                <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/30 text-xs font-bold text-white flex items-center gap-2 shrink-0 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Changes Published to Student Portal!</span>
                </div>
              )}
            </div>
          </div>

          {/* 7-Day Day Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Day to Configure Special Dinner
                </h3>
                <p className="text-xs text-slate-600">
                  Pick any day of the week to enable, edit, or remove festive meals.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Active Special Dinners:{' '}
                <strong className="text-amber-600 font-bold">
                  {editScheduleState.filter((s) => s.specialOccasion?.isActive).length} / 7 Days
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {(
                [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ] as DaySchedule['day'][]
              ).map((dayName) => {
                const dayObj = editScheduleState.find((s) => s.day === dayName);
                const hasFeast = !!dayObj?.specialOccasion?.isActive;
                const isSelected = hostSelectedDay === dayName;

                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => setHostSelectedDay(dayName)}
                    className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between h-20 ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                        : hasFeast
                        ? 'bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs">{dayName}</span>
                      {hasFeast && (
                        <Sparkles
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-yellow-200' : 'text-amber-500'
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      {hasFeast ? (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isSelected
                              ? 'bg-amber-700 text-white'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          🎉 Feast Active
                        </span>
                      ) : (
                        <span
                          className={`text-[11px] font-medium ${
                            isSelected ? 'text-amber-100' : 'text-slate-400'
                          }`}
                        >
                          Standard Dinner
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Day Special Dinner Configuration & Preview */}
          {(() => {
            const currentDay = editScheduleState.find((s) => s.day === hostSelectedDay);
            if (!currentDay) return null;

            const isFeastActive = !!currentDay.specialOccasion?.isActive;
            const occasionName =
              currentDay.specialOccasion?.occasionName ||
              (hostSelectedDay === 'Sunday'
                ? 'Sunday Special Kadahi Feast'
                : `${hostSelectedDay} Celebratory Dinner`);
            const highlightNote =
              currentDay.specialOccasion?.highlightNote ||
              'Extended dining timing up to 09:45 PM. Freshly prepared with student choice.';
            const specialItemsList =
              currentDay.specialOccasion?.specialDinnerItems &&
              currentDay.specialOccasion.specialDinnerItems.length > 0
                ? currentDay.specialOccasion.specialDinnerItems
                : currentDay.dinner;

            // Helper to update current day's specialOccasion in editScheduleState
            const updateCurrentSpecialOccasion = (
              updated: Partial<NonNullable<DaySchedule['specialOccasion']>>
            ) => {
              setEditScheduleState((prev) =>
                prev.map((s) => {
                  if (s.day !== hostSelectedDay) return s;
                  const currentOcc = s.specialOccasion || {
                    isActive: false,
                    occasionName: `${hostSelectedDay} Special Dinner`,
                    highlightNote: '',
                    specialDinnerItems: [...s.dinner],
                  };
                  return {
                    ...s,
                    specialOccasion: {
                      ...currentOcc,
                      ...updated,
                    },
                  };
                })
              );
            };

            // Quick Preset Loader
            const applyPreset = (presetName: string, items: string[], note: string) => {
              setEditScheduleState((prev) =>
                prev.map((s) => {
                  if (s.day !== hostSelectedDay) return s;
                  return {
                    ...s,
                    specialOccasion: {
                      isActive: true,
                      occasionName: presetName,
                      specialDinnerItems: items,
                      highlightNote: note,
                    },
                    dinner: items, // also sync dinner menu
                  };
                })
              );
            };

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Configuration Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  {/* Status & Enable / Disable Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">
                          {hostSelectedDay} Special Dinner Setup
                        </span>
                        {isFeastActive ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Inactive (Serving Standard Menu)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Host control to turn Special Dinner ON or OFF for {hostSelectedDay}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isFeastActive) {
                          // Turn OFF
                          updateCurrentSpecialOccasion({ isActive: false });
                        } else {
                          // Turn ON with intelligent defaults
                          updateCurrentSpecialOccasion({
                            isActive: true,
                            occasionName:
                              currentDay.specialOccasion?.occasionName ||
                              (hostSelectedDay === 'Sunday'
                                ? 'Sunday Special Kadahi Feast'
                                : `${hostSelectedDay} Special Dinner`),
                            highlightNote:
                              currentDay.specialOccasion?.highlightNote ||
                              'Special feast served from 07:30 PM to 09:30 PM.',
                            specialDinnerItems:
                              currentDay.specialOccasion?.specialDinnerItems &&
                              currentDay.specialOccasion.specialDinnerItems.length > 0
                                ? currentDay.specialOccasion.specialDinnerItems
                                : [
                                    'Special Paneer Butter Masala',
                                    'Jeera Pulao',
                                    'Butter Roti',
                                    'Dal Makhani',
                                    'Hot Gulab Jamun',
                                    'Papad & Salad',
                                  ],
                          });
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                        isFeastActive
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                      }`}
                    >
                      {isFeastActive ? (
                        <>
                          <X className="w-4 h-4" />
                          <span>Turn Off / Revert to Standard Dinner</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-200" />
                          <span>+ Turn On Special Dinner for {hostSelectedDay}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isFeastActive ? (
                    <div className="space-y-5">
                      {/* Presets Bar */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          ⚡ Host Quick Presets (Click to autofill menu & occasion):
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              applyPreset(
                                'Sunday Special Kadahi Feast',
                                [
                                  'Kadahi Paneer / Kadahi Chicken',
                                  'Pulao / Jeera Rice',
                                  'Roti & Pure Ghee',
                                  'Hot Gulab Jamun',
                                  'Achaar & Green Salad',
                                ],
                                'Sunday festive feast for all residents. Non-veg and veg counters arranged.'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 transition-colors"
                          >
                            🍛 Sunday Kadahi Feast
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyPreset(
                                'Diwali Mahabhoj Celebration',
                                [
                                  'Shahi Paneer Deluxe',
                                  'Navratan Pulao',
                                  'Puri / Butter Naan',
                                  'Dal Makhani',
                                  'Moong Dal Halwa & Rasgulla',
                                  'Raita, Papad & Salad',
                                ],
                                'Wishing all residents a very happy Diwali! Extended dining until 10:00 PM.'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 transition-colors"
                          >
                            🪔 Diwali Mahabhoj
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyPreset(
                                'Holi Festive Gala Dinner',
                                [
                                  'Chole Bhature / Paneer Tikka Masala',
                                  'Jeera Rice',
                                  'Dahi Vada with Imli Chutney',
                                  'Special Gujiya & Thandai',
                                  'Kheer & Green Salad',
                                ],
                                'Holi festival feast. Special sweets and refreshment counters active.'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 transition-colors"
                          >
                            🎨 Holi Gala Dinner
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyPreset(
                                'Freshers & Welcome Banquet',
                                [
                                  'Paneer Lababdar / Butter Chicken',
                                  'Hyderabadi Veg Biryani',
                                  'Rumali Roti / Tandoori Naan',
                                  'Boondi Raita',
                                  'Vanilla Ice Cream with Chocolate Sauce',
                                ],
                                'Welcome freshers to Hostel 10 C/D! Cordially hosted by Warden & Committee.'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 transition-colors"
                          >
                            🎓 Freshers / Farewell Banquet
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyPreset(
                                'MANIT Foundation Day Feast',
                                [
                                  'Paneer Do Pyaza',
                                  'Kashmiri Pulao',
                                  'Tawa Butter Roti',
                                  'Special Dal Tadka',
                                  'Kaju Katli & Rasmalai',
                                  'Fresh Fruit Salad & Chaas',
                                ],
                                'Celebrating MANIT Bhopal Foundation Day with grand hostel feast.'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 transition-colors"
                          >
                            🏛️ MANIT Foundation Feast
                          </button>
                        </div>
                      </div>

                      {/* Occasion Name Input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Occasion Title / Festival Name
                        </label>
                        <input
                          type="text"
                          value={occasionName}
                          onChange={(e) =>
                            updateCurrentSpecialOccasion({ occasionName: e.target.value })
                          }
                          placeholder="e.g. Sunday Grand Feast / Diwali Mahabhoj / Hostel Night"
                          className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Displayed at the top of the student dashboard with celebratory festival badges.
                        </p>
                      </div>

                      {/* Special Dishes Textarea */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Special Dinner Dishes & Highlights (Separate items with commas or newlines)
                        </label>
                        <textarea
                          rows={4}
                          value={specialItemsList.join(', ')}
                          onChange={(e) => {
                            const items = e.target.value
                              .split(/[,\n]/)
                              .map((i) => i.trim())
                              .filter(Boolean);
                            updateCurrentSpecialOccasion({ specialDinnerItems: items });
                            // Also update base dinner list for consistency
                            setEditScheduleState((prev) =>
                              prev.map((s) => (s.day === hostSelectedDay ? { ...s, dinner: items } : s))
                            );
                          }}
                          placeholder="e.g. Kadahi Paneer / Chicken, Jeera Rice, Gulab Jamun, Papad & Salad"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {specialItemsList.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium"
                            >
                              ✨ {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Warden Notice / Note */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Chief Warden Announcement / Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={highlightNote}
                          onChange={(e) =>
                            updateCurrentSpecialOccasion({ highlightNote: e.target.value })
                          }
                          placeholder="e.g. Mess timings extended up to 09:45 PM. All residents cordially invited."
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {/* Save Buttons */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            const original = WEEKLY_MESS_TIMETABLE.find(
                              (s) => s.day === hostSelectedDay
                            );
                            if (original) {
                              setEditScheduleState((prev) =>
                                prev.map((s) => (s.day === hostSelectedDay ? original : s))
                              );
                              setTimetableSaveMsg(`Reset ${hostSelectedDay} schedule to standard timetable.`);
                              setTimeout(() => setTimetableSaveMsg(null), 3500);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                        >
                          Reset {hostSelectedDay} to Default
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveTimetable}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <Save className="w-4 h-4" />
                          <span>Publish {hostSelectedDay} Special Dinner to Portal</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Utensils className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-slate-700">
                          Standard Authentic Dinner Active for {hostSelectedDay}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          No special dinner feast is scheduled. Students will see the regular authentic timetable dinner:
                        </p>
                        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
                          {currentDay.dinner.join(', ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateCurrentSpecialOccasion({
                            isActive: true,
                            occasionName:
                              hostSelectedDay === 'Sunday'
                                ? 'Sunday Special Kadahi Feast'
                                : `${hostSelectedDay} Special Dinner`,
                            highlightNote: 'Special dinner feast served 07:30 PM - 09:30 PM.',
                            specialDinnerItems: [
                              'Special Paneer Butter Masala',
                              'Jeera Pulao',
                              'Butter Roti',
                              'Dal Makhani',
                              'Hot Gulab Jamun',
                              'Papad & Salad',
                            ],
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                        <span>Add Special Dinner for {hostSelectedDay}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Live Student Portal Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Live Student View on {hostSelectedDay}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Real-time interactive preview
                    </span>
                  </div>

                  {isFeastActive ? (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border-2 border-amber-300 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-black/30 text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 border border-white/20">
                          <Sparkles className="w-3 h-3 text-yellow-300" />
                          SPECIAL OCCASION DINNER TODAY
                        </span>
                        <span className="text-[11px] font-bold text-amber-100 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          07:30 PM – 09:30 PM
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-white">
                          🎉 {occasionName}
                        </h4>
                        <p className="text-xs text-amber-100 mt-0.5 font-medium">
                          {highlightNote}
                        </p>
                      </div>

                      <div className="bg-black/20 backdrop-blur-xs p-3.5 rounded-xl border border-white/20 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                          Festive Menu Items:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {specialItemsList.map((item, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white/25 text-white font-semibold text-xs border border-white/20"
                            >
                              ⭐ {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-amber-100">
                        <span>Hostel 10 C/D Mess Committee</span>
                        <span className="font-bold underline">Digital Token Active</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                            🍽️
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              Dinner ({hostSelectedDay})
                            </div>
                            <div className="text-[11px] text-slate-400">
                              07:30 PM – 09:30 PM · Standard Timetable
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Standard Menu
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Menu Items:
                        </span>
                        <ul className="space-y-1">
                          {currentDay.dinner.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Host Tip Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
                    <span className="font-bold text-slate-800 block">
                      📌 Host Guide:
                    </span>
                    <p>
                      • To change meals for a holiday like Diwali or Holi on a Wednesday or Thursday, click Wednesday/Thursday above, turn on Special Dinner, select the preset or write dishes, and hit <strong>Publish</strong>.
                    </p>
                    <p>
                      • When an occasion concludes, simply click <strong>Turn Off / Revert</strong> to restore authentic weekly timetable meals.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* All 7 Days Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Weekly 7-Day Special Dinner Status Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive overview of regular vs special dinners across the entire week.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveTimetable}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Timetable Changes</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-4 font-bold">Day</th>
                    <th className="py-2.5 px-4 font-bold">Regular Dinner Menu (Timetable)</th>
                    <th className="py-2.5 px-4 font-bold">Special Dinner Status</th>
                    <th className="py-2.5 px-4 font-bold text-right">Host Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editScheduleState.map((s) => {
                    const hasFeast = !!s.specialOccasion?.isActive;
                    return (
                      <tr
                        key={s.day}
                        className={
                          hostSelectedDay === s.day
                            ? 'bg-amber-50/50 font-medium'
                            : 'hover:bg-slate-50/80 transition-colors'
                        }
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <span>{s.day}</span>
                          {hasFeast && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                              Feast
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {s.dinner.join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          {hasFeast ? (
                            <div className="space-y-0.5">
                              <span className="text-amber-800 font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                {s.specialOccasion?.occasionName}
                              </span>
                              <div className="text-[11px] text-slate-500 truncate max-w-sm">
                                {s.specialOccasion?.specialDinnerItems?.join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">
                              Standard Dinner (No Special Feast)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setHostSelectedDay(s.day);
                              window.scrollTo({ top: 180, behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 text-xs font-semibold transition-colors"
                          >
                            Configure {s.day}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: FEEDBACK MANAGEMENT ================= */}
      {activeAdminTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Student Feedback & Suggestions Inbox
              </h2>
              <p className="text-xs text-slate-500">
                Review ratings, comments, and respond with administrative actions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={feedbackMealFilter}
                onChange={(e) => setFeedbackMealFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">All Feedback Types</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snacks">Evening Snacks</option>
                <option value="dinner">Dinner</option>
              </select>

              <select
                value={feedbackStatusFilter}
                onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Under Review">Under Review</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredFeedback.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No feedback records found.
              </div>
            ) : (
              filteredFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {fb.studentName} (Wing {fb.wing})
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        Scholar: {fb.scholarNumber}
                      </span>
                      {fb.meal && (
                        <span className="text-[11px] font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded">
                          {fb.meal}
                        </span>
                      )}
                      {fb.rating && (
                        <span className="text-amber-500 font-bold text-xs">
                          ★ {fb.rating}/5
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        fb.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : fb.status === 'Reviewed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    "{fb.comment}"
                  </p>

                  {fb.adminNotes && (
                    <div className="text-[11px] text-blue-900 bg-blue-50 p-2 rounded-lg border border-blue-200/60">
                      <strong>Admin Response:</strong> {fb.adminNotes}
                    </div>
                  )}

                  {/* Admin Action Form */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Add warden note / action taken..."
                      value={adminNoteInput[fb.id] || ''}
                      onChange={(e) =>
                        setAdminNoteInput({ ...adminNoteInput, [fb.id]: e.target.value })
                      }
                      className="flex-1 px-3 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateFeedbackStatus(
                          fb.id,
                          'Reviewed',
                          adminNoteInput[fb.id] || fb.adminNotes
                        );
                      }}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateFeedbackStatus(
                          fb.id,
                          'Resolved',
                          adminNoteInput[fb.id] || fb.adminNotes || 'Resolved by warden.'
                        );
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeAdminTab === 'googleDrive' && (
        <GoogleDriveManager
          students={students}
          attendance={attendanceRecords}
          feedback={feedbackList}
          weeklyTimetable={editScheduleState}
        />
      )}

      {/* Student Profile Modal for Admin */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Student Profile Record
              </h3>
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                {selectedStudentForModal.profilePhoto ? (
                  <img
                    src={selectedStudentForModal.profilePhoto}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {selectedStudentForModal.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {selectedStudentForModal.fullName}
                  </h4>
                  <p className="text-slate-500 font-mono">
                    Scholar: {selectedStudentForModal.scholarNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Hostel</span>
                  <span className="font-semibold">{selectedStudentForModal.hostel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Wing & Room</span>
                  <span className="font-semibold">
                    Wing {selectedStudentForModal.wing} · {selectedStudentForModal.roomNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="font-semibold truncate block font-mono text-[11px]">
                    {selectedStudentForModal.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mobile</span>
                  <span className="font-semibold font-mono">
                    +91 {selectedStudentForModal.mobile}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Fee Status</span>
                  <span className="font-bold text-emerald-700">
                    {selectedStudentForModal.feeDetails.status} (₹{selectedStudentForModal.feeDetails.amountPaid})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Rebate Balance</span>
                  <span className="font-bold text-blue-700">
                    {selectedStudentForModal.feeDetails.rebateDaysAvailable} Days
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Dietary Category</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudentForModal.dietaryPreference || 'Pure Veg'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudentForModal(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
