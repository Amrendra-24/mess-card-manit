import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  User,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Student } from '../../types';
import { generateOtp, validateManitEmail } from '../../utils/messLogic';

// Authorized administrator whitelist requested by institute administration
export const AUTHORIZED_ADMIN_NAMES: Record<string, string> = {
  amrendra: 'Amrendra Krishna',
  'amrendra krishna': 'Amrendra Krishna',
  nakul: 'Nakul Sharma',
  'nakul sharma': 'Nakul Sharma',
  kanishk: 'Kanishk Mishra',
  'kanishk mishra': 'Kanishk Mishra',
  bahubali: 'Bahubali',
};

export const ADMIN_SECURITY_PASSWORD = 'Mess@#2026';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (student: Student) => void;
  onAdminLoginSuccess: (adminName?: string) => void;
  onSwitchToRegister: () => void;
  onResetPassword?: (email: string, newPassword: string) => void;
  students: Student[];
  initialMode?: 'student' | 'admin' | 'forgot';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onAdminLoginSuccess,
  onSwitchToRegister,
  onResetPassword,
  students,
  initialMode = 'student',
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin' | 'forgot'>(initialMode);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMsg(null);
      if (initialMode === 'admin') {
        setPassword('');
      }
    }
  }, [isOpen, initialMode]);

  // Forgot password flow state
  const [resetEmail, setResetEmail] = useState('');
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [enteredResetOtp, setEnteredResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  if (!isOpen) return null;

  // Student login submission
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const emailTrim = email.trim().toLowerCase();
    const student = students.find((s) => s.email.toLowerCase() === emailTrim);

    if (!student) {
      setErrorMsg('No registered student account found for this email. Please check your email or Register first.');
      setIsSubmitting(false);
      return;
    }

    if (student.status === 'disabled') {
      setErrorMsg('This student account has been temporarily disabled by Hostel 10 administration.');
      setIsSubmitting(false);
      return;
    }

    // Check custom password if set
    if (student.password && student.password !== password) {
      setErrorMsg('Incorrect password. If you forgot your password, you can reset it below.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(student);
      onClose();
    }, 350);
  };

  // Admin login submission: strictly Amrendra, Nakul, Kanishk, Bahubali & Mess@#2026
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const nameKey = adminName.trim().toLowerCase();

    if (!nameKey) {
      setErrorMsg('Please enter your administrator name.');
      setIsSubmitting(false);
      return;
    }

    const matchedAdmin = AUTHORIZED_ADMIN_NAMES[nameKey];
    if (!matchedAdmin) {
      setErrorMsg('Access Denied: You are not authorized to log into the admin dashboard.');
      setIsSubmitting(false);
      return;
    }

    if (password !== ADMIN_SECURITY_PASSWORD) {
      setErrorMsg('Incorrect administrator password.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onAdminLoginSuccess(matchedAdmin);
      onClose();
    }, 350);
  };

  // Quick fill demo helpers
  const handleQuickFill = (type: 'aman' | 'rohan' | 'amrendra' | 'nakul' | 'kanishk' | 'bahubali') => {
    setErrorMsg(null);
    if (type === 'aman') {
      setActiveTab('student');
      const aman = students.find((s) => s.scholarNumber === '211112045');
      setEmail('211112045@stu.manit.ac.in');
      setPassword(aman?.password || 'password123');
    } else if (type === 'rohan') {
      setActiveTab('student');
      const rohan = students.find((s) => s.scholarNumber === '211114088');
      setEmail('211114088@stu.manit.ac.in');
      setPassword(rohan?.password || 'password123');
    } else if (type === 'amrendra') {
      setActiveTab('admin');
      setAdminName('Amrendra');
      setPassword(ADMIN_SECURITY_PASSWORD);
    } else if (type === 'nakul') {
      setActiveTab('admin');
      setAdminName('Nakul');
      setPassword(ADMIN_SECURITY_PASSWORD);
    } else if (type === 'kanishk') {
      setActiveTab('admin');
      setAdminName('Kanishk');
      setPassword(ADMIN_SECURITY_PASSWORD);
    } else if (type === 'bahubali') {
      setActiveTab('admin');
      setAdminName('Bahubali');
      setPassword(ADMIN_SECURITY_PASSWORD);
    }
  };

  // Switch to Forgot Password with prefilled email if available
  const handleSwitchToForgot = (prefillEmail?: string) => {
    setErrorMsg(null);
    setActiveTab('forgot');
    if (prefillEmail) {
      setResetEmail(prefillEmail);
      const student = students.find((s) => s.email.toLowerCase() === prefillEmail.trim().toLowerCase());
      if (student) setMatchedStudent(student);
    } else if (email) {
      setResetEmail(email);
      const student = students.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
      if (student) setMatchedStudent(student);
    }
  };

  // Trigger Forgot Password OTP
  const handleSendResetOtp = () => {
    setErrorMsg(null);
    const emailTrim = resetEmail.trim().toLowerCase();
    const validation = validateManitEmail(emailTrim);
    if (!validation.isValid) {
      setErrorMsg('Please enter a valid official MANIT student email ending in @stu.manit.ac.in');
      return;
    }

    const student = students.find((s) => s.email.toLowerCase() === emailTrim);
    if (!student) {
      setErrorMsg('No registered student account was found with this email ID. Please check the spelling or Register.');
      setMatchedStudent(null);
      return;
    }

    setMatchedStudent(student);
    const code = generateOtp();
    setResetOtpCode(code);
    setResetOtpSent(true);
    setEnteredResetOtp(code); // Pre-fill for seamless user testing
    setResendTimer(30);

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Verify OTP and Save New Password
  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resetOtpSent) {
      setErrorMsg('Please click "Send Verification OTP" first.');
      return;
    }

    if (enteredResetOtp.trim() !== resetOtpCode) {
      setErrorMsg('Incorrect 6-digit OTP code. Please enter the valid code sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match. Please ensure both fields match.');
      return;
    }

    // Persist new password
    if (onResetPassword) {
      onResetPassword(resetEmail.trim().toLowerCase(), newPassword);
    }

    setResetSuccess(true);
  };

  // Login immediately after reset
  const handleLoginImmediately = () => {
    const student = students.find((s) => s.email.toLowerCase() === resetEmail.trim().toLowerCase());
    if (student) {
      const updatedStudent = { ...student, password: newPassword };
      onLoginSuccess(updatedStudent);
      onClose();
    } else {
      setActiveTab('student');
      setEmail(resetEmail);
      setPassword(newPassword);
      setResetSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Header */}
        <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-300" />
            <div>
              <h2 className="text-base font-bold text-white">
                {activeTab === 'forgot' ? 'Reset Account Password' : 'Portal Login · Hostel 10 C/D'}
              </h2>
              <p className="text-xs text-blue-200">
                MANIT Bhopal Mess Management System
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
            aria-label="Close login modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation / Role Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'student'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleSwitchToForgot();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'forgot'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Forgot Password</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col gap-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
              {errorMsg.includes('forgot your password') && (
                <button
                  type="button"
                  onClick={() => handleSwitchToForgot(email)}
                  className="text-left text-xs font-bold text-blue-800 underline pl-6 hover:text-blue-900"
                >
                  Click here to Reset Password with email ID
                </button>
              )}
            </div>
          )}

          {activeTab === 'forgot' ? (
            /* =========================================================
               FORGOT PASSWORD / MAKE NEW PASSWORD FLOW
               ========================================================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                    <span>Create / Reset Password</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify with your college email ID and set a new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('student');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Login</span>
                </button>
              </div>

              {resetSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      New Password Created Successfully!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Your password for <strong className="font-mono">{resetEmail}</strong> has been updated.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleLoginImmediately}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Log In to Dashboard Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('student');
                        setEmail(resetEmail);
                        setPassword(newPassword);
                        setResetSuccess(false);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-semibold transition-colors"
                    >
                      Return to Login
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-4">
                  {/* Step 1: College Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered College Email ID (@stu.manit.ac.in)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            setErrorMsg(null);
                          }}
                          placeholder="scholar_number@stu.manit.ac.in"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendResetOtp}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shrink-0 transition-colors shadow-2xs"
                      >
                        {resetOtpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {/* Student Verification Match Banner */}
                  {matchedStudent && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-950 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{matchedStudent.fullName}</div>
                        <div className="text-[11px] text-blue-800">
                          Hostel 10 (Wing {matchedStudent.wing}) · Scholar No: {matchedStudent.scholarNumber}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Verified Scholar
                      </span>
                    </div>
                  )}

                  {/* Step 2 & 3: Once OTP is sent */}
                  {resetOtpSent && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      {/* OTP Notification Pill */}
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-blue-900 block">
                            Verification OTP Code:
                          </span>
                          <span className="font-mono font-bold text-sm tracking-widest text-blue-900">
                            {resetOtpCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEnteredResetOtp(resetOtpCode)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
                        >
                          Autofill OTP
                        </button>
                      </div>

                      {/* OTP Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Enter 6-Digit OTP
                          </label>
                          {resendTimer > 0 && (
                            <span className="text-[11px] text-slate-400">
                              Resend in {resendTimer}s
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={enteredResetOtp}
                          onChange={(e) => setEnteredResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="••••••"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono text-center tracking-[0.3em] font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Make New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Create a strong password (min 6 chars)"
                            className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                            aria-label="Toggle password visibility"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Re-enter your new password"
                            className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                            aria-label="Toggle confirm password visibility"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Requirements check */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className={`flex items-center gap-1 ${newPassword.length >= 6 ? 'text-emerald-700 font-bold' : ''}`}>
                          <Check className="w-3 h-3" />
                          Min 6 characters
                        </span>
                        <span className={`flex items-center gap-1 ${newPassword && newPassword === confirmNewPassword ? 'text-emerald-700 font-bold' : ''}`}>
                          <Check className="w-3 h-3" />
                          Passwords match
                        </span>
                      </div>

                      {/* Save Button */}
                      <button
                        type="submit"
                        className="w-full py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Verify OTP & Save New Password</span>
                      </button>
                    </div>
                  )}

                  {!resetOtpSent && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                      💡 <strong>Quick Step:</strong> Enter your official MANIT email ID and click <strong>Send OTP</strong>. You'll receive a verification code and can immediately set your new password.
                    </div>
                  )}
                </form>
              )}
            </div>
          ) : (
            /* =========================================================
               STANDARD STUDENT & ADMIN LOGIN FORM
               ========================================================= */
            <form onSubmit={activeTab === 'student' ? handleStudentLogin : handleAdminLogin} className="space-y-4">
              {activeTab === 'student' ? (
                /* Student Email Field */
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College Email (@stu.manit.ac.in)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="scholar_number@stu.manit.ac.in"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                  </div>
                </div>
              ) : (
                /* Administrator Name Field */
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Administrator Name
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Host Authorized Only
                    </span>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => {
                        setAdminName(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Enter name"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {activeTab === 'student' ? 'Password' : 'Password'}
                  </label>
                  {activeTab === 'student' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchToForgot(email)}
                      className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-amber-600" />
                      <span>Forgot Password?</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
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

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember Session</span>
                </label>
                {activeTab === 'student' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchToForgot(email)}
                    className="text-[11px] text-slate-500 hover:text-blue-700 underline"
                  >
                    Reset Password
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300'
                    : 'bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300'
                }`}
              >
                {isSubmitting
                  ? 'Authenticating...'
                  : activeTab === 'student'
                  ? 'Login to Student Dashboard'
                  : 'Login to Admin Panel'}
              </button>

              {/* Quick Fill Demo buttons (Only for Student Accounts) */}
              {activeTab === 'student' && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 mb-2 font-medium text-center">
                    Quick Fill Test Student Accounts:
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('aman')}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      Aman (10C)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('rohan')}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      Rohan (10D)
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'student' && (
                <div className="text-center pt-2 text-xs text-slate-600">
                  New resident in Hostel 10?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToRegister();
                    }}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Register Now
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
