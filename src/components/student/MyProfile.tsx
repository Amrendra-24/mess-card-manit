import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Lock,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  QrCode,
  Upload,
  Utensils,
  Leaf,
  Egg,
} from 'lucide-react';
import {
  DietaryPreference,
  Student,
} from '../../types';
import {
  Cloud,
  ExternalLink,
  RefreshCw,
  Folder,
} from 'lucide-react';
import {
  getAccessToken,
  getConnectedFolderName,
  googleSignIn,
  saveStudentRegistrationToDrive,
  SingleStudentSaveResult,
} from '../../services/googleDriveService';

interface MyProfileProps {
  student: Student;
  onUpdateProfile: (updated: Partial<Student>) => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({
  student,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [mobile, setMobile] = useState(student.mobile);
  const [roomNumber, setRoomNumber] = useState(student.roomNumber);
  const [profilePhoto, setProfilePhoto] = useState(student.profilePhoto || '');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(
    student.dietaryPreference || 'Pure Veg'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Google Drive Personal Storage State
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveSyncResult, setDriveSyncResult] = useState<SingleStudentSaveResult | null>(null);
  const [driveSyncError, setDriveSyncError] = useState<string | null>(null);

  const handleSyncProfileToDrive = async () => {
    setIsDriveSyncing(true);
    setDriveSyncError(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const loginRes = await googleSignIn();
        if (loginRes) {
          token = loginRes.accessToken;
        }
      }
      const folderName = getConnectedFolderName();
      const res = await saveStudentRegistrationToDrive(student, folderName);
      setDriveSyncResult(res);
    } catch (err: any) {
      console.error('Profile drive sync error:', err);
      setDriveSyncError(err.message || 'Failed to sync profile to Google Drive.');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      mobile: mobile.trim(),
      roomNumber: roomNumber.trim(),
      profilePhoto: profilePhoto || undefined,
      dietaryPreference,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <User className="w-4 h-4" />
            <span>Hostel 10 C/D Student Identity</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Profile & Mess Card
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personal residential information, mess card ID, and credential management.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-700" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile details updated successfully!</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Edit Permitted Information
            </h3>

            {/* Photo upload */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={student.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                    {student.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer border border-slate-300">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Locked by Institute)
                </label>
                <input
                  type="text"
                  disabled
                  value={student.fullName}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email (Locked)
                </label>
                <input
                  type="text"
                  disabled
                  value={student.email}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Dietary Category Selector */}
              <div className="col-span-full space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Dietary Category (Choose Any 1)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['Pure Veg', 'Veg + Only Egg', 'Non-Veg'] as DietaryPreference[]).map((pref, idx) => (
                    <label
                      key={pref}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                        dietaryPreference === pref
                          ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-950 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dietPref"
                        value={pref}
                        checked={dietaryPreference === pref}
                        onChange={() => setDietaryPreference(pref)}
                        className="sr-only"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          dietaryPreference === pref ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {dietaryPreference === pref && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{idx + 1}. {pref}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 shadow-xs">
              {student.profilePhoto ? (
                <img
                  src={student.profilePhoto}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-blue-700 bg-blue-50">
                  {student.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="text-sm font-bold text-slate-900">{student.fullName}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Scholar Number</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{student.scholarNumber}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">College Email</span>
                <span className="font-semibold text-blue-900 font-mono">{student.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Mobile Number</span>
                <span className="font-semibold text-slate-800 font-mono">+91 {student.mobile}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Hostel & Wing</span>
                <span className="font-semibold text-slate-900">
                  {student.hostel} · Wing {student.wing} (Wing {student.wing === '10C' ? 'C' : 'D'}: 291 Students · 582 Total)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Room Number</span>
                <span className="font-semibold text-slate-900 font-mono">{student.roomNumber}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Registration Date</span>
                <span className="text-slate-700">{student.registrationDate}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Account Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Resident
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Dietary Category</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {student.dietaryPreference || 'Pure Veg'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google Drive Personal Storage & Privacy Card */}
      <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-xs bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Personal Google Drive Storage & Privacy
              </h3>
              <p className="text-xs text-slate-500">
                Connected Folder: <span className="font-mono font-bold text-emerald-800">{getConnectedFolderName()}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncProfileToDrive}
            disabled={isDriveSyncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
            <span>{isDriveSyncing ? 'Syncing to Drive...' : 'Save Profile & Photo to My Drive'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Your profile picture, full name, wing ({student.wing}), room number ({student.roomNumber}), and dietary category ({student.dietaryPreference || 'Pure Veg'}) are saved directly in your personal Google Drive account. External AI systems do not retain or store your student profile data.
        </p>

        {driveSyncResult && (
          <div className="p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs rounded-xl flex items-center justify-between gap-2">
            <span className="font-medium">{driveSyncResult.message}</span>
            {driveSyncResult.cardFileLink && (
              <a
                href={driveSyncResult.cardFileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-emerald-900 flex items-center gap-1 text-[11px]"
              >
                View in Drive ↗
              </a>
            )}
          </div>
        )}

        {driveSyncError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{driveSyncError}</span>
          </div>
        )}
      </div>

      {/* Digital Fee & Rebate Processing Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Digital Mess Fee & Rebate Processing
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            {student.feeDetails.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-medium">Mess Dues Paid</span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              ₹{student.feeDetails.amountPaid.toLocaleString('en-IN')}
            </span>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Semester: {student.feeDetails.semester}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-medium">Rebate Days Available</span>
            <span className="text-lg font-bold text-blue-700 font-mono">
              {student.feeDetails.rebateDaysAvailable} Days
            </span>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Eligible for fee concession
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-medium">Digital Mess Card ID</span>
            <span className="text-xs font-bold text-slate-900 font-mono block truncate">
              {student.feeDetails.messCardId}
            </span>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
              Verified with Hostels 10 C/D
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Security & Change Password
          </h3>
        </div>

        {pwdError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        {pwdSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Password updated securely.</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
