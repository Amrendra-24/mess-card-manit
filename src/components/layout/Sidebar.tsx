import React from 'react';
import {
  Home,
  CalendarDays,
  MessageSquarePlus,
  User,
  PhoneCall,
  LogOut,
  X,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { Student } from '../../types';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentStudent: Student | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  currentStudent,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home & Attendance',
      icon: Home,
      description: 'Daily meal attendance & cards',
    },
    {
      id: 'timetable',
      label: 'Mess Timetable',
      icon: CalendarDays,
      description: 'Weekly schedule & downloads',
    },
    {
      id: 'feedback',
      label: 'Feedback & Suggestions',
      icon: MessageSquarePlus,
      description: 'Rate meals & mess concerns',
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      description: 'Student mess card & room',
    },
    {
      id: 'contact',
      label: 'Contact Us',
      icon: PhoneCall,
      description: 'Hostel tech & mess committee',
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header inside drawer */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                M10
              </div>
              <span className="font-bold text-slate-800 text-sm">Hostel 10 C/D</span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student quick info banner */}
          {currentStudent && (
            <div className="p-4 mx-3 my-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                {currentStudent.profilePhoto ? (
                  <img
                    src={currentStudent.profilePhoto}
                    alt={currentStudent.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                    {currentStudent.fullName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {currentStudent.fullName}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <span className="font-semibold text-blue-700">Wing {currentStudent.wing}</span>
                    <span>·</span>
                    <span>{currentStudent.roomNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation links - Stack Overflow style */}
          <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Student Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 font-semibold border-r-2 border-blue-700 rounded-r-none'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex flex-col truncate">
                    <span className="leading-snug">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Hostel Status Footnote */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Mess Timings</span>
              <span className="text-emerald-700 font-semibold">Active</span>
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Breakfast:</span>
                <span className="font-mono text-slate-700">07:30 - 09:00</span>
              </div>
              <div className="flex justify-between">
                <span>Lunch:</span>
                <span className="font-mono text-slate-700">12:30 - 14:00</span>
              </div>
              <div className="flex justify-between">
                <span>Snacks:</span>
                <span className="font-mono text-slate-700">17:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>Dinner:</span>
                <span className="font-mono text-slate-700">19:30 - 21:30</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer: Logout */}
          <div className="p-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Account</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
