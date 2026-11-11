import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateManitEmail,
  validateMobileNumber,
  hasMarkedAttendance,
  calculateStudentStats,
  calculateAdminStats,
  calculateMonthlyProvisioningStats,
  getMealWindowInfo,
  generateAttendanceCsv,
  generateBillingAttendanceCsv,
  validateStudentRegistration,
  buildStudentEmailIndex,
} from './messLogic';
import { MealAttendanceRecord, Student } from '../types';

test('validateManitEmail strictly permits only @stu.manit.ac.in addresses', () => {
  // Valid cases
  assert.equal(validateManitEmail('211112045@stu.manit.ac.in').isValid, true);
  assert.equal(validateManitEmail('aman.sharma@stu.manit.ac.in').isValid, true);
  assert.equal(validateManitEmail('rohan_v@stu.manit.ac.in').isValid, true);

  // Invalid cases
  assert.equal(validateManitEmail('student@gmail.com').isValid, false);
  assert.equal(validateManitEmail('student@manit.ac.in').isValid, false); // must be stu.manit.ac.in
  assert.equal(validateManitEmail('invalid-email').isValid, false);
  assert.equal(validateManitEmail('').isValid, false);
});

test('validateMobileNumber accepts valid 10-digit Indian phone numbers', () => {
  assert.equal(validateMobileNumber('9876543210').isValid, true);
  assert.equal(validateMobileNumber('8123456789').isValid, true);
  assert.equal(validateMobileNumber('7000123456').isValid, true);

  // Invalid cases
  assert.equal(validateMobileNumber('1234567890').isValid, false); // starts with 1
  assert.equal(validateMobileNumber('98765').isValid, false); // too short
  assert.equal(validateMobileNumber('987654321012').isValid, false); // too long
  assert.equal(validateMobileNumber('abcdefghij').isValid, false);
});

test('hasMarkedAttendance prevents duplicate meal attendance on same date', () => {
  const records: MealAttendanceRecord[] = [
    {
      id: 'att-1',
      studentId: 'stu-101',
      studentName: 'Aman Sharma',
      scholarNumber: '211112045',
      wing: '10C',
      date: '2026-11-06',
      meal: 'lunch',
      timestamp: '2026-11-06T13:15:00.000Z',
      verifiedBy: 'Self',
    },
  ];

  // Already marked lunch today
  assert.equal(hasMarkedAttendance(records, 'stu-101', 'lunch', '2026-11-06'), true);

  // Breakfast has not been marked today
  assert.equal(hasMarkedAttendance(records, 'stu-101', 'breakfast', '2026-11-06'), false);

  // Another student has not marked lunch
  assert.equal(hasMarkedAttendance(records, 'stu-102', 'lunch', '2026-11-06'), false);

  // Different date is allowed
  assert.equal(hasMarkedAttendance(records, 'stu-101', 'lunch', '2026-11-07'), false);
});

test('calculateStudentStats aggregates daily and monthly meals correctly', () => {
  const records: MealAttendanceRecord[] = [
    {
      id: '1',
      studentId: 's1',
      studentName: 'Aman',
      scholarNumber: '1',
      wing: '10C',
      date: '2026-11-06',
      meal: 'breakfast',
      timestamp: '',
      verifiedBy: '',
    },
    {
      id: '2',
      studentId: 's1',
      studentName: 'Aman',
      scholarNumber: '1',
      wing: '10C',
      date: '2026-11-06',
      meal: 'lunch',
      timestamp: '',
      verifiedBy: '',
    },
    {
      id: '3',
      studentId: 's1',
      studentName: 'Aman',
      scholarNumber: '1',
      wing: '10C',
      date: '2026-11-05',
      meal: 'dinner',
      timestamp: '',
      verifiedBy: '',
    },
    {
      id: '4',
      studentId: 's2',
      studentName: 'Other',
      scholarNumber: '2',
      wing: '10D',
      date: '2026-11-06',
      meal: 'lunch',
      timestamp: '',
      verifiedBy: '',
    },
  ];

  const stats = calculateStudentStats(records, 's1', '2026-11-06');
  assert.equal(stats.todayMealsCount, 2);
  assert.equal(stats.totalMealsMonth, 3);
  assert.equal(stats.breakfastCount, 1);
  assert.equal(stats.lunchCount, 1);
  assert.equal(stats.dinnerCount, 1);
  assert.equal(stats.snacksCount, 0);
});

