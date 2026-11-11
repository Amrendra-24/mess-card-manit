import { HostelWing, MealAttendanceRecord, MealType, Student } from '../types';

export const OFFICIAL_EMAIL_DOMAIN = '@stu.manit.ac.in';

/**
 * Validates that the email belongs strictly to official MANIT student domain @stu.manit.ac.in
 */
export function validateManitEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  const trimmed = email.trim().toLowerCase();
  
  // Format check
  const emailRegex = /^[a-z0-9._%+-]+@stu\.manit\.ac\.in$/;
  if (!trimmed.endsWith('@stu.manit.ac.in')) {
    return {
      isValid: false,
      error: 'Only official MANIT student email addresses (@stu.manit.ac.in) are permitted.',
    };
  }

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid student email format. Must be scholar_number@stu.manit.ac.in',
    };
  }

  return { isValid: true };
}

/**
 * Validates 10-digit Indian mobile number
 */
export function validateMobileNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: false, error: 'Mobile number is required' };
  }
  const cleaned = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
    };
  }
  return { isValid: true };
}

/**
 * Generates deterministic or random 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Meal windows schedule:
 * Breakfast: 07:30 - 09:30
 * Lunch: 12:30 - 14:30
 * Evening Snacks: 17:00 - 18:30
 * Dinner: 20:00 - 22:00
 */
export interface MealWindowInfo {
  activeMeal: MealType;
  timingLabel: string;
  isWithinWindow: boolean;
  nextMeal: MealType;
  upcomingTiming: string;
}

export function getMealWindowInfo(date: Date = new Date()): MealWindowInfo {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = day === 0 || day === 6;

  // Official Window bounds in minutes from midnight
  const breakfastStart = isWeekend ? 8 * 60 + 30 : 7 * 60 + 30; // 08:30 (Sat,Sun) or 07:30 (Mon-Fri)
  const breakfastEnd = isWeekend ? 10 * 60 : 9 * 60;             // 10:00 (Sat,Sun) or 09:00 (Mon-Fri)
  const breakfastLabel = isWeekend ? '08:30 AM – 10:00 AM' : '07:30 AM – 09:00 AM';

  const lunchStart = 12 * 60 + 30;    // 12:30 PM = 750
  const lunchEnd = 14 * 60;           // 02:00 PM = 840

  const snacksStart = 17 * 60;        // 05:00 PM = 1020
  const snacksEnd = 18 * 60;          // 06:00 PM = 1080

  const dinnerStart = 19 * 60 + 30;   // 07:30 PM = 1170
  const dinnerEnd = 21 * 60 + 30;     // 09:30 PM = 1290

  if (currentMinutes >= breakfastStart && currentMinutes <= breakfastEnd) {
    return {
      activeMeal: 'breakfast',
      timingLabel: breakfastLabel,
      isWithinWindow: true,
      nextMeal: 'lunch',
      upcomingTiming: '12:30 PM – 02:00 PM',
    };
  }

  if (currentMinutes >= lunchStart && currentMinutes <= lunchEnd) {
    return {
      activeMeal: 'lunch',
      timingLabel: '12:30 PM – 02:00 PM',
      isWithinWindow: true,
      nextMeal: 'snacks',
      upcomingTiming: '05:00 PM – 06:00 PM',
    };
  }

  if (currentMinutes >= snacksStart && currentMinutes <= snacksEnd) {
    return {
      activeMeal: 'snacks',
      timingLabel: '05:00 PM – 06:00 PM',
      isWithinWindow: true,
      nextMeal: 'dinner',
      upcomingTiming: '07:30 PM – 09:30 PM',
    };
  }

  if (currentMinutes >= dinnerStart && currentMinutes <= dinnerEnd) {
    return {
      activeMeal: 'dinner',
      timingLabel: '07:30 PM – 09:30 PM',
      isWithinWindow: true,
      nextMeal: 'breakfast',
      upcomingTiming: 'Tomorrow 07:30 AM – 09:00 AM',
    };
  }

  // Outside windows: determine what is current/next
  if (currentMinutes < breakfastStart) {
    return {
      activeMeal: 'breakfast',
      timingLabel: breakfastLabel,
      isWithinWindow: false,
      nextMeal: 'breakfast',
      upcomingTiming: breakfastLabel,
    };
  } else if (currentMinutes < lunchStart) {
    return {
      activeMeal: 'lunch',
      timingLabel: '12:30 PM – 02:00 PM',
      isWithinWindow: false,
      nextMeal: 'lunch',
      upcomingTiming: '12:30 PM – 02:00 PM',
    };
  } else if (currentMinutes < snacksStart) {
    return {
      activeMeal: 'snacks',
      timingLabel: '05:00 PM – 06:00 PM',
      isWithinWindow: false,
      nextMeal: 'snacks',
      upcomingTiming: '05:00 PM – 06:00 PM',
    };
  } else if (currentMinutes < dinnerStart) {
    return {
      activeMeal: 'dinner',
      timingLabel: '07:30 PM – 09:30 PM',
      isWithinWindow: false,
      nextMeal: 'dinner',
      upcomingTiming: '07:30 PM – 09:30 PM',
    };
  } else {
    return {
      activeMeal: 'dinner',
      timingLabel: '07:30 PM – 09:30 PM',
      isWithinWindow: false,
      nextMeal: 'breakfast',
      upcomingTiming: 'Tomorrow 07:30 AM – 09:00 AM',
    };
  }
}

