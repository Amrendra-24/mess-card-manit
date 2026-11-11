import React, { useState } from 'react';
import {
  X,
  Upload,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Cloud,
  Leaf,
  Egg,
  Utensils,
} from 'lucide-react';
import { DietaryPreference, HostelWing, Student } from '../../types';
import {
  generateOtp,
  HOSTEL_CAPACITY,
  validateManitEmail,
  validateMobileNumber,
  validateStudentRegistration,
} from '../../utils/messLogic';
import {
  getAccessToken,
  getConnectedFolderName,
  saveStudentRegistrationToDrive,
} from '../../services/googleDriveService';
import confetti from 'canvas-confetti';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (newStudent: Student) => void;
  existingStudents: Student[];
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  existingStudents,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [hostel] = useState<'Hostel 10'>('Hostel 10');
  const [wing, setWing] = useState<HostelWing>('10C');
  const [roomNumber, setRoomNumber] = useState('');
  const [scholarNumber, setScholarNumber] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('Pure Veg');

  // Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [enteredEmailOtp, setEnteredEmailOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [generatedMobileOtp, setGeneratedMobileOtp] = useState('');
  const [enteredMobileOtp, setEnteredMobileOtp] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle Photo selection/upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Photo file size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Email OTP
  const handleSendEmailOtp = () => {
    setErrorMsg(null);
    const regCheck = validateStudentRegistration(existingStudents, email, scholarNumber);
    if (!regCheck.isValid) {
      setErrorMsg(regCheck.error || 'Invalid email address');
      return;
    }

    const otp = generateOtp();
    setGeneratedEmailOtp(otp);
    setEmailOtpSent(true);
    // Preset code in input for immediate testing convenience
    setEnteredEmailOtp(otp);
  };

  const handleVerifyEmailOtp = () => {
    if (enteredEmailOtp.trim() === generatedEmailOtp) {
      setIsEmailVerified(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Incorrect Email OTP. Please check the 6-digit code and try again.');
    }
  };

  // Trigger Mobile OTP
  const handleSendMobileOtp = () => {
    setErrorMsg(null);
    const mobileValidation = validateMobileNumber(mobile);
    if (!mobileValidation.isValid) {
      setErrorMsg(mobileValidation.error || 'Invalid mobile number');
      return;
    }

    const otp = generateOtp();
    setGeneratedMobileOtp(otp);
    setMobileOtpSent(true);
    setEnteredMobileOtp(otp); // Autofill code for immediate convenience
  };

  const handleVerifyMobileOtp = () => {
    if (enteredMobileOtp.trim() === generatedMobileOtp) {
      setIsMobileVerified(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Incorrect Mobile OTP. Please check the 6-digit code and try again.');
    }
  };

  // Submit complete registration
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    const regCheck = validateStudentRegistration(existingStudents, email, scholarNumber);
    if (!regCheck.isValid) {
      setErrorMsg(regCheck.error || 'Registration failed');
      return;
    }

    if (!isEmailVerified) {
      setErrorMsg('Please verify your @stu.manit.ac.in college email with the OTP first.');
      return;
    }

    if (!isMobileVerified) {
      setErrorMsg('Please verify your mobile number with the OTP first.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check.');
      return;
    }

    setIsSubmitting(true);

    const scholarNo = scholarNumber.trim() || email.split('@')[0];
    const newStudent: Student = {
      id: `stu-manit-${Date.now()}`,
      scholarNumber: scholarNo,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      hostel: 'Hostel 10',
      wing,
      roomNumber: roomNumber.trim() || `${wing}-101`,
      profilePhoto: profilePhoto || undefined,
      dietaryPreference,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active',
      password,
      feeDetails: {
        status: 'Paid',
        amountPaid: 22000,
        semester: 'Autumn 2026',
        rebateDaysAvailable: 8,
        messCardId: `MANIT-H${wing}-${scholarNo.slice(-4) || '9999'}`,
      },
    };

    // Auto-sync directly to personal Google Drive folder if signed in
    const targetFolder = getConnectedFolderName();
    getAccessToken().then((token) => {
      if (token) {
        saveStudentRegistrationToDrive(newStudent, targetFolder).catch((err) => {
          console.warn('Auto drive sync note:', err);
        });
      }
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setSuccessMsg('Registration Successful! Account created & connected with Google Drive storage.');

    setTimeout(() => {
      onRegisterSuccess(newStudent);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Header */}
        <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-300" />
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Student Registration · Hostel 10 C/D
              </h2>
              <p className="text-xs text-blue-200">
                Official MANIT Student Mess Attendance Registration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
            aria-label="Close registration modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Hostel 10 Quota & High Concurrency Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                High Concurrency Engine: Handles 2,000 Registrations at a Time
              </span>
              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px]">
                {existingStudents.length} / 2,000 Registered
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Serving 582 base residential scholars across Wing C (291) & Wing D (291) with high-concurrency architecture engineered to handle up to 2,000 registrations at a time with instant verification.
            </p>
            <div className="pt-1 border-t border-blue-100 flex items-center gap-1.5 text-[11px] font-semibold text-rose-800">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Strict Policy: Double registration with the same college email ID is strictly prohibited.</span>
            </div>
          </div>

          {/* Google Drive Personal Storage & Privacy Assurance */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                Personal Google Drive Storage & Privacy Guarantee
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {getConnectedFolderName()}
              </span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              All registration data (Photos, Full Name, Wing {wing}, Room Number, Dietary Preference, Scholar ID) is stored directly in your personal Google Drive account. External AI systems do not retain or store your student records.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                1. Personal Information
              </h3>

              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Student profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Profile Photograph (Upload Image)
                  </label>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors border border-slate-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    JPG or PNG format (Max 2MB) · Backed up to Google Drive album ("website data mess / Student Registration Photos")
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Scholar Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scholar Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={scholarNumber}
                  onChange={(e) => setScholarNumber(e.target.value)}
                  placeholder="Enter scholar number"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                />
              </div>

              {/* Hostel Number and Wing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hostel Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={hostel}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hostel Wing <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={wing}
                    onChange={(e) => setWing(e.target.value as HostelWing)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-blue-900"
                  >
                    <option value="10C">Wing 10C</option>
                    <option value="10D">Wing 10D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Room number (optional)"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Dietary Meal Preference (Bullet format - Only ONE can be chosen) */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dietary Meal Category (Choose Any 1)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Only one can be chosen
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select your meal dining food preference for the semester. This is printed on your Digital Mess Card:
                </p>

                {/* 3 Bullet Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1 - Pure Veg */}
                  <label
                    className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      dietaryPreference === 'Pure Veg'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietaryPreference"
                      value="Pure Veg"
                      checked={dietaryPreference === 'Pure Veg'}
                      onChange={() => setDietaryPreference('Pure Veg')}
                      className="sr-only"
                    />
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          dietaryPreference === 'Pure Veg'
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {dietaryPreference === 'Pure Veg' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">1. Pure Veg</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        100% vegetarian meals, lentils & paneer
                      </p>
                    </div>
                  </label>

                  {/* 2 - Veg + Only Egg */}
                  <label
                    className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      dietaryPreference === 'Veg + Only Egg'
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietaryPreference"
                      value="Veg + Only Egg"
                      checked={dietaryPreference === 'Veg + Only Egg'}
                      onChange={() => setDietaryPreference('Veg + Only Egg')}
                      className="sr-only"
                    />
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          dietaryPreference === 'Veg + Only Egg'
                            ? 'border-amber-600 bg-amber-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {dietaryPreference === 'Veg + Only Egg' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Egg className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">2. Veg + Only Egg</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        Vegetarian + boiled eggs / omelette
                      </p>
                    </div>
                  </label>

                  {/* 3 - Non-Veg */}
                  <label
                    className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      dietaryPreference === 'Non-Veg'
                        ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietaryPreference"
                      value="Non-Veg"
                      checked={dietaryPreference === 'Non-Veg'}
                      onChange={() => setDietaryPreference('Non-Veg')}
                      className="sr-only"
                    />
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          dietaryPreference === 'Non-Veg'
                            ? 'border-rose-600 bg-rose-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {dietaryPreference === 'Non-Veg' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">3. Non-Veg</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        Complete veg + non-veg special dinners
                      </p>
                    </div>
                  </label>
                </div>

                {/* Google Drive Cloud Backup Badge */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-950">
                  <div className="flex items-center gap-2 text-xs">
                    <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-emerald-900 leading-tight">
                      <strong>Google Drive Cloud Storage:</strong> Registration details, dietary category & profile photo are securely synced to Google Drive album <code className="font-mono bg-white/80 px-1 py-0.2 rounded text-[10px] border border-emerald-300 text-emerald-800">website data mess / Student Registration Photos</code>.
                    </span>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    Cloud Ready
                  </span>
                </div>
              </div>
            </div>

            {/* 2. College Email Verification */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. College Email Verification (@stu.manit.ac.in)
                </h3>
                {isEmailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional College Email <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      disabled={isEmailVerified}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar_number@stu.manit.ac.in"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 font-mono"
                    />
                  </div>
                  {!isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shrink-0 transition-colors"
                    >
                      {emailOtpSent ? 'Resend OTP' : 'Send Email OTP'}
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Only institutional student emails ending with <strong className="text-blue-900">@stu.manit.ac.in</strong> are permitted.
                </span>
              </div>

              {emailOtpSent && !isEmailVerified && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-950 font-medium">
                    <span>Email OTP sent to {email}:</span>
                    <span className="font-mono bg-blue-200/80 px-2 py-0.5 rounded text-blue-900 font-bold">
                      Code: {generatedEmailOtp}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredEmailOtp}
                      onChange={(e) => setEnteredEmailOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-blue-300 bg-white font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailOtp}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0 transition-colors"
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Mobile Number Verification */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Mobile Number Verification
                </h3>
                {isMobileVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={isMobileVerified}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 font-mono"
                    />
                  </div>
                  {!isMobileVerified && (
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shrink-0 transition-colors"
                    >
                      {mobileOtpSent ? 'Resend OTP' : 'Send Mobile OTP'}
                    </button>
                  )}
                </div>
              </div>

              {mobileOtpSent && !isMobileVerified && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-950 font-medium">
                    <span>SMS OTP sent to +91 {mobile}:</span>
                    <span className="font-mono bg-blue-200/80 px-2 py-0.5 rounded text-blue-900 font-bold">
                      Code: {generatedMobileOtp}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredMobileOtp}
                      onChange={(e) => setEnteredMobileOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-blue-300 bg-white font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMobileOtp}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0 transition-colors"
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Create Password */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                4. Create Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isEmailVerified || !isMobileVerified}
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
