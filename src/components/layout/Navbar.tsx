import React from 'react';
import { Student } from '../../types';
import { LogOut, ShieldCheck, UserCheck, Menu, Building2 } from 'lucide-react';

interface NavbarProps {
  adminName?: string;
  currentStudent: Student | null;
  isAdmin: boolean;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onToggleAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  adminName,
  currentStudent,
  isAdmin,
  activeTab,
  onNavigate,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  onToggleSidebar,
  onToggleAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            {(currentStudent || isAdmin) && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:bg-blue-800 transition-colors">
                M10
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 tracking-tight leading-tight group-hover:text-blue-700 transition-colors">
                  MANIT Bhopal · Hostel 10 C/D Mess
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Mess Card Management Portal
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Single-line Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {currentStudent && !isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className={`hover:text-blue-700 transition-colors whitespace-nowrap ${
                    activeTab === 'home' ? 'text-blue-700 font-semibold' : ''
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('timetable')}
                  className={`hover:text-blue-700 transition-colors whitespace-nowrap ${
                    activeTab === 'timetable' ? 'text-blue-700 font-semibold' : ''
                  }`}
                >
                  Mess Timetable
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('feedback')}
                  className={`hover:text-blue-700 transition-colors whitespace-nowrap ${
                    activeTab === 'feedback' ? 'text-blue-700 font-semibold' : ''
                  }`}
                >
                  Feedback
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className={`hover:text-blue-700 transition-colors whitespace-nowrap ${
                    activeTab === 'contact' ? 'text-blue-700 font-semibold' : ''
                  }`}
                >
                  Contact Us
                </button>
              </>
            ) : !currentStudent && !isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('timetable')}
                  className="hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  Weekly Menu
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  Hostel Helpdesk
                </button>
              </>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                Admin Control Session
              </span>
            )}
          </nav>

          {/* Zone 3: Primary Action / User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin: {adminName || 'Amrendra Krishna'}</span>
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Admin</span>
                </button>
              </div>
            ) : currentStudent ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  {currentStudent.profilePhoto ? (
                    <img
                      src={currentStudent.profilePhoto}
                      alt={currentStudent.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {currentStudent.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                      {currentStudent.fullName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Hostel {currentStudent.wing}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Logout"
                  aria-label="Logout from account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
                >
                  Register Now
                </button>
                <button
                  type="button"
                  onClick={onToggleAdmin}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Admin Portal"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Admin
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
