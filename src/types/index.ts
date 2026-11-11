export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export type HostelWing = '10C' | '10D';

export type DietaryPreference = 'Pure Veg' | 'Veg + Only Egg' | 'Non-Veg';

export interface Student {
  id: string;
  scholarNumber: string;
  fullName: string;
  email: string;
  mobile: string;
  hostel: 'Hostel 10';
  wing: HostelWing;
  roomNumber: string;
  profilePhoto?: string;
  dietaryPreference?: DietaryPreference;
  registrationDate: string;
  status: 'active' | 'disabled';
  password?: string;
  feeDetails: {
    status: 'Paid' | 'Pending' | 'Exempt';
    amountPaid: number;
    semester: string;
    rebateDaysAvailable: number;
    messCardId: string;
  };
}

export interface MealAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  scholarNumber: string;
  wing: HostelWing;
  date: string; // YYYY-MM-DD
  meal: MealType;
  timestamp: string; // ISO string
  verifiedBy: string;
}

export interface MealMenu {
  meal: MealType;
  name: string;
  timing: string;
  items: string[];
  isSpecial?: boolean;
}

export interface SpecialOccasionConfig {
  isActive: boolean;
  occasionName: string;
  highlightNote?: string;
  specialDinnerItems?: string[];
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
  specialItem?: string;
  specialOccasion?: SpecialOccasionConfig;
}

export interface FeedbackItem {
  id: string;
  studentId: string;
  studentName: string;
  scholarNumber: string;
  wing: HostelWing;
  type: 'meal' | 'general';
  meal?: MealType;
  rating?: number;
  category?: 'Food Quality' | 'Taste' | 'Quantity' | 'Hygiene' | 'Service' | 'Cleanliness' | 'Mess Management' | 'Other';
  comment: string;
  createdAt: string;
  status: 'Under Review' | 'Reviewed' | 'Resolved';
  adminNotes?: string;
}

export interface TimetableDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'image';
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Chief Warden' | 'Mess Warden' | 'Mess Manager';
}
