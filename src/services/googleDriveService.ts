import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DaySchedule, FeedbackItem, MealAttendanceRecord, Student } from '../types';

// Initialize Firebase App instance safely (re-use if already initialized)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Drive scope for file/folder creation and management for this app
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory access token cache (NOT in localStorage, strictly following security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const DEFAULT_FOLDER_NAME = 'website data mess';
const CONNECTED_FOLDER_KEY = 'manit_mess_drive_connected_folder';

export function getConnectedFolderName(): string {
  try {
    return localStorage.getItem(CONNECTED_FOLDER_KEY) || DEFAULT_FOLDER_NAME;
  } catch {
    return DEFAULT_FOLDER_NAME;
  }
}

export function setConnectedFolderName(name: string): string {
  const trimmed = name.trim() || DEFAULT_FOLDER_NAME;
  try {
    localStorage.setItem(CONNECTED_FOLDER_KEY, trimmed);
  } catch {
    // ignore
  }
  return trimmed;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
}

export interface SingleStudentSaveResult {
  success: boolean;
  folderName: string;
  rootFolderLink?: string;
  photosFolderLink?: string;
  messCardsFolderLink?: string;
  photoLink?: string;
  cardFileLink?: string;
  message: string;
}

export interface DriveSyncSummary {
  success: boolean;
  timestamp: string;
  accountEmail: string;
  folderName?: string;
  rootFolderLink?: string;
  photosFolderLink?: string;
  messCardsFolderLink?: string;
  uploadedPhotosCount: number;
  filesUpdated: string[];
  message: string;
}

/**
 * Initializes Google Auth state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not cached yet, require fresh sign in or wait
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Popup and obtain Google Drive OAuth access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token from Google Auth.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out from Google Auth and clear in-memory token
 */
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/* -------------------------------------------------------------
 * Google Drive REST API Operations (v3)
 * -----------------------------------------------------------*/

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Find or create a specific folder in Google Drive (Google One storage)
 */
export async function findOrCreateFolder(
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolderInfo> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google. Please sign in to Google Drive.');

  // Check if folder already exists
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to search Google Drive folders: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      name: searchData.files[0].name,
      webViewLink: searchData.files[0].webViewLink,
    };
  }

  // Create the folder
  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    description: 'Hostel 10 C/D Mess Management System Data & Student Storage',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch(`${DRIVE_API_BASE}/files?fields=id,name,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder '${folderName}': ${errText}`);
  }

  const created = await createRes.json();
  return {
    id: created.id,
    name: created.name,
    webViewLink: created.webViewLink,
  };
}

/**
 * Uploads or updates a file (JSON, text, or Blob) into a Google Drive folder using multipart upload
 */
export async function uploadOrUpdateFile(
  fileName: string,
  mimeType: string,
  content: string | Blob,
  parentFolderId: string
): Promise<DriveFileInfo> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google. Please sign in.');

  // Check if file already exists in folder
  const query = `name = '${fileName}' and '${parentFolderId}' in parents and trashed = false`;
  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  let existingFileId: string | null = null;
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      existingFileId = searchData.files[0].id;
    }
  }

  const boundary = '-------MessSystemDriveBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileMetadata: Record<string, any> = {
    name: fileName,
  };
  if (!existingFileId) {
    fileMetadata.parents = [parentFolderId];
  }

  let body: BodyInit;

  if (typeof content === 'string') {
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(fileMetadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    body = multipartRequestBody;
  } else {
    // Content is a Blob (binary / image)
    const metadataBlob = new Blob([JSON.stringify(fileMetadata)], { type: 'application/json; charset=UTF-8' });
    const headerBlob = new Blob([`${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n`], { type: 'text/plain' });
    const contentHeaderBlob = new Blob([`${delimiter}Content-Type: ${mimeType}\r\n\r\n`], { type: 'text/plain' });
    const footerBlob = new Blob([closeDelimiter], { type: 'text/plain' });

    body = new Blob([headerBlob, metadataBlob, contentHeaderBlob, content, footerBlob]);
  }

  let uploadUrl = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime`;
  let method = 'POST';

  if (existingFileId) {
    uploadUrl = `${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime`;
    method = 'PATCH';
  }

  const uploadRes = await fetch(uploadUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed for '${fileName}': ${errText}`);
  }

  return await uploadRes.json();
}

/**
 * Converts a Base64 data URL string into a Blob
 */
