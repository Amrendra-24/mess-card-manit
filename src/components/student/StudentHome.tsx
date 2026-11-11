import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Utensils,
  AlertCircle,
  Calendar,
  Building,
  User,
  QrCode,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Sparkles,
  Coffee,
  Sun,
  Cookie,
  Moon,
  Cloud,
  Folder,
  ExternalLink,
  RefreshCw,
  Lock,
  Download,
} from 'lucide-react';
import { DaySchedule, MealAttendanceRecord, MealType, Student } from '../../types';
import {
  calculateStudentStats,
  formatIndianDate,
  getIsoDateString,
  getMealWindowInfo,
  hasMarkedAttendance,
} from '../../utils/messLogic';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  getConnectedFolderName,
  saveStudentRegistrationToDrive,
  SingleStudentSaveResult,
} from '../../services/googleDriveService';
import { User as FirebaseUser } from 'firebase/auth';
import confetti from 'canvas-confetti';

interface StudentHomeProps {
  currentStudent: Student;
  attendanceRecords: MealAttendanceRecord[];
  onMarkAttendance: (meal: MealType) => void;
  weeklyTimetable: DaySchedule[];
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  currentStudent,
  attendanceRecords,
  onMarkAttendance,
  weeklyTimetable,
}) => {
  // Allow time simulation mode for testing any meal window
  const [simulatedMeal, setSimulatedMeal] = useState<MealType | 'auto'>('auto');
  const [showQrPass, setShowQrPass] = useState(false);

  // Google Drive Connection State
  const [driveUser, setDriveUser] = useState<FirebaseUser | null>(null);
  const [driveFolderName, setDriveFolderName] = useState<string>(getConnectedFolderName());
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSaveResult, setDriveSaveResult] = useState<SingleStudentSaveResult | null>(null);
  const [driveSaveError, setDriveSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDriveFolderName(getConnectedFolderName());
    const unsub = initAuth(
      (user) => setDriveUser(user),
      () => setDriveUser(null)
    );
    return () => unsub();
  }, []);

  const handleSaveMessCardToDrive = async () => {
    setIsSavingToDrive(true);
    setDriveSaveError(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const loginRes = await googleSignIn();
        if (loginRes) {
          setDriveUser(loginRes.user);
          token = loginRes.accessToken;
        }
      }
      const result = await saveStudentRegistrationToDrive(currentStudent, driveFolderName);
      setDriveSaveResult(result);
      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('Save to Drive error:', err);
      setDriveSaveError(err.message || 'Failed to save mess card to Google Drive');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const today = new Date();
  const todayStr = getIsoDateString(today);
  const formattedToday = formatIndianDate(today);

  // Day of week name (e.g. "Monday")
  const dayNames: DaySchedule['day'][] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const currentDayName = dayNames[today.getDay()];
  const todaySchedule =
    weeklyTimetable.find((s) => s.day === currentDayName) || weeklyTimetable[0];

  // Window info
  const windowInfo = getMealWindowInfo(today);
  const activeMeal: MealType =
    simulatedMeal === 'auto' ? windowInfo.activeMeal : simulatedMeal;

  // Student metrics
  const stats = calculateStudentStats(attendanceRecords, currentStudent.id, todayStr);

  // Greeting by hour
  const currentHour = today.getHours();
  let greeting = 'Good Morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good Afternoon';
  else if (currentHour >= 17) greeting = 'Good Evening';

  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const isSpecialDinnerToday = Boolean(todaySchedule.specialOccasion?.isActive);
  const specialDinnerMenu =
    isSpecialDinnerToday && todaySchedule.specialOccasion?.specialDinnerItems && todaySchedule.specialOccasion.specialDinnerItems.length > 0
      ? todaySchedule.specialOccasion.specialDinnerItems
      : todaySchedule.dinner;

  const mealDefinitions: {
    type: MealType;
    label: string;
    timing: string;
    icon: React.ComponentType<{ className?: string }>;
    menuItems: string[];
    isSpecialDinner?: boolean;
  }[] = [
    {
      type: 'breakfast',
      label: 'Breakfast',
      timing: isWeekend ? '08:30 AM – 10:00 AM' : '07:30 AM – 09:00 AM',
      icon: Coffee,
      menuItems: todaySchedule.breakfast,
    },
    {
      type: 'lunch',
      label: 'Lunch',
      timing: '12:30 PM – 02:00 PM',
      icon: Sun,
      menuItems: todaySchedule.lunch,
    },
    {
      type: 'snacks',
      label: 'Evening Snacks',
      timing: '05:00 PM – 06:00 PM',
      icon: Cookie,
      menuItems: todaySchedule.snacks,
    },
    {
      type: 'dinner',
      label: isSpecialDinnerToday
        ? `Special Dinner: ${todaySchedule.specialOccasion?.occasionName || 'Feast'}`
        : 'Dinner',
      timing: '07:30 PM – 09:30 PM',
      icon: Moon,
      menuItems: specialDinnerMenu,
      isSpecialDinner: isSpecialDinnerToday,
    },
  ];

  const currentMealDef = mealDefinitions.find((m) => m.type === activeMeal)!;
  const isCurrentMealMarked = hasMarkedAttendance(
    attendanceRecords,
    currentStudent.id,
    activeMeal,
    todayStr
  );

  const currentMealRecord = attendanceRecords.find(
    (r) =>
      r.studentId === currentStudent.id &&
      r.date === todayStr &&
      r.meal === activeMeal
  );

  const handleAttendanceClick = (meal: MealType) => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onMarkAttendance(meal);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* A. Welcome Banner Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div
          className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              {currentStudent.profilePhoto ? (
                <img
                  src={currentStudent.profilePhoto}
                  alt={currentStudent.fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-bold text-2xl border-2 border-white/30 shadow-md">
                  {currentStudent.fullName.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-md shadow-xs">
                Active
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                {greeting}, {currentStudent.fullName}!
              </h1>
              <p className="text-xs sm:text-sm text-blue-200">
                Welcome to your Hostel 10 C/D Mess Dashboard.
              </p>
              
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-blue-100">
                <span className="font-semibold px-2.5 py-0.5 rounded-md bg-white/15 backdrop-blur-xs border border-white/10">
                  Hostel 10 · Wing {currentStudent.wing} (291 Students · 582 Total)
                </span>
                <span className="font-mono text-blue-200">
                  Room: {currentStudent.roomNumber}
                </span>
                <span className="text-blue-300">·</span>
                <span className="font-mono text-blue-200">
                  Scholar: {currentStudent.scholarNumber}
                </span>
                <span className="text-blue-300">·</span>
                <span className="font-semibold px-2 py-0.5 rounded-md bg-white/20 text-white border border-white/20 text-[11px]">
                  Diet: {currentStudent.dietaryPreference || 'Pure Veg'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Date and Digital Pass CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="text-left md:text-right">
              <div className="text-xs text-blue-300 font-medium">Today's Schedule</div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span>{formattedToday}</span>
              </div>
              <div className="text-xs text-blue-200 mt-0.5">
                Day: <strong className="text-white">{currentDayName}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrPass(true)}
              className="px-4 py-2 rounded-xl bg-white text-blue-900 font-bold text-xs sm:text-sm hover:bg-blue-50 shadow-sm transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-blue-700" />
              <span>Digital Mess Pass</span>
            </button>
          </div>
        </div>

        {/* Evaluation Time Window Simulator */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Test Meal Windows (Live Simulation):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/15">
            <button
              type="button"
              onClick={() => setSimulatedMeal('auto')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                simulatedMeal === 'auto'
                  ? 'bg-white text-blue-900'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Auto (Live Clock)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedMeal('breakfast')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                simulatedMeal === 'breakfast'
                  ? 'bg-white text-blue-900'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Breakfast
            </button>
            <button
              type="button"
              onClick={() => setSimulatedMeal('lunch')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                simulatedMeal === 'lunch'
                  ? 'bg-white text-blue-900'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Lunch
            </button>
            <button
              type="button"
              onClick={() => setSimulatedMeal('snacks')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                simulatedMeal === 'snacks'
                  ? 'bg-white text-blue-900'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Evening Snacks
            </button>
            <button
              type="button"
              onClick={() => setSimulatedMeal('dinner')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                simulatedMeal === 'dinner'
                  ? 'bg-white text-blue-900'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Dinner
            </button>
          </div>
        </div>
      </div>

      {/* Google Drive Connected Mess Card & Privacy Section */}
      <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-xs bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                Google Drive Connected Mess Card
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                <Folder className="w-3 h-3 text-emerald-600" />
                Folder: <strong className="font-mono text-slate-900 ml-1">{driveFolderName}</strong>
              </span>
              {driveUser && (
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {driveUser.email}
                </span>
              )}
            </div>
            
            <h3 className="text-base font-bold text-slate-900">
              Personal Cloud Backup: Photo, Room, Wing & Mess Card
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Your registration records (Portrait Photo, Full Name, Wing {currentStudent.wing}, Room {currentStudent.roomNumber}, Dietary Category: <strong>{currentStudent.dietaryPreference || 'Pure Veg'}</strong>, and Mess Card) are saved directly to your personal Google Drive storage under{' '}
              <span className="font-mono font-semibold text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px]">
                {driveFolderName} / Student Mess Cards & Profiles
              </span>.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800 pt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                🔒 100% Private Cloud Storage: AI does not store, index, or retain your personal registration data.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSaveMessCardToDrive}
              disabled={isSavingToDrive}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSavingToDrive ? 'animate-spin' : ''}`} />
              <span>{isSavingToDrive ? 'Saving to Google Drive...' : 'Save Mess Card to My Drive'}</span>
            </button>

            {driveSaveResult?.rootFolderLink && (
              <a
                href={driveSaveResult.rootFolderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open in Drive</span>
              </a>
            )}
          </div>
        </div>

        {/* Sync Success / Error Alert */}
        {driveSaveResult && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{driveSaveResult.message}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {driveSaveResult.cardFileLink && (
                <a
                  href={driveSaveResult.cardFileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-800 hover:underline flex items-center gap-1 text-[11px]"
                >
                  View MessCard.json ↗
                </a>
              )}
              {driveSaveResult.photosFolderLink && (
                <a
                  href={driveSaveResult.photosFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-800 hover:underline flex items-center gap-1 text-[11px]"
                >
                  View Photo Album ↗
                </a>
              )}
            </div>
          </div>
        )}

        {driveSaveError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{driveSaveError}</span>
          </div>
        )}
      </div>

      {/* Special Occasion Dinner Spotlight Banner (When active today) */}
      {isSpecialDinnerToday && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden border-2 border-amber-300">
          <div
            className="absolute -right-8 -bottom-8 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-black/25 backdrop-blur-xs text-white text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-white/20 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                  SPECIAL OCCASION DINNER TODAY
                </span>
                <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-100" />
                  07:30 PM – 09:30 PM
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  🎉 {todaySchedule.specialOccasion?.occasionName || `${currentDayName} Special Feast`}
                </h2>
                {todaySchedule.specialOccasion?.highlightNote && (
                  <p className="mt-2 text-xs sm:text-sm text-amber-50 bg-black/20 p-3 rounded-xl border border-white/15 leading-relaxed font-medium">
                    📢 <strong>Chief Warden Announcement:</strong> {todaySchedule.specialOccasion.highlightNote}
                  </p>
                )}
              </div>

              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100 mb-1.5 flex items-center gap-1">
                  <span>Special Feast Dishes Prepared Tonight:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {specialDinnerMenu.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-900 shadow-xs"
                    >
                      ★ {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-start md:items-end justify-center gap-2 bg-white/15 p-4 rounded-xl border border-white/25">
              <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                Hostel 10 C & 10 D Dining Hall
              </span>
              <span className="text-sm font-extrabold text-white">
                All Dining Counters Active
              </span>
              <span className="text-[11px] text-amber-100">
                Special festive celebration meal
              </span>
              <button
                type="button"
                onClick={() => setSimulatedMeal('dinner')}
                className="mt-1 px-4 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 text-xs font-black shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Jump to Special Dinner View</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. Personal Attendance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
            Today's Meals
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
              {stats.todayMealsCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 4 taken</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Active today
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
            This Month
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {stats.totalMealsMonth}
            </span>
            <span className="text-xs text-slate-400 font-medium">meals</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            November 2026
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
            Breakfast
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
              {stats.breakfastCount}
            </span>
            <span className="text-xs text-slate-400">times</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            07:30 - 09:00 AM
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
            Lunch
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
              {stats.lunchCount}
            </span>
            <span className="text-xs text-slate-400">times</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            12:30 - 02:00 PM
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
            Snacks
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums">
              {stats.snacksCount}
            </span>
            <span className="text-xs text-slate-400">times</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            05:00 - 06:00 PM
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
            Dinner
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-700 font-mono tabular-nums">
              {stats.dinnerCount}
            </span>
            <span className="text-xs text-slate-400">times</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            07:30 - 09:30 PM
          </div>
        </div>
      </div>

      {/* B. Highlighted CURRENT MEAL Card */}
      <div
        className={`rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-all ${
          isSpecialDinnerToday && activeMeal === 'dinner'
            ? 'bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-100/30 border-2 border-amber-500 ring-4 ring-amber-200/70 shadow-lg'
            : 'bg-white border-2 border-blue-600 shadow-md'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {isSpecialDinnerToday && activeMeal === 'dinner' ? (
                <span className="px-3.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-black rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-sm animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  CURRENT MEAL: SPECIAL OCCASION DINNER
                </span>
              ) : (
                <span className="px-3 py-1 bg-blue-700 text-white text-xs font-extrabold rounded-md uppercase tracking-wider">
                  CURRENT MEAL: {currentMealDef.label}
                </span>
              )}

              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                  isSpecialDinnerToday && activeMeal === 'dinner'
                    ? 'text-amber-900 bg-amber-100 border-amber-300'
                    : 'text-blue-900 bg-blue-50 border-blue-200'
                }`}
              >
                <Clock
                  className={`w-3.5 h-3.5 ${
                    isSpecialDinnerToday && activeMeal === 'dinner'
                      ? 'text-amber-700'
                      : 'text-blue-700'
                  }`}
                />
                {currentMealDef.timing}
              </span>

              {isSpecialDinnerToday && activeMeal === 'dinner' && (
                <span className="text-xs font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-md border border-amber-400">
                  🎉 {todaySchedule.specialOccasion?.occasionName}
                </span>
              )}

              {todaySchedule.specialItem && !(isSpecialDinnerToday && activeMeal === 'dinner') && (
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Special: {todaySchedule.specialItem}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Utensils
                  className={`w-5 h-5 ${
                    isSpecialDinnerToday && activeMeal === 'dinner'
                      ? 'text-amber-600'
                      : 'text-blue-700'
                  }`}
                />
                Today's {currentMealDef.label} Menu ({currentDayName}):
              </h2>
              <div className="flex flex-wrap gap-2">
                {currentMealDef.menuItems.map((item, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${
                      isSpecialDinnerToday && activeMeal === 'dinner'
                        ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {isSpecialDinnerToday && activeMeal === 'dinner' && (
                      <span className="text-amber-600 mr-1">★</span>
                    )}
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Hostel 10 C & 10 D Ground Floor Dining Counters · Please mark your attendance once per meal session.
            </p>
          </div>

          {/* ATTENDANCE BUTTON & STATUS */}
          <div className="shrink-0 flex flex-col sm:items-end justify-center gap-2">
            {isCurrentMealMarked ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1 sm:text-right min-w-[260px]">
                <div className="flex items-center sm:justify-end gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Attendance Marked Successfully!</span>
                </div>
                {currentMealRecord && (
                  <div className="text-xs text-emerald-700 font-mono">
                    Recorded at:{' '}
                    {new Date(currentMealRecord.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                )}
                <div className="text-[11px] text-emerald-600">
                  Verification pass registered with Hostel 10 Mess
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleAttendanceClick(activeMeal)}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2 ${
                  isSpecialDinnerToday && activeMeal === 'dinner'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                    : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {isSpecialDinnerToday && activeMeal === 'dinner'
                    ? 'MARK SPECIAL DINNER ATTENDANCE'
                    : 'MARK MEAL ATTENDANCE'}
                </span>
              </button>
            )}

            {!isCurrentMealMarked && (
              <span className="text-[11px] text-slate-500 sm:text-right block">
                Tap button when receiving your meal tray
              </span>
            )}
          </div>
        </div>
      </div>

      {/* C. Other Meal Cards of the Day */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            All Meals of Today ({currentDayName})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Hostel 10 C & 10 D Dining Hall
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mealDefinitions.map((meal) => {
            const Icon = meal.icon;
            const isMarked = hasMarkedAttendance(
              attendanceRecords,
              currentStudent.id,
              meal.type,
              todayStr
            );
            const isCurrent = meal.type === activeMeal;

            const isSpecial = Boolean(meal.isSpecialDinner);

            return (
              <div
                key={meal.type}
                className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
                  isMarked
                    ? 'bg-white border-emerald-300 ring-1 ring-emerald-200'
                    : isCurrent && isSpecial
                    ? 'bg-gradient-to-b from-amber-50 to-orange-50/30 border-amber-500 ring-2 ring-amber-300 shadow-md'
                    : isCurrent
                    ? 'bg-white border-blue-500 ring-2 ring-blue-100'
                    : isSpecial
                    ? 'bg-gradient-to-b from-amber-50/50 to-white border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isMarked
                            ? 'bg-emerald-100 text-emerald-700'
                            : isSpecial
                            ? 'bg-amber-100 text-amber-700'
                            : isCurrent
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {meal.label}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isMarked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed
                      </span>
                    ) : isSpecial ? (
                      <span className="text-[11px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Special Feast
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md shrink-0">
                        Current Meal
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-mono mb-3">
                    {meal.timing}
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1 mb-4">
                    <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center justify-between">
                      <span>Menu:</span>
                      {isSpecial && (
                        <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                          Festive Specials
                        </span>
                      )}
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {meal.menuItems.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="truncate flex items-center gap-1.5">
                          <span
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              isSpecial ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          />
                          <span className={`truncate ${isSpecial ? 'font-semibold text-slate-900' : ''}`}>
                            {item}
                          </span>
                        </li>
                      ))}
                      {meal.menuItems.length > 4 && (
                        <li
                          className={`text-[11px] font-medium ${
                            isSpecial ? 'text-amber-800 font-bold' : 'text-blue-700'
                          }`}
                        >
                          +{meal.menuItems.length - 4} more items...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-100">
                  {isMarked ? (
                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Attendance Recorded</span>
                    </div>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      onClick={() => handleAttendanceClick(meal.type)}
                      className={`w-full py-2 rounded-lg text-white text-xs font-bold transition-colors ${
                        isSpecial
                          ? 'bg-amber-600 hover:bg-amber-700 shadow-xs'
                          : 'bg-blue-700 hover:bg-blue-800'
                      }`}
                    >
                      {isSpecial ? 'Mark Special Dinner' : 'Mark Attendance'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAttendanceClick(meal.type)}
                      className={`w-full py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        isSpecial
                          ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-100 text-amber-900 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                      title="Pre-mark or test attendance"
                    >
                      Mark for {meal.label.split(':')[0]}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Digital Mess Card Modal */}
      {showQrPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">
                MANIT Bhopal · Digital Mess Card
              </span>
              <button
                type="button"
                onClick={() => setShowQrPass(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-4 bg-gradient-to-b from-blue-900 to-blue-800 text-white rounded-xl shadow-inner space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Hostel 10 C/D Mess</span>
                <span className="text-blue-300 font-mono">
                  {currentStudent.feeDetails.messCardId}
                </span>
              </div>

              {/* QR representation */}
              <div className="bg-white p-3 rounded-lg inline-block mx-auto shadow-md">
                <div className="w-36 h-36 bg-slate-950 flex flex-col items-center justify-center p-2 rounded text-white font-mono text-[9px] text-center select-none">
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 border border-dashed border-slate-600">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i * 7 + 3) % 2 === 0 ? 'bg-white' : 'bg-slate-950'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base text-white">
                  {currentStudent.fullName}
                </h4>
                <p className="text-xs text-blue-200">
                  Wing {currentStudent.wing} · Room {currentStudent.roomNumber}
                </p>
                <p className="text-xs text-blue-300 font-mono">
                  Scholar: {currentStudent.scholarNumber}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/15 text-white text-[11px] font-semibold border border-white/20">
                  <span>Diet: {currentStudent.dietaryPreference || 'Pure Veg'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-700/60 flex items-center justify-between text-[11px] text-blue-200">
                <span>Fee Status: <strong className="text-emerald-300">{currentStudent.feeDetails.status}</strong></span>
                <span>Rebate: <strong className="text-white">{currentStudent.feeDetails.rebateDaysAvailable} days</strong></span>
              </div>
            </div>

            {/* Google Drive Status inside Pass */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  Google Drive Storage
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  {driveFolderName}
                </span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-tight">
                🔒 Stored directly on your personal Google Drive. AI does not retain your photo or room records.
              </p>
              <button
                type="button"
                onClick={handleSaveMessCardToDrive}
                disabled={isSavingToDrive}
                className="w-full mt-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSavingToDrive ? 'animate-spin' : ''}`} />
                <span>{isSavingToDrive ? 'Saving...' : 'Sync Mess Pass to My Drive'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Present this digital QR mess card at the counter scanner during dining hall entry.
            </p>

            <button
              type="button"
              onClick={() => setShowQrPass(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
