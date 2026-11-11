import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UtensilsCrossed,
  MessageSquare,
  Users,
  Building,
  ArrowRight,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onDemoLoginStudent: (scholarNo: string) => void;
  onDemoLoginAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onDemoLoginStudent,
  onDemoLoginAdmin,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* College Identity Bar */}
      <div className="bg-blue-900 text-white text-xs py-2 px-4 border-b border-blue-950">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">MAULANA AZAD NATIONAL INSTITUTE OF TECHNOLOGY</span>
            <span className="text-blue-300">·</span>
            <span className="text-blue-200">Bhopal, Madhya Pradesh (An Institute of National Importance)</span>
          </div>
          <div className="flex items-center gap-4 text-blue-200">
            <span>Hostel 10 (Wing 10C & Wing 10D)</span>
            <span>·</span>
            <span>Academic Session 2026–27</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 shadow-inner">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-700/60 border border-blue-400/30 text-xs font-medium text-blue-100 backdrop-blur-xs">
            <Building className="w-3.5 h-3.5 text-blue-300" />
            <span>Hostel 10 C & 10 D · Official Mess Management Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            MANIT Hostel 10 C/D – Mess Management System
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Welcome to Hostel 10 C/D Mess Management Portal.
            <span className="block mt-1 text-blue-200 text-base sm:text-lg">
              A smarter and simpler way to manage your daily mess attendance, check meal schedules, and share feedback.
            </span>
          </p>

          {/* Two Main CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-900 font-bold text-sm sm:text-base hover:bg-blue-50 shadow-lg shadow-blue-950/20 transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
            >
              <span>Login to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base border border-blue-400/40 shadow-lg shadow-blue-950/20 transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
            >
              <span>Register Now</span>
              <span className="text-xs font-normal text-blue-200">(@stu.manit.ac.in)</span>
            </button>
          </div>
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-xs text-blue-200 hover:text-white underline inline-flex items-center gap-1 transition-colors"
            >
              <span>Forgot password? Reset with your college email ID</span>
            </button>
          </div>

          {/* Portal Access & Real Student Registration Callout */}
          <div className="pt-8">
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md max-w-2xl mx-auto">
              <div className="text-xs font-medium text-blue-200 mb-2.5 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-semibold text-white">Official Registration Open for Real Students</span>
              </div>
              <p className="text-xs text-blue-100 text-center mb-3.5 max-w-lg mx-auto">
                No mock data: All 582 residential students across Wing 10C & Wing 10D can register directly with their institutional <span className="font-mono text-amber-300 font-bold">@stu.manit.ac.in</span> email ID to generate their digital mess card.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                >
                  <Users className="w-4 h-4 text-blue-200" />
                  <span>Register First Real Student</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5"
                >
                  <span>Student Login</span>
                </button>
                <button
                  type="button"
                  onClick={onDemoLoginAdmin}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-900" />
                  <span>Mess Admin Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Highlights Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              One-Click Daily Attendance
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Mark breakfast, lunch, snacks, and dinner directly during active meal windows with instant digital verification.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Weekly Authentic Timetable
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore 7-day curated menus, download official PDF timetables, and stay updated with Sunday feasts and special items.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Student Feedback Loop
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Submit 1-5 star ratings for individual meals, report hygiene or taste concerns directly to the chief mess warden.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Digital Mess Card & Pass
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Equipped with a secure QR pass, hostel wing tags (10C/10D), semester fee tracker, and mess rebate ledger.
            </p>
          </div>

        </div>
      </section>

      {/* Hostels & Capacity Information */}
      <section className="py-12 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 mb-2.5">
              582 Base Residential Students · Handles 2,000 Registrations at a Time
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Hostel 10 C & 10 D Dining Facility
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Serving all 582 residential students across Wing 10C (291 students) and Wing 10D (291 students) at MANIT Bhopal. The portal is architected to smoothly handle up to 2,000 registrations at a time. Double registration with the same college email ID is strictly prohibited.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-slate-900">Hostel 10 Wing C</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md">
                  Wing C: 291 Students
                </span>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ground Floor Dining Hall & Counter 1 & 2</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Biometric & Digital Mess Attendance verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated attendance logs by Scholar Number</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-slate-900">Hostel 10 Wing D</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-md">
                  Wing D: 291 Students
                </span>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ground Floor Dining Hall & Counter 3 & 4</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time meal consumption monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Strict anti-duplicate meal attendance enforcement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="text-slate-300 font-medium">
            MANIT Bhopal · Hostel 10 C/D Mess Management System
          </p>
          <p>
            Developed by Amrendra Krishna (Website Founder / Developer) · Mess Convenor - Nakul Sharma and Mess Co-Convener - Kanishk Mishra
          </p>
          <p className="text-slate-500 text-[11px]">
            © 2026 Maulana Azad National Institute of Technology, Bhopal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