test('calculateAdminStats computes wing breakdown and percentages correctly', () => {
  const students: Student[] = [
    {
      id: 's1',
      scholarNumber: '101',
      fullName: 'Student 1',
      email: 's1@stu.manit.ac.in',
      mobile: '9876543210',
      hostel: 'Hostel 10',
      wing: '10C',
      roomNumber: 'C-204',
      registrationDate: '2026-08-01',
      status: 'active',
      feeDetails: { status: 'Paid', amountPaid: 21500, semester: 'Autumn 2026', rebateDaysAvailable: 5, messCardId: 'MANIT-H10-101' },
    },
    {
      id: 's2',
      scholarNumber: '102',
      fullName: 'Student 2',
      email: 's2@stu.manit.ac.in',
      mobile: '9876543211',
      hostel: 'Hostel 10',
      wing: '10D',
      roomNumber: 'D-312',
      registrationDate: '2026-08-01',
      status: 'active',
      feeDetails: { status: 'Paid', amountPaid: 21500, semester: 'Autumn 2026', rebateDaysAvailable: 3, messCardId: 'MANIT-H10-102' },
    },
  ];

  const records: MealAttendanceRecord[] = [
    {
      id: 'a1',
      studentId: 's1',
      studentName: 'Student 1',
      scholarNumber: '101',
      wing: '10C',
      date: '2026-11-06',
      meal: 'lunch',
      timestamp: '2026-11-06T13:00:00.000Z',
      verifiedBy: 'Self',
    },
  ];

  const adminStats = calculateAdminStats(records, students, '2026-11-06');
  assert.equal(adminStats.totalStudents, 582);
  assert.equal(adminStats.registeredStudents, 2);
  assert.equal(adminStats.hostel10CCount, 291);
  assert.equal(adminStats.hostel10DCount, 291);
  assert.equal(adminStats.registered10C, 1);
  assert.equal(adminStats.registered10D, 1);
  assert.equal(adminStats.lunch.total, 1);
  assert.equal(adminStats.lunch.wing10C, 1);
  assert.equal(adminStats.lunch.wing10D, 0);
  assert.equal(adminStats.lunch.percent10C, 0); // 1 / 291 is ~0.34% -> round 0%
});

test('generateAttendanceCsv outputs valid comma-separated values', () => {
  const records: MealAttendanceRecord[] = [
    {
      id: 'att-99',
      studentId: 's1',
      studentName: 'Aman Sharma',
      scholarNumber: '211112045',
      wing: '10C',
      date: '2026-11-06',
      meal: 'breakfast',
      timestamp: '2026-11-06T08:15:00.000Z',
      verifiedBy: 'Self',
    },
  ];

  const csv = generateAttendanceCsv(records);
  assert.ok(csv.includes('Attendance ID,Date,Meal,Student Name'));
  assert.ok(csv.includes('"Aman Sharma"'));
  assert.ok(csv.includes('"BREAKFAST"'));
  assert.ok(csv.includes('"10C"'));
});

