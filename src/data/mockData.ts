import { DaySchedule, FeedbackItem, MealAttendanceRecord, Student, TimetableDocument } from '../types';

export const INITIAL_STUDENTS: Student[] = [];

export const WEEKLY_MESS_TIMETABLE: DaySchedule[] = [
  {
    day: 'Monday',
    breakfast: [
      'Poha Jalebi',
      '2 Banana / 2 Eggs',
      'Chai / Dudh',
      'Sprouts',
      'Corn Flakes',
    ],
    lunch: [
      'Rajma, Rice',
      'Cucumber Raita',
      'Roti, Ghee',
      'Dal',
      'Achar and Salad',
    ],
    snacks: [
      'Dhokla / Pani Puri',
      'Tomato Chutney',
      'Green Chutney',
      'Tea',
    ],
    dinner: [
      'Bhindi Masala, Ghee',
      'Roti, Rice',
      'Dal',
      'Achar and Salad',
    ],
    specialItem: 'Dhokla / Pani Puri & Bhindi Masala',
  },
  {
    day: 'Tuesday',
    breakfast: [
      'Sandwich, Chutney',
      '2 Banana / 2 Eggs',
      'Chai / Dudh',
      'Sprouts',
      'Corn Flakes',
    ],
    lunch: [
      'Soya Chunks, Rice, Ghee',
      'Roti, Dal, Dahi',
      'Achar and Salad',
    ],
    snacks: [
      'Aloo Tikki Chaat',
      'Tomato Chutney',
      'Green Chutney',
      'Tea',
    ],
    dinner: [
      'Pudi, Aloo Sabzi',
      'Rice, Dal',
      'Achar and Salad',
      'Kheer',
    ],
    specialItem: 'Aloo Tikki Chaat & Kheer',
  },
  {
    day: 'Wednesday',
    breakfast: [
      'Uttapam, Chutney',
      '2 Banana / 2 Eggs',
      'Chai / Dudh',
      'Sprouts',
      'Corn Flakes',
    ],
    lunch: [
      'Chole, Rice, Ghee',
      'Roti, Daal, Dahi',
      'Achar and Salad',
    ],
    snacks: [
      'Pakora / Bhajiya',
      'Tomato Chutney',
      'Green Chutney',
      'Tea',
    ],
    dinner: [
      'Butter Paneer Masala / Palak Paneer / Egg Curry',
      'Jeera Rice, Dal',
      'Roti, Ghee',
      'Achar, Salad',
      'Custard / Halwa',
    ],
    specialItem: 'Butter Paneer / Egg Curry & Custard / Halwa',
  },
  {
    day: 'Thursday',
    breakfast: [
      'Methi Paratha, Chutney',
      '2 Banana / 2 Eggs',
      'Chai / Dudh',
      'Sprouts',
      'Corn Flakes',
    ],
    lunch: [
      'Sev Tamatar / Baigan Masala',
      'Rice, Ghee, Roti',
      'Dal, Chaanch',
      'Achar and Salad',
    ],
    snacks: [
      '2 Samosa / 2 Kachori',
      'Green Chutney',
      'Tea',
    ],
    dinner: [
      'Gobhi / Seasonal Veg',
      'Rice, Roti',
      'Dal Makhni, Dahi',
      'Achar and Salad',
    ],
    specialItem: '2 Samosa / 2 Kachori & Dal Makhni',
  },
  {
    day: 'Friday',
    breakfast: [
      'Sambar Vada',
      '2 Banana / 2 Eggs',
      'Chai / Dudh',
      'Sprouts',
      'Corn Flakes',
    ],
    lunch: [
      'Aloo Methi / Matar, Roti',
      'Ghee, Dal, Dahi',
      'Achar and Salad',
    ],
    snacks: [
      'Bhel',
      'Tomato Chutney',
      'Tea',
    ],
    dinner: [
      'Chole Bhature',
      'Imli Chutney, Rice',
      'Achar, Salad',
      'Gulab Jamun',
    ],
    specialItem: 'Chole Bhature & Gulab Jamun',
  },
  {
    day: 'Saturday',
    breakfast: [
      'Aloo Paratha, Dahi',
      '2 Banana / 2 Eggs',
      'Chai / Dudh',
      'Sprouts',
      'Corn Flakes',
    ],
    lunch: [
      'Kale Chane, Rice, Roti',
      'Ghee, Dal, Dahi',
      'Achar, Salad',
    ],
    snacks: [
      'Pasta',
      'Tea',
    ],
    dinner: [
      'Veg Biriyani',
      'Fryums',
      'Mint Chutney',
      'Salad',
    ],
    specialItem: 'Veg Biriyani & Pasta',
  },
  {
    day: 'Sunday',
    breakfast: [
      'Dosa Chutney, Sambhar',
      '2 Banana / 2 Eggs',
      'Chai / Dudh',
      'Sprouts',
      'Corn Flakes',
    ],
    lunch: [
      'Kadhi Pakode, Rice, Roti',
      'Ghee, Masala Aloo',
      'Achar, Salad',
    ],
    snacks: [
      'Vada Pao',
      'Green Chutney',
      'Tea',
    ],
    dinner: [
      'Kadahi Paneer / Kadahi Chicken',
      'Pulao / Jeera Rice',
      'Roti, Ghee',
      'Achar, Salad',
    ],
    specialItem: 'Kadahi Paneer / Chicken & Vada Pao',
  },
];

export const INITIAL_TIMETABLE_DOCS: TimetableDocument[] = [
  {
    id: 'doc-manit-official-001',
    title: 'Hostel 10 C/D Official Mess Menu (Weekly Timetable)',
    fileName: 'Hostel_Mess_Weekly_Timetable.png',
    fileSize: '1.8 MB',
    fileType: 'image',
    uploadedAt: 'Official Institute Circular',
    uploadedBy: 'Hostel 10 Mess Committee & Warden',
    downloadUrl: '/assets/aistudio/Hostel_Mess_Weekly_Timetable_7332021d.png',
  },
  {
    id: 'doc-manit-002',
    title: 'Hostel 10 C/D Mess Rules, Timings & Rebate Policy Circular',
    fileName: 'Mess_Guidelines_And_Rebate_Circular.pdf',
    fileSize: '820 KB',
    fileType: 'pdf',
    uploadedAt: 'Semester Circular',
    uploadedBy: 'Mess Committee Secretary',
    downloadUrl: '#',
  },
];

export const INITIAL_ATTENDANCE_RECORDS: MealAttendanceRecord[] = [];

export const INITIAL_FEEDBACK: FeedbackItem[] = [];

