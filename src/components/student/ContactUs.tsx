import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  MessageCircle,
  Code2,
  Users2,
  Building2,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  Edit3,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ContactDetails {
  developerName: string;
  developerPhone: string;
  developerEmail: string;
  nakulName: string;
  nakulPhone: string;
  kanishkName: string;
  kanishkPhone: string;
  institutionalEmail: string;
}

const DEFAULT_CONTACTS: ContactDetails = {
  developerName: 'Amrendra Krishna',
  developerPhone: '+91 94159 69974',
  developerEmail: 'amrendrakrishna19@gmail.com',
  nakulName: 'Nakul Sharma',
  nakulPhone: '+91 77479 33219',
  kanishkName: 'Kanishk Mishra',
  kanishkPhone: '+91 88583 22008',
  institutionalEmail: 'hostel10mess@stu.manit.ac.in',
};

const CONTACTS_STORAGE_KEY = 'manit_h10_contacts_v2';

export const ContactUs: React.FC = () => {
  const [contacts, setContacts] = useState<ContactDetails>(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONTACTS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load contacts from localStorage', e);
    }
    return DEFAULT_CONTACTS;
  });

  const [isEditingPhones, setIsEditingPhones] = useState(false);
  const [editForm, setEditForm] = useState<ContactDetails>(contacts);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    setEditForm(contacts);
  }, [contacts]);

  const cleanNumber = (num: string) => {
    const digits = num.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  const getTelUri = (num: string) => {
    const digits = num.replace(/[^0-9]/g, '');
    return `tel:${digits.length === 10 ? `+91${digits}` : `+${digits}`}`;
  };

  const handleSave = () => {
    setContacts(editForm);
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(editForm));
    } catch (e) {
      console.warn('Failed to save contacts', e);
    }
    setIsEditingPhones(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleReset = () => {
    setEditForm(DEFAULT_CONTACTS);
    setContacts(DEFAULT_CONTACTS);
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(DEFAULT_CONTACTS));
    } catch (e) {
      console.warn('Failed to reset contacts', e);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <PhoneCall className="w-4 h-4" />
            <span>Hostel 10 C/D Support Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Contact Support & Mess Committee
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect directly with technical support or hostel mess permission coordinators.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveToast && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Contacts Updated
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (isEditingPhones) {
                handleSave();
              } else {
                setEditForm(contacts);
                setIsEditingPhones(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-colors shadow-2xs"
          >
            {isEditingPhones ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Save Contact Changes</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                <span>Edit Contact Numbers</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contact Numbers Editor Panel */}
      {isEditingPhones && (
        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <div>
              <p className="font-bold text-amber-900">
                Official Contact Numbers Configuration
              </p>
              <p className="text-[11px] text-amber-800">
                Update the official contact directory for Hostel 10 C & 10 D. Changes save to browser storage.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Website Developer Name
              </label>
              <input
                type="text"
                value={editForm.developerName}
                onChange={(e) => setEditForm({ ...editForm, developerName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Website Developer Mobile
              </label>
              <input
                type="text"
                value={editForm.developerPhone}
                onChange={(e) => setEditForm({ ...editForm, developerPhone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Official Developer Email
              </label>
              <input
                type="email"
                value={editForm.developerEmail}
                onChange={(e) => setEditForm({ ...editForm, developerEmail: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Mess Convenor (Nakul Sharma)
              </label>
              <input
                type="text"
                value={editForm.nakulPhone}
                onChange={(e) => setEditForm({ ...editForm, nakulPhone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Mess Co-Convener (Kanishk Mishra)
              </label>
              <input
                type="text"
                value={editForm.kanishkPhone}
                onChange={(e) => setEditForm({ ...editForm, kanishkPhone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80">
            <button
              type="button"
              onClick={() => setIsEditingPhones(false)}
              className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:bg-amber-100 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Save Contacts
            </button>
          </div>
        </div>
      )}

      {/* Two Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category A: Website-Related Issues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Category A
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Website-Related Technical Issues
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              For technical queries, attendance button bugs, login difficulties, OTP errors, or website performance concerns.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="text-xs font-bold text-slate-900">{contacts.developerName}</div>
              <div className="text-[11px] text-blue-800 font-semibold">
                Role: Website Founder / Developer & Technical Support
              </div>
              <div className="text-xs text-slate-600 font-mono flex items-center gap-1.5">
                <span>Mobile:</span>
                <strong className="text-slate-900">{contacts.developerPhone}</strong>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-200/70">
                <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Official Email:</span>
                <a
                  href={`mailto:${contacts.developerEmail}`}
                  className="font-mono text-blue-700 hover:underline font-semibold"
                >
                  {contacts.developerEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Action buttons: Call, WhatsApp & Email */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <a
              href={getTelUri(contacts.developerPhone)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Amrendra</span>
            </a>
            <a
              href={`https://wa.me/${cleanNumber(contacts.developerPhone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`mailto:${contacts.developerEmail}`}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-colors"
              title={`Email ${contacts.developerEmail}`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-700" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Category B: Mess Permission / Attendance Issues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Category B
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Mess Permission / Attendance Issues
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              For mess rebate approval, diet exemption, dining hall entry pass, or attendance adjustments.
            </p>

            <div className="space-y-3">
              {/* Contact Person 1 - Nakul Sharma */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">{contacts.nakulName}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">
                    Mess Convenor · Contact Person 1
                  </div>
                  <div className="text-xs text-slate-700 font-mono mt-0.5">
                    {contacts.nakulPhone}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={getTelUri(contacts.nakulPhone)}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${cleanNumber(contacts.nakulPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    title="WhatsApp Nakul Sharma"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Contact Person 2 - Kanishk Mishra */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">{contacts.kanishkName}</div>
                  <div className="text-[11px] text-blue-700 font-semibold">
                    Mess Co-Convener · Contact Person 2
                  </div>
                  <div className="text-xs text-slate-700 font-mono mt-0.5">
                    {contacts.kanishkPhone}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={getTelUri(contacts.kanishkPhone)}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${cleanNumber(contacts.kanishkPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    title="WhatsApp Kanishk Mishra"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Official permission forms must be countersigned by Hostel 10 Wardens.
          </div>
        </div>

      </div>

      {/* Hostel Office Location, Timings & Official Emails */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-700" />
          Hostel 10 Caretaker & Mess Committee Office
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <MapPin className="w-4 h-4 text-blue-700" />
              <span>Location</span>
            </div>
            <p className="text-slate-600 leading-snug">
              Ground Floor, Wing 10C & 10D Junction Corridor, MANIT Campus, Bhopal, MP – 462003
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>Office Hours</span>
            </div>
            <p className="text-slate-600 leading-snug">
              Morning: 09:00 AM – 12:00 PM<br />
              Evening: 05:00 PM – 07:00 PM (Mon–Sat)
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <Mail className="w-4 h-4 text-blue-700" />
              <span>Official Email</span>
            </div>
            <a
              href={`mailto:${contacts.developerEmail}`}
              className="text-blue-700 hover:underline font-mono font-bold block"
            >
              {contacts.developerEmail}
            </a>
            <p className="text-[11px] text-slate-500 font-mono">
              {contacts.institutionalEmail}
            </p>
            <p className="text-[10px] text-slate-400 pt-0.5">
              Direct technical & committee responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