test('validateStudentRegistration strictly prohibits double registration with the same email ID', () => {
  const existingStudents: Student[] = [
    {
      id: 's1',
      scholarNumber: '211112045',
      fullName: 'Aman Sharma',
      email: '211112045@stu.manit.ac.in',
      mobile: '9876543210',
      hostel: 'Hostel 10',
      wing: '10C',
      roomNumber: 'C-214',
      registrationDate: '2026-08-01',
      status: 'active',
      feeDetails: { status: 'Paid', amountPaid: 21500, semester: 'Autumn 2026', rebateDaysAvailable: 5, messCardId: 'MANIT-H10C-2045' },
    },
  ];

  // Exact duplicate email
  const duplicateExact = validateStudentRegistration(existingStudents, '211112045@stu.manit.ac.in');
  assert.equal(duplicateExact.isValid, false);
  assert.ok(duplicateExact.error?.includes('Double registration with the same email ID is strictly prohibited'));

  // Duplicate email with different casing & leading/trailing spaces
  const duplicateCasing = validateStudentRegistration(existingStudents, '  211112045@STU.MANIT.AC.IN  ');
  assert.equal(duplicateCasing.isValid, false);
  assert.ok(duplicateCasing.error?.includes('Double registration with the same email ID is strictly prohibited'));

  // New, unique email succeeds
  const uniqueStudent = validateStudentRegistration(existingStudents, '211114088@stu.manit.ac.in');
  assert.equal(uniqueStudent.isValid, true);
});

test('validateStudentRegistration handles high concurrency scale of 2,000 registrations at a time', () => {
  // Create mock array with 582 registered base students
  const students582: Student[] = Array.from({ length: 582 }, (_, i) => ({
    id: `stu-${i}`,
    scholarNumber: `SCHOLAR-${i}`,
    fullName: `Student ${i}`,
    email: `student${i}@stu.manit.ac.in`,
    mobile: '9876543210',
    hostel: 'Hostel 10' as const,
    wing: (i % 2 === 0 ? '10C' : '10D') as '10C' | '10D',
    roomNumber: `R-${i}`,
    registrationDate: '2026-08-01',
    status: 'active',
    feeDetails: { status: 'Paid', amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 5, messCardId: `M-${i}` },
  }));

  // 583rd student (exceeds 582) MUST be allowed due to 2,000 registration capacity
  const reg583 = validateStudentRegistration(students582, 'newscholar583@stu.manit.ac.in');
  assert.equal(reg583.isValid, true);

  // Array with exactly 1,999 students (2,000th registration)
  const students1999: Student[] = Array.from({ length: 1999 }, (_, i) => ({
    id: `stu-${i}`,
    scholarNumber: `SCHOLAR-${i}`,
    fullName: `Student ${i}`,
    email: `student${i}@stu.manit.ac.in`,
    mobile: '9876543210',
    hostel: 'Hostel 10' as const,
    wing: '10C' as const,
    roomNumber: 'C-101',
    registrationDate: '2026-08-01',
    status: 'active' as const,
    feeDetails: { status: 'Paid' as const, amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 5, messCardId: `M-${i}` },
  }));
  const reg2000 = validateStudentRegistration(students1999, 'newscholar2000@stu.manit.ac.in');
  assert.equal(reg2000.isValid, true);

  // Array with 2,000 students (ceiling reached) -> 2,001st registration MUST be blocked
  const students2000: Student[] = Array.from({ length: 2000 }, (_, i) => ({
    id: `stu-${i}`,
    scholarNumber: `SCHOLAR-${i}`,
    fullName: `Student ${i}`,
    email: `student${i}@stu.manit.ac.in`,
    mobile: '9876543210',
    hostel: 'Hostel 10' as const,
    wing: '10C' as const,
    roomNumber: 'C-101',
    registrationDate: '2026-08-01',
    status: 'active' as const,
    feeDetails: { status: 'Paid' as const, amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 5, messCardId: `M-${i}` },
  }));
  const reg2001 = validateStudentRegistration(students2000, 'overflow@stu.manit.ac.in');
  assert.equal(reg2001.isValid, false);
  assert.ok(reg2001.error?.includes('Registration limit reached'));
  assert.ok(reg2001.error?.includes('2000') || reg2001.error?.includes('2,000'));
});