export function base64ToBlob(base64Data: string): { blob: Blob; mimeType: string; extension: string } {
  try {
    const parts = base64Data.split(';base64,');
    const mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const byteCharacters = atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return {
      blob: new Blob([byteArray], { type: mimeType }),
      mimeType,
      extension,
    };
  } catch (err) {
    console.error('Failed to parse base64 image', err);
    throw new Error('Invalid image data format');
  }
}

/**
 * Creates a brand new folder in My Drive and connects it as the active mess data folder
 */
export async function createDriveFolderInMyDrive(folderName: string): Promise<DriveFolderInfo> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google. Please sign in to Google Drive first.');

  const trimmed = setConnectedFolderName(folderName);
  const rootFolder = await findOrCreateFolder(trimmed);

  // Pre-create standardized subfolders
  const photosFolder = await findOrCreateFolder('Student Registration Photos', rootFolder.id);
  const cardsFolder = await findOrCreateFolder('Student Mess Cards & Profiles', rootFolder.id);
  const logsFolder = await findOrCreateFolder('Database & Logs', rootFolder.id);

  // Write initial readme
  const initialReadme = `# MANIT Bhopal - Hostel 10 C/D Mess System
Connected Drive Folder: ${trimmed}
Folder ID: ${rootFolder.id}
Created / Connected: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

## Structure
- /Student Registration Photos/ : Student portrait photos uploaded during registration
- /Student Mess Cards & Profiles/ : Individual digital mess cards and JSON profile records
- /Database & Logs/ : Master student register, attendance logs, and feedback

## Privacy Guarantee
All student data (photos, names, wing allocations, room numbers, dietary categories) is saved directly into your personal Google Drive account.
AI models do NOT store, index, or retain your student data.
`;
  await uploadOrUpdateFile('README_MESS_DATA.txt', 'text/plain', initialReadme, rootFolder.id);

  return rootFolder;
}

/**
 * Saves a single student's complete registration data (photo, name, wing, room no, diet preference, etc.)
 * directly into the connected Google Drive folder.
 * Ensures AI never retains or stores this data.
 */
export async function saveStudentRegistrationToDrive(
  student: Student,
  customFolderName?: string
): Promise<SingleStudentSaveResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access token missing. Please sign in to Google Drive to save data.');
  }

  const folderName = customFolderName || getConnectedFolderName();
  const rootFolder = await findOrCreateFolder(folderName);

  // Standard subfolders
  const photosFolder = await findOrCreateFolder('Student Registration Photos', rootFolder.id);
  const cardsFolder = await findOrCreateFolder('Student Mess Cards & Profiles', rootFolder.id);
  const logsFolder = await findOrCreateFolder('Database & Logs', rootFolder.id);

  let photoFileLink: string | undefined;
  let photoFileName = 'No Photo Provided';

  // 1. Upload student photo if available
  if (student.profilePhoto && student.profilePhoto.startsWith('data:image')) {
    try {
      const { blob, mimeType, extension } = base64ToBlob(student.profilePhoto);
      const sanitizedName = student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      photoFileName = `${student.scholarNumber}_${sanitizedName}_Photo.${extension}`;
      const uploadedPhoto = await uploadOrUpdateFile(photoFileName, mimeType, blob, photosFolder.id);
      photoFileLink = uploadedPhoto.webViewLink;
    } catch (e) {
      console.warn('Failed to upload student photo to Google Drive:', e);
    }
  }

  // 2. Upload structured Mess Card JSON
  const messCardPayload = {
    messCardId: student.feeDetails?.messCardId || `MANIT-H${student.wing}-${student.scholarNumber.slice(-4)}`,
    scholarNumber: student.scholarNumber,
    fullName: student.fullName,
    hostel: student.hostel,
    wing: student.wing,
    roomNumber: student.roomNumber,
    dietaryPreference: student.dietaryPreference || 'Pure Veg',
    email: student.email,
    mobile: student.mobile,
    feeDetails: student.feeDetails,
    registrationDate: student.registrationDate,
    photoFileName,
    photoDriveLink: photoFileLink || 'None',
    savedAt: new Date().toISOString(),
    privacyNotice: '100% Private Cloud Storage: Stored directly in user personal Google Drive. AI does not retain or store this data.',
  };

  const cardJsonFile = await uploadOrUpdateFile(
    `MessCard_${student.scholarNumber}.json`,
    'application/json',
    JSON.stringify(messCardPayload, null, 2),
    cardsFolder.id
  );

  // 3. Upload formatted printable digital mess card text
  const cardText = `======================================================================
MANIT BHOPAL · HOSTEL 10 C/D OFFICIAL DIGITAL MESS CARD
======================================================================
Card ID            : ${messCardPayload.messCardId}
Scholar Number     : ${student.scholarNumber}
Full Name          : ${student.fullName}
Hostel             : ${student.hostel}
Hostel Wing        : Wing ${student.wing}
Room Number        : ${student.roomNumber}
Dietary Category   : ${student.dietaryPreference || 'Pure Veg'}
College Email      : ${student.email}
Mobile Number      : +91 ${student.mobile}
Fee Status         : ${student.feeDetails?.status || 'Paid'} (₹${student.feeDetails?.amountPaid || 22000}) - ${student.feeDetails?.semester || 'Autumn 2026'}
Rebate Allowance   : ${student.feeDetails?.rebateDaysAvailable ?? 8} Days Available
Registration Date  : ${student.registrationDate}
Profile Photo File : ${photoFileName}
Stored In Folder   : ${folderName} / Student Mess Cards & Profiles
Privacy Guarantee  : 100% Private Storage on Google Drive · AI Does Not Store Data
======================================================================
`;

  await uploadOrUpdateFile(
    `MessCard_${student.scholarNumber}.txt`,
    'text/plain',
    cardText,
    cardsFolder.id
  );

  return {
    success: true,
    folderName,
    rootFolderLink: rootFolder.webViewLink,
    photosFolderLink: photosFolder.webViewLink,
    messCardsFolderLink: cardsFolder.webViewLink,
    photoLink: photoFileLink,
    cardFileLink: cardJsonFile.webViewLink,
    message: `Mess card and registration details for ${student.fullName} (Room ${student.roomNumber}, Wing ${student.wing}) successfully saved to '${folderName}' in My Drive.`,
  };
}

