import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle,
  AlertCircle,
  Folder,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  RefreshCw,
  LogOut,
  Database,
  Users,
  ShieldCheck,
  Calendar,
  Sparkles,
  FolderPlus,
  Lock,
  Check,
  CreditCard,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  googleSignOut,
  initAuth,
  getAccessToken,
  syncAllToGoogleDrive,
  createDriveFolderInMyDrive,
  getConnectedFolderName,
  setConnectedFolderName,
  saveStudentRegistrationToDrive,
  DriveSyncSummary,
  SingleStudentSaveResult,
} from '../../services/googleDriveService';
import { DaySchedule, FeedbackItem, MealAttendanceRecord, Student } from '../../types';

interface GoogleDriveManagerProps {
  students: Student[];
  attendance: MealAttendanceRecord[];
  feedback: FeedbackItem[];
  weeklyTimetable: DaySchedule[];
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  students,
  attendance,
  feedback,
  weeklyTimetable,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Folder configuration & creation state
  const [currentConnectedFolder, setCurrentConnectedFolder] = useState<string>(getConnectedFolderName());
  const [newFolderNameInput, setNewFolderNameInput] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [folderCreateSuccess, setFolderCreateSuccess] = useState<string | null>(null);
  const [folderCreateError, setFolderCreateError] = useState<string | null>(null);
  const [createdFolderLink, setCreatedFolderLink] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<DriveSyncSummary | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Single student sync states
  const [singleStudentSyncId, setSingleStudentSyncId] = useState<string | null>(null);
  const [singleStudentResult, setSingleStudentResult] = useState<Record<string, SingleStudentSaveResult>>({});

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
      setSyncResult(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const folderToCreate = newFolderNameInput.trim();
    if (!folderToCreate) {
      setFolderCreateError('Please enter a folder name.');
      return;
    }

    setIsCreatingFolder(true);
    setFolderCreateError(null);
    setFolderCreateSuccess(null);
    setCreatedFolderLink(null);

    try {
      let currentToken = await getAccessToken();
      if (!currentToken) {
        const loginRes = await googleSignIn();
        if (loginRes) {
          setUser(loginRes.user);
          currentToken = loginRes.accessToken;
        }
      }

      const created = await createDriveFolderInMyDrive(folderToCreate);
      setCurrentConnectedFolder(created.name);
      setFolderCreateSuccess(`Folder '${created.name}' created in My Drive and connected to all student mess cards!`);
      setCreatedFolderLink(created.webViewLink || null);
      setNewFolderNameInput('');
    } catch (err: any) {
      console.error('Create folder error:', err);
      setFolderCreateError(err.message || 'Failed to create folder in Google Drive.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSyncSingleStudent = async (student: Student) => {
    setSingleStudentSyncId(student.id);
    try {
      let currentToken = await getAccessToken();
      if (!currentToken) {
        const loginRes = await googleSignIn();
        if (loginRes) {
          setUser(loginRes.user);
          currentToken = loginRes.accessToken;
        }
      }
      const result = await saveStudentRegistrationToDrive(student, currentConnectedFolder);
      setSingleStudentResult((prev) => ({
        ...prev,
        [student.id]: result,
      }));
    } catch (err: any) {
      console.error(`Sync student ${student.scholarNumber} error:`, err);
      setSyncError(err.message || `Failed to save ${student.fullName} to Google Drive.`);
    } finally {
      setSingleStudentSyncId(null);
    }
  };

  const handleSyncNow = async () => {
    const currentToken = await getAccessToken();
    if (!currentToken) {
      setSyncError('Please connect your Google Account first to sync data.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const summary = await syncAllToGoogleDrive(
        students,
        attendance,
        feedback,
        weeklyTimetable,
        user?.email || 'admin@manit.ac.in',
        currentConnectedFolder
      );
      setSyncResult(summary);
    } catch (err: any) {
      console.error('Sync to Google Drive failed:', err);
      setSyncError(err.message || 'Sync failed. Please check permissions and try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const studentsWithPhotos = students.filter((s) => !!s.profilePhoto);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-emerald-700/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-400/30">
              <Cloud className="w-3.5 h-3.5" />
              Google One & Google Drive Cloud Storage
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Hostel 10 Mess Cloud Storage Backup
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
              Back up student registrations, photos, attendance logs, and mess circulars into a dedicated folder
              titled <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-semibold">website data mess</span> and the photo album{' '}
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-semibold">Student Registration Photos</span> on your Google Drive storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing to Google Drive...' : 'Sync Now to Google Drive'}
              </button>
            )}
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Auth Status Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Google Account Connection
            </h3>
            <p className="text-sm text-stone-500 mt-0.5">
              Securely authenticate with your Google account to grant write permission for the mess data folder.
            </p>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-7 h-7 rounded-full border border-emerald-300"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-950 leading-tight">
                      {user.displayName || 'Connected Account'}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-mono leading-tight">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Disconnect Google Account"
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-stone-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthLoading}
                className="gsi-material-button inline-flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-xl bg-white hover:bg-stone-50 shadow-sm text-stone-700 text-sm font-medium transition-all cursor-pointer"
              >
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span>{isAuthLoading ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {syncError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Sync Success Banner */}
        {syncResult && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-900">{syncResult.message}</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Updated {syncResult.filesUpdated.length} files and {syncResult.uploadedPhotosCount} student photos at {syncResult.timestamp}.
                  </p>
                </div>
              </div>

              {syncResult.rootFolderLink && (
                <a
                  href={syncResult.rootFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  <Folder className="w-3.5 h-3.5" />
                  Open in Google Drive
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Zero AI Data Storage Privacy Guarantee */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white shadow-sm border border-emerald-500/40 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
            <h4 className="font-extrabold text-sm tracking-tight text-white">
              Zero AI Data Retention · 100% Personal Google Drive Sovereignty
            </h4>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            All student registration details—including <strong>portrait photos, student full names, hostel wings (10C & 10D), room numbers, dietary categories (Pure Veg, Veg + Egg, Non-Veg), and digital mess cards</strong>—are stored directly onto your personal Google Drive / Google One storage. AI models and systems <strong>never store, index, or retain</strong> any of your student data.
          </p>
        </div>

        {/* Create / Connect Folder in My Drive */}
        <div className="mt-6 p-5 bg-stone-50/80 rounded-xl border border-stone-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-600" />
                Make a New Folder in My Drive & Connect to Mess Cards
              </h4>
              <p className="text-xs text-stone-500">
                Create a dedicated folder in your Google Drive. All student registration data and mess cards connect to this folder.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-stone-200 text-xs shrink-0">
              <span className="text-stone-500">Active Connected Folder:</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentConnectedFolder}
              </span>
            </div>
          </div>

          <form onSubmit={handleCreateFolder} className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <div className="relative flex-1 w-full">
              <Folder className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={newFolderNameInput}
                onChange={(e) => setNewFolderNameInput(e.target.value)}
                placeholder="Enter new folder name (e.g. website data mess, Hostel 10 Mess 2026)"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={isCreatingFolder || !newFolderNameInput.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <FolderPlus className={`w-3.5 h-3.5 ${isCreatingFolder ? 'animate-spin' : ''}`} />
              <span>{isCreatingFolder ? 'Creating in My Drive...' : 'Create Folder & Connect'}</span>
            </button>
          </form>

          {folderCreateSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                {folderCreateSuccess}
              </span>
              {createdFolderLink && (
                <a
                  href={createdFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-emerald-950 flex items-center gap-1 text-[11px]"
                >
                  Open New Folder ↗
                </a>
              )}
            </div>
          )}

          {folderCreateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{folderCreateError}</span>
            </div>
          )}
        </div>

        {/* Folder Architecture & Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Connected Folder</span>
              <Folder className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-base font-bold text-stone-900 font-mono truncate" title={currentConnectedFolder}>
              {currentConnectedFolder}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Top-level Google Drive folder created in your personal Google One storage.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Photo Album Folder</span>
              <ImageIcon className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-base font-bold text-stone-900 font-mono">Student Registration Photos</p>
            <p className="text-xs text-stone-500 mt-1">
              {studentsWithPhotos.length} student portrait photos ready to sync ({students.length} total residents).
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Mess Cards Folder</span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-base font-bold text-stone-900 font-mono">Student Mess Cards</p>
            <p className="text-xs text-stone-500 mt-1">
              Individual JSON profiles and printable card receipts with room and wing details.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Database & Logs</span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-base font-bold text-stone-900 font-mono">Database & Logs</p>
            <p className="text-xs text-stone-500 mt-1">
              Full JSON backups of registrations, QR scans ({attendance.length}), and feedback ({feedback.length}).
            </p>
          </div>
        </div>
      </div>

      {/* Sync Content Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          Synchronized Files Specification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 font-mono">registered_students.json</p>
              <p className="text-xs text-stone-600 mt-0.5">
                Contains complete profiles of all registered residents: Full Name, Scholar Number, Wing (10C / 10D), Room Number, Mobile, and Fee Status.
              </p>
              <span className="inline-block mt-2 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {students.length} Registered Students
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 font-mono">Student Registration Photos/*</p>
              <p className="text-xs text-stone-600 mt-0.5">
                Every student portrait uploaded during registration is decoded from Base64 into high-res images named <code className="font-mono text-[11px] bg-stone-200 px-1 py-0.5 rounded">ScholarNo_Name.jpg</code>.
              </p>
              <span className="inline-block mt-2 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {studentsWithPhotos.length} Photos in Album
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 font-mono">attendance_logs.json</p>
              <p className="text-xs text-stone-600 mt-0.5">
                Full chronological logs of QR meal verifications across Breakfast, Lunch, Snacks, and Dinner.
              </p>
              <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {attendance.length} Total Meal Logs
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 font-mono">weekly_mess_timetable.json</p>
              <p className="text-xs text-stone-600 mt-0.5">
                7-day circular timetable containing daily menu items and any configured Special Occasion Dinners.
              </p>
              <span className="inline-block mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                7 Days Schedule
              </span>
            </div>
          </div>
        </div>

        {/* Action Callout */}
        <div className="mt-6 pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-600 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Directly integrates with your Google One storage quota via Google Drive OAuth. All files remain in your private Google account.
            </span>
          </div>

          {user ? (
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Uploading to website data mess...' : 'Sync to Google Drive Now'}
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isAuthLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow transition-all cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
              Sign in with Google to Enable Sync
            </button>
          )}
        </div>
      </div>

      {/* Student Photos Gallery Preview */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Student Registration Photos in Album
            </h3>
            <p className="text-xs text-stone-500">
              Photographs captured during student registration that are stored in the <span className="font-mono font-medium">website data mess / Student Registration Photos</span> album.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
            {studentsWithPhotos.length} with Photos
          </span>
        </div>

        {studentsWithPhotos.length === 0 ? (
          <div className="py-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No Student Photos Uploaded Yet</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              As real students from Wing 10C & Wing 10D register with their photograph, their portrait will appear here and sync to your Google Drive album.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {studentsWithPhotos.map((stu) => (
              <div
                key={stu.id}
                className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 mb-2 border border-stone-300 shadow-xs">
                  <img
                    src={stu.profilePhoto}
                    alt={stu.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-xs font-bold text-stone-800 truncate w-full" title={stu.fullName}>
                  {stu.fullName}
                </p>
                <p className="text-[11px] font-mono text-stone-500 truncate w-full">
                  {stu.scholarNumber}
                </p>
                <span className="mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Wing {stu.wing}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Mess Cards & Registration Cloud Sync Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Student Mess Cards & Registration Data Sync
            </h3>
            <p className="text-xs text-stone-500">
              Each student's photo, full name, wing, room number, dietary category, and digital mess card stored directly into{' '}
              <span className="font-mono font-medium text-emerald-800">{currentConnectedFolder} / Student Mess Cards & Profiles</span>.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            {students.length} Total Scholars Registered
          </span>
        </div>

        {students.length === 0 ? (
          <div className="py-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No Student Registrations Yet</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              When residents register from the starting page, their credentials and photos will appear here and can be backed up to your Google Drive folder.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone-50 text-stone-700 uppercase font-bold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3">Student & Photo</th>
                  <th className="py-3 px-3">Scholar No</th>
                  <th className="py-3 px-3">Wing & Room</th>
                  <th className="py-3 px-3">Diet Category</th>
                  <th className="py-3 px-3">Fee Status</th>
                  <th className="py-3 px-3 text-right">Drive Backup Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {students.map((stu) => {
                  const syncInfo = singleStudentResult[stu.id];
                  const isThisSyncing = singleStudentSyncId === stu.id;

                  return (
                    <tr key={stu.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {stu.profilePhoto ? (
                            <img
                              src={stu.profilePhoto}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-stone-300"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {stu.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-stone-900 block">{stu.fullName}</span>
                            <span className="text-[10px] text-stone-500">{stu.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-stone-800">
                        {stu.scholarNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-stone-800">
                          Wing {stu.wing} · {stu.roomNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
                          {stu.dietaryPreference || 'Pure Veg'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-emerald-700">
                          {stu.feeDetails?.status || 'Paid'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {syncInfo ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Synced to My Drive
                              </span>
                              {syncInfo.cardFileLink && (
                                <a
                                  href={syncInfo.cardFileLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-emerald-800 underline"
                                  title="Open MessCard.json in Google Drive"
                                >
                                  Card ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSyncSingleStudent(stu)}
                              disabled={isThisSyncing}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <RefreshCw className={`w-3 h-3 ${isThisSyncing ? 'animate-spin' : ''}`} />
                              <span>{isThisSyncing ? 'Saving...' : 'Sync to Drive'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