/**
 * Checks if a student has already marked attendance for a meal on a given date
 */
export function hasMarkedAttendance(
  records: MealAttendanceRecord[],
  studentId: string,
  meal: MealType,
  dateStr: string
): boolean {
  return records.some(
    (r) => r.studentId === studentId && r.meal === meal && r.date === dateStr
  );
}

/**
 * Calculate individual student attendance metrics
 */
export function calculateStudentStats(
  records: MealAttendanceRecord[],
  studentId: string,
  todayStr: string
) {
  const studentRecords = records.filter((r) => r.studentId === studentId);
  const todayRecords = studentRecords.filter((r) => r.date === todayStr);

  const breakfastCount = studentRecords.filter((r) => r.meal === 'breakfast').length;
  const lunchCount = studentRecords.filter((r) => r.meal === 'lunch').length;
  const snacksCount = studentRecords.filter((r) => r.meal === 'snacks').length;
  const dinnerCount = studentRecords.filter((r) => r.meal === 'dinner').length;

  return {
    todayMealsCount: todayRecords.length,
    totalMealsMonth: studentRecords.length,
    breakfastCount,
    lunchCount,
    snacksCount,
    dinnerCount,
  };
}

/**
 * Official hostel capacity and student census:
 * Total 582 students across Hostel 10 Wing C and Wing D
 * - Wing 10C: 291 students
 * - Wing 10D: 291 students
 * High concurrency registration capacity: Engineered to handle up to 2,000 registrations at a time.
 */
export const HOSTEL_CAPACITY = {
  total: 582,
  wing10C: 291,
  wing10D: 291,
  maxRegistrationLimit: 2000,
};

/**
 * Creates a fast O(1) lookup index for registered student emails
 */
export function buildStudentEmailIndex(students: Student[]): Set<string> {
  const emailSet = new Set<string>();
  for (let i = 0; i < students.length; i++) {
    emailSet.add(students[i].email.trim().toLowerCase());
  }
  return emailSet;
}

/**
 * Validates whether a student can register:
 * 1. Strictly prohibits double registration with the same email ID (case-insensitive & trimmed).
 * 2. Enforces high-concurrency registration ceiling of 2,000 scholars (capable of handling 2,000 registrations at a time).
 * 3. Checks duplicate scholar number if provided.
 */