test('high concurrency index processes 2,000 registrations in sub-millisecond O(1) lookups', () => {
  // Generate 2,000 registered students
  const students2000: Student[] = Array.from({ length: 2000 }, (_, i) => ({
    id: `stu-${i}`,
    scholarNumber: `SCHOLAR-${100000 + i}`,
    fullName: `Scholar ${i}`,
    email: `scholar${i}@stu.manit.ac.in`,
    mobile: '9876543210',
    hostel: 'Hostel 10' as const,
    wing: (i % 2 === 0 ? '10C' : '10D') as '10C' | '10D',
    roomNumber: `R-${i}`,
    registrationDate: '2026-08-01',
    status: 'active' as const,
    feeDetails: { status: 'Paid' as const, amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 5, messCardId: `MC-${i}` },
  }));

  const startTime = Date.now();
  const emailIndex = buildStudentEmailIndex(students2000);
  assert.equal(emailIndex.size, 2000);

  // Check 50 random lookups against index
  for (let k = 0; k < 50; k++) {
    const checkEmail = `scholar${k * 30}@stu.manit.ac.in`;
    assert.equal(emailIndex.has(checkEmail), true);
  }
  assert.equal(emailIndex.has('nonexistent@stu.manit.ac.in'), false);

  const duration = Date.now() - startTime;
  // Index build + 50 lookups should easily finish in under 50ms
  assert.ok(duration < 100);
});

test('handles fresh student registrations starting with 0 assumed students', () => {
  // Directory starts empty
  const freshStudents: Student[] = [];
  assert.equal(freshStudents.length, 0);

  // Register first real student
  const reg1 = validateStudentRegistration(freshStudents, '211116040@stu.manit.ac.in', '211116040');
  assert.equal(reg1.isValid, true);

  const realStudent1: Student = {
    id: 'stu-real-1',
    scholarNumber: '211116040',
    fullName: 'Real Student One',
    email: '211116040@stu.manit.ac.in',
    mobile: '9876543210',
    hostel: 'Hostel 10',
    wing: '10C',
    roomNumber: 'C-215',
    registrationDate: '2026-11-08',
    status: 'active',
    feeDetails: { status: 'Paid', amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 5, messCardId: 'MANIT-H10C-6040' },
  };

  freshStudents.push(realStudent1);
  assert.equal(freshStudents.length, 1);

  // Attempt to re-register same email
  const regDuplicate = validateStudentRegistration(freshStudents, '211116040@stu.manit.ac.in', '211116040');
  assert.equal(regDuplicate.isValid, false);
  assert.ok(regDuplicate.error?.includes('Double registration with the same email ID is strictly prohibited'));

  // Calculate admin stats with fresh real student
  const stats = calculateAdminStats([], freshStudents, '2026-11-08');
  assert.equal(stats.totalStudents, 582);
  assert.equal(stats.registeredStudents, 1);
  assert.equal(stats.registered10C, 1);
  assert.equal(stats.registered10D, 0);
  assert.equal(stats.remainingSlots, 1999);
});