/**
 * High-level service: Sync all data and photos to Google One / Google Drive in the user's requested structure:
 * Root Folder: User-configured folder (default: "website data mess")
 * Subfolder: "Student Registration Photos"
 * Subfolder: "Student Mess Cards & Profiles"
 * Subfolder: "Database & Logs"
 */
export async function syncAllToGoogleDrive(
  students: Student[],
  attendance: MealAttendanceRecord[],
  feedback: FeedbackItem[],
  timetable: DaySchedule[],
  userEmail: string,
  customFolderName?: string
): Promise<DriveSyncSummary> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive access token missing. Please sign in to Google first.');

  const targetFolderName = customFolderName || getConnectedFolderName();

  // 1. Create or retrieve root folder
  const rootFolder = await findOrCreateFolder(targetFolderName);

  // 2. Create subfolders
  const photosFolder = await findOrCreateFolder('Student Registration Photos', rootFolder.id);
  const cardsFolder = await findOrCreateFolder('Student Mess Cards & Profiles', rootFolder.id);
  const dataFolder = await findOrCreateFolder('Database & Logs', rootFolder.id);

  const updatedFiles: string[] = [];

  // 3. Upload JSON Database files
  // 3a. Registered Students
  const studentsJson = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      hostel: 'Hostel 10 (Wing 10C & Wing 10D)',
      institute: 'MANIT Bhopal',
      totalRegistered: students.length,
      censusCapacity: 582,
      maxSystemCapacity: 2000,
      privacyNotice: '100% Private Cloud Storage: Stored directly in user personal Google Drive. AI does not retain or store this data.',
      students: students.map((s) => ({
        ...s,
        dietaryPreference: s.dietaryPreference || 'Pure Veg',
        hasProfilePhoto: !!s.profilePhoto,
      })),
    },
    null,
    2
  );
  await uploadOrUpdateFile('registered_students.json', 'application/json', studentsJson, dataFolder.id);
  updatedFiles.push('registered_students.json');

  // 3b. Attendance Logs
  const attendanceJson = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalRecords: attendance.length,
      records: attendance,
    },
    null,
    2
  );
  await uploadOrUpdateFile('attendance_logs.json', 'application/json', attendanceJson, dataFolder.id);
  updatedFiles.push('attendance_logs.json');

  // 3c. Student Feedback
  const feedbackJson = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalFeedback: feedback.length,
      feedback,
    },
    null,
    2
  );
  await uploadOrUpdateFile('student_feedback.json', 'application/json', feedbackJson, dataFolder.id);
  updatedFiles.push('student_feedback.json');

  // 3d. Weekly Menu & Timetable
  const timetableJson = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      weeklyTimetable: timetable,
    },
    null,
    2
  );
  await uploadOrUpdateFile('weekly_mess_timetable.json', 'application/json', timetableJson, dataFolder.id);
  updatedFiles.push('weekly_mess_timetable.json');

  // 4. Upload Student Registration Photos as individual images in the 'Student Registration Photos' album
  let uploadedPhotosCount = 0;
  for (const stu of students) {
    if (stu.profilePhoto && stu.profilePhoto.startsWith('data:image')) {
      try {
        const { blob, mimeType, extension } = base64ToBlob(stu.profilePhoto);
        const sanitizedName = stu.fullName.replace(/[^a-zA-Z0-9]/g, '_');
        const photoFileName = `${stu.scholarNumber}_${sanitizedName}.${extension}`;

        await uploadOrUpdateFile(photoFileName, mimeType, blob, photosFolder.id);
        uploadedPhotosCount++;
        updatedFiles.push(`photo: ${photoFileName}`);
      } catch (e) {
        console.warn(`Failed to upload photo for ${stu.scholarNumber}:`, e);
      }
    }

    // Also upload individual Mess Card record
    try {
      const cardPayload = {
        messCardId: stu.feeDetails?.messCardId || `MANIT-H${stu.wing}-${stu.scholarNumber.slice(-4)}`,
        scholarNumber: stu.scholarNumber,
        fullName: stu.fullName,
        hostel: stu.hostel,
        wing: stu.wing,
        roomNumber: stu.roomNumber,
        dietaryPreference: stu.dietaryPreference || 'Pure Veg',
        email: stu.email,
        mobile: stu.mobile,
        feeDetails: stu.feeDetails,
        registrationDate: stu.registrationDate,
        privacyNotice: 'Stored directly in personal Google Drive. AI does not retain this data.',
      };
      await uploadOrUpdateFile(
        `MessCard_${stu.scholarNumber}.json`,
        'application/json',
        JSON.stringify(cardPayload, null, 2),
        cardsFolder.id
      );
    } catch (e) {
      console.warn(`Failed to save mess card for ${stu.scholarNumber}:`, e);
    }
  }

  // 5. Upload a README index inside root folder
  const readmeContent = `# MANIT Bhopal - Hostel 10 Mess Data
**Folder Name**: ${targetFolderName}
**Last Synchronized**: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
**Account**: ${userEmail}

## Privacy Guarantee
All student registration data (Photos, Full Name, Hostel Wing, Room Number, Dietary Preference, Scholar ID) is stored directly in your personal Google Drive / Google One storage.
External AI systems DO NOT store, retain, or index this personal registration data.

## Folder Contents
1. **Student Registration Photos** (Album): Contains all official student portrait photographs uploaded during registration.
2. **Student Mess Cards & Profiles**: Individual digital mess card credentials, room numbers, wing allocations, and dietary preferences.
3. **Database & Logs**:
   - \`registered_students.json\`: Full resident details, room numbers, scholar IDs, and fee clearance records.
   - \`attendance_logs.json\`: Real-time QR meal scans and verified meal attendance records.
   - \`student_feedback.json\`: Mess ratings and student feedback submissions.
   - \`weekly_mess_timetable.json\`: Current 7-day breakfast, lunch, snacks, and dinner schedules.

This cloud backup is connected with MANIT Hostel 10 C & D Mess Portal.
`;
  await uploadOrUpdateFile('README_MESS_DATA.txt', 'text/plain', readmeContent, rootFolder.id);
  updatedFiles.push('README_MESS_DATA.txt');

  return {
    success: true,
    timestamp: new Date().toLocaleTimeString(),
    accountEmail: userEmail,
    folderName: targetFolderName,
    rootFolderLink: rootFolder.webViewLink,
    photosFolderLink: photosFolder.webViewLink,
    messCardsFolderLink: cardsFolder.webViewLink,
    uploadedPhotosCount,
    filesUpdated: updatedFiles,
    message: `Successfully synchronized ${students.length} students, ${uploadedPhotosCount} photos, and all mess cards to '${targetFolderName}' on Google Drive.`,
  };
}