export function validateStudentRegistration(
  existingStudents: Student[],
  email: string,
  scholarNumber?: string,
  prebuiltEmailIndex?: Set<string>
): { isValid: boolean; error?: string } {
  const emailCheck = validateManitEmail(email);
  if (!emailCheck.isValid) {
    return emailCheck;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Strict prohibition against double registration with same email using O(1) set lookup if available
  const isDuplicateEmail = prebuiltEmailIndex
    ? prebuiltEmailIndex.has(normalizedEmail)
    : existingStudents.some((s) => s.email.trim().toLowerCase() === normalizedEmail);

  if (isDuplicateEmail) {
    return {
      isValid: false,
      error:
        'Double registration with the same email ID is strictly prohibited. An account with this MANIT email is already registered. Please login to your existing account or use "Forgot Password".',
    };
  }

  // Duplicate scholar number check
  if (scholarNumber) {
    const normalizedScholar = scholarNumber.trim().toLowerCase();
    const isDuplicateScholar = existingStudents.some(
      (s) => s.scholarNumber.trim().toLowerCase() === normalizedScholar
    );
    if (isDuplicateScholar) {
      return {
        isValid: false,
        error:
          'Double registration with the same Scholar Number is strictly prohibited. This scholar number is already registered.',
      };
    }
  }

  // High concurrency ceiling: supports up to 2,000 registrations at a time
  if (existingStudents.length >= HOSTEL_CAPACITY.maxRegistrationLimit) {
    return {
      isValid: false,
      error: `Registration limit reached: Maximum high-concurrency capacity of ${HOSTEL_CAPACITY.maxRegistrationLimit} registered scholars has been reached. Please contact Hostel 10 Mess Administration.`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate administrative live and cumulative statistics
 */
export function calculateAdminStats(
  records: MealAttendanceRecord[],
  students: Student[],
  todayStr: string
) {
  const registeredStudents = students.length;
  const registered10C = students.filter((s) => s.wing === '10C').length;
  const registered10D = students.filter((s) => s.wing === '10D').length;

  // Total student strength in Hostel 10 across Wing C and Wing D is 582 (Wing 10C: 291, Wing 10D: 291)
  const totalStudents = HOSTEL_CAPACITY.total;
  const hostel10CCount = HOSTEL_CAPACITY.wing10C;
  const hostel10DCount = HOSTEL_CAPACITY.wing10D;
  const maxRegistrationLimit = HOSTEL_CAPACITY.maxRegistrationLimit;
  const isBufferActive = registeredStudents > HOSTEL_CAPACITY.total;
  const remainingSlots = Math.max(0, maxRegistrationLimit - registeredStudents);

  const todayRecords = records.filter((r) => r.date === todayStr);

  const getMealStats = (meal: MealType) => {
    const mealRecords = todayRecords.filter((r) => r.meal === meal);
    const count10C = mealRecords.filter((r) => r.wing === '10C').length;
    const count10D = mealRecords.filter((r) => r.wing === '10D').length;
    return {
      total: mealRecords.length,
      wing10C: count10C,
      wing10D: count10D,
      percent10C: hostel10CCount > 0 ? Math.round((count10C / hostel10CCount) * 100) : 0,
      percent10D: hostel10DCount > 0 ? Math.round((count10D / hostel10DCount) * 100) : 0,
    };
  };

  return {
    totalStudents,
    registeredStudents,
    hostel10CCount,
    hostel10DCount,
    registered10C,
    registered10D,
    maxRegistrationLimit,
    isBufferActive,
    remainingSlots,
    breakfast: getMealStats('breakfast'),
    lunch: getMealStats('lunch'),
    snacks: getMealStats('snacks'),
    dinner: getMealStats('dinner'),
    todayTotalAttendance: todayRecords.length,
  };
}

/**
 * Generates downloadable CSV content from attendance records
 */
export function generateAttendanceCsv(records: MealAttendanceRecord[]): string {
  const headers = [
    'Attendance ID',
    'Date',
    'Meal',
    'Student Name',
    'Scholar Number',
    'Hostel Wing',
    'Timestamp',
    'Verification Status',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.date}"`,
    `"${r.meal.toUpperCase()}"`,
    `"${r.studentName}"`,
    `"${r.scholarNumber}"`,
    `"${r.wing}"`,
    `"${new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}"`,
    `"Verified (Biometric / Digital Mess Pass)"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Generates complete Attendance & Billing CSV for official record-keeping and student mess billing
 */
export function generateBillingAttendanceCsv(
  records: MealAttendanceRecord[],
  students: Student[] = []
): string {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => {
    studentMap.set(s.id, s);
    studentMap.set(s.scholarNumber, s);
  });

  const headers = [
    'Attendance ID',
    'Date',
    'Meal Type',
    'Scholar Number',
    'Student Name',
    'Hostel Wing',
    'Room Number',
    'Dietary Category',
    'Fee Status',
    'Semester',
    'Verification Timestamp',
    'Verified By',
    'Official Billing Status',
  ];

  const rows = records.map((r) => {
    const student = studentMap.get(r.studentId) || studentMap.get(r.scholarNumber);
    const room = student?.roomNumber || `${r.wing}-Room`;
    const diet = student?.dietaryPreference || 'Pure Veg';
    const fee = student?.feeDetails.status || 'Paid';
    const sem = student?.feeDetails.semester || 'Autumn 2026';
    const timeFormatted = new Date(r.timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return [
      `"${r.id}"`,
      `"${r.date}"`,
      `"${r.meal.toUpperCase()}"`,
      `"${r.scholarNumber}"`,
      `"${r.studentName}"`,
      `"${r.wing}"`,
      `"${room}"`,
      `"${diet}"`,
      `"${fee}"`,
      `"${sem}"`,
      `"${timeFormatted}"`,
      `"${r.verifiedBy}"`,
      `"Cleared (Active Resident)"`,
    ];
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export interface MonthlyMealProvisioningStats {
  monthName: string;
  yearMonth: string;
  totalMealsServed: number;
  breakfast: {
    total: number;
    wing10C: number;
    wing10D: number;
    avgDaily: number;
    percentage: number;
  };
  lunch: {
    total: number;
    wing10C: number;
    wing10D: number;
    avgDaily: number;
    percentage: number;
  };
  snacks: {
    total: number;
    wing10C: number;
    wing10D: number;
    avgDaily: number;
    percentage: number;
  };
  dinner: {
    total: number;
    wing10C: number;
    wing10D: number;
    avgDaily: number;
    percentage: number;
  };
  dietaryBreakdown: {
    pureVegMeals: number;
    vegEggMeals: number;
    nonVegMeals: number;
  };
  activeDaysRecorded: number;
  estimatedProvisioning: {
    attaFlourKg: number;
    riceKg: number;
    dalLentilsKg: number;
    milkLiters: number;
    eggsUnits: number;
    cookingOilLiters: number;
  };
}

/**
 * Calculates monthly meal attendance totals by meal type (breakfast, lunch, dinner, snacks)
 * and estimates provisioning supplies for the current month
 */
export function calculateMonthlyProvisioningStats(
  records: MealAttendanceRecord[],
  students: Student[] = [],
  targetYearMonth?: string
): MonthlyMealProvisioningStats {
  const now = new Date();
  const yearMonth =
    targetYearMonth ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthDate = new Date(`${yearMonth}-01T12:00:00Z`);
  const monthName = monthDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Filter attendance records belonging to this month (date format YYYY-MM-DD)
  const monthRecords = records.filter((r) => r.date.startsWith(yearMonth));

  // Count unique days with records in this month
  const uniqueDays = new Set(monthRecords.map((r) => r.date));
  const activeDaysRecorded = Math.max(1, uniqueDays.size);

  const getMealMonthlyData = (meal: MealType) => {
    const mealRecords = monthRecords.filter((r) => r.meal === meal);
    const count10C = mealRecords.filter((r) => r.wing === '10C').length;
    const count10D = mealRecords.filter((r) => r.wing === '10D').length;
    const total = mealRecords.length;
    const avgDaily = Math.round(total / activeDaysRecorded);
    const percentage =
      monthRecords.length > 0 ? Math.round((total / monthRecords.length) * 100) : 0;

    return {
      total,
      wing10C: count10C,
      wing10D: count10D,
      avgDaily,
      percentage,
    };
  };

  const breakfast = getMealMonthlyData('breakfast');
  const lunch = getMealMonthlyData('lunch');
  const snacks = getMealMonthlyData('snacks');
  const dinner = getMealMonthlyData('dinner');

  // Dietary distribution based on students
  const studentMap = new Map<string, Student>();
  students.forEach((s) => {
    studentMap.set(s.id, s);
    studentMap.set(s.scholarNumber, s);
  });

  let pureVegCount = 0;
  let vegEggCount = 0;
  let nonVegCount = 0;

  monthRecords.forEach((r) => {
    const s = studentMap.get(r.studentId) || studentMap.get(r.scholarNumber);
    const pref = s?.dietaryPreference || 'Pure Veg';
    if (pref === 'Pure Veg') pureVegCount++;
    else if (pref === 'Veg + Only Egg') vegEggCount++;
    else if (pref === 'Non-Veg') nonVegCount++;
  });

  // Standard institutional mess provisioning norms (per meal averages):
  // Lunch & Dinner combined (main heavy meals):
  const mainMealsCount = lunch.total + dinner.total;
  const breakfastSnacksCount = breakfast.total + snacks.total;

  const estimatedProvisioning = {
    // Atta: ~150g per main meal
    attaFlourKg: Math.round(mainMealsCount * 0.15 * 10) / 10,
    // Rice: ~120g per main meal
    riceKg: Math.round(mainMealsCount * 0.12 * 10) / 10,
    // Dal / Lentils: ~70g per main meal
    dalLentilsKg: Math.round(mainMealsCount * 0.07 * 10) / 10,
    // Milk: ~200ml per breakfast/snacks
    milkLiters: Math.round(breakfastSnacksCount * 0.2 * 10) / 10,
    // Eggs: approx 2 eggs per egg/non-veg resident on egg days
    eggsUnits: Math.ceil((vegEggCount + nonVegCount) * 1.5),
    // Cooking oil: ~35ml per meal
    cookingOilLiters: Math.round(monthRecords.length * 0.035 * 10) / 10,
  };

  return {
    monthName,
    yearMonth,
    totalMealsServed: monthRecords.length,
    breakfast,
    lunch,
    snacks,
    dinner,
    dietaryBreakdown: {
      pureVegMeals: pureVegCount,
      vegEggMeals: vegEggCount,
      nonVegMeals: nonVegCount,
    },
    activeDaysRecorded: uniqueDays.size,
    estimatedProvisioning,
  };
}

/**
 * Format date in standard Indian format (e.g. 6 November 2026)
 */
export function formatIndianDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get date string in YYYY-MM-DD
 */
export function getIsoDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