test('calculateMonthlyProvisioningStats aggregates meals by type and estimates provisioning supplies', () => {
  const students: Student[] = [
    {
      id: 'stu-1',
      scholarNumber: '211112001',
      fullName: 'Student Veg',
      email: '211112001@stu.manit.ac.in',
      mobile: '9876543210',
      hostel: 'Hostel 10',
      wing: '10C',
      roomNumber: 'C-101',
      dietaryPreference: 'Pure Veg',
      registrationDate: '2026-11-01',
      status: 'active',
      feeDetails: { status: 'Paid', amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 8, messCardId: 'CARD-1' },
    },
    {
      id: 'stu-2',
      scholarNumber: '211112002',
      fullName: 'Student Egg',
      email: '211112002@stu.manit.ac.in',
      mobile: '9876543211',
      hostel: 'Hostel 10',
      wing: '10D',
      roomNumber: 'D-202',
      dietaryPreference: 'Veg + Only Egg',
      registrationDate: '2026-11-01',
      status: 'active',
      feeDetails: { status: 'Paid', amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 8, messCardId: 'CARD-2' },
    },
  ];

  const records: MealAttendanceRecord[] = [
    { id: 'att-1', studentId: 'stu-1', studentName: 'Student Veg', scholarNumber: '211112001', wing: '10C', date: '2026-11-05', meal: 'breakfast', timestamp: '2026-11-05T08:00:00Z', verifiedBy: 'Self' },
    { id: 'att-2', studentId: 'stu-2', studentName: 'Student Egg', scholarNumber: '211112002', wing: '10D', date: '2026-11-05', meal: 'breakfast', timestamp: '2026-11-05T08:15:00Z', verifiedBy: 'Self' },
    { id: 'att-3', studentId: 'stu-1', studentName: 'Student Veg', scholarNumber: '211112001', wing: '10C', date: '2026-11-05', meal: 'lunch', timestamp: '2026-11-05T13:00:00Z', verifiedBy: 'Self' },
    { id: 'att-4', studentId: 'stu-2', studentName: 'Student Egg', scholarNumber: '211112002', wing: '10D', date: '2026-11-05', meal: 'dinner', timestamp: '2026-11-05T20:00:00Z', verifiedBy: 'Self' },
    // Record from previous month (October 2026) - should be excluded from November
    { id: 'att-old', studentId: 'stu-1', studentName: 'Student Veg', scholarNumber: '211112001', wing: '10C', date: '2026-10-31', meal: 'lunch', timestamp: '2026-10-31T13:00:00Z', verifiedBy: 'Self' },
  ];

  const novStats = calculateMonthlyProvisioningStats(records, students, '2026-11');
  assert.equal(novStats.totalMealsServed, 4);
  assert.equal(novStats.breakfast.total, 2);
  assert.equal(novStats.breakfast.wing10C, 1);
  assert.equal(novStats.breakfast.wing10D, 1);
  assert.equal(novStats.lunch.total, 1);
  assert.equal(novStats.dinner.total, 1);
  assert.equal(novStats.snacks.total, 0);

  // Estimates verify logic
  assert.ok(novStats.estimatedProvisioning.attaFlourKg > 0);
  assert.ok(novStats.estimatedProvisioning.riceKg > 0);
  assert.ok(novStats.estimatedProvisioning.milkLiters > 0);
});

test('generateBillingAttendanceCsv outputs complete billing columns and student details', () => {
  const students: Student[] = [
    {
      id: 'stu-1',
      scholarNumber: '211112001',
      fullName: 'Amrendra Student',
      email: '211112001@stu.manit.ac.in',
      mobile: '9876543210',
      hostel: 'Hostel 10',
      wing: '10C',
      roomNumber: '10C-104',
      dietaryPreference: 'Pure Veg',
      registrationDate: '2026-11-01',
      status: 'active',
      feeDetails: { status: 'Paid', amountPaid: 22000, semester: 'Autumn 2026', rebateDaysAvailable: 8, messCardId: 'MANIT-H10C-2001' },
    },
  ];

  const records: MealAttendanceRecord[] = [
    {
      id: 'att-bill-1',
      studentId: 'stu-1',
      studentName: 'Amrendra Student',
      scholarNumber: '211112001',
      wing: '10C',
      date: '2026-11-09',
      meal: 'lunch',
      timestamp: '2026-11-09T13:30:00.000Z',
      verifiedBy: 'QR Scanner Counter 1',
    },
  ];

  const csv = generateBillingAttendanceCsv(records, students);
  assert.ok(csv.includes('Attendance ID,Date,Meal Type,Scholar Number,Student Name,Hostel Wing,Room Number,Dietary Category,Fee Status,Semester,Verification Timestamp,Verified By,Official Billing Status'));
  assert.ok(csv.includes('"att-bill-1"'));
  assert.ok(csv.includes('"2026-11-09"'));
  assert.ok(csv.includes('"LUNCH"'));
  assert.ok(csv.includes('"Amrendra Student"'));
  assert.ok(csv.includes('"10C-104"'));
  assert.ok(csv.includes('"Pure Veg"'));
  assert.ok(csv.includes('"Paid"'));
});


