import React, { useState } from 'react';
import {
  CalendarDays,
  FileText,
  Download,
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DaySchedule, TimetableDocument } from '../../types';

interface MessTimetableProps {
  schedule: DaySchedule[];
  documents: TimetableDocument[];
  isAdmin: boolean;
  onUploadDocument?: (doc: TimetableDocument) => void;
}

export const MessTimetable: React.FC<MessTimetableProps> = ({
  schedule,
  documents,
  isAdmin,
  onUploadDocument,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<TimetableDocument | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'scanned'>('grid');

  // File upload state for admin
  const handleAdminFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadDocument) {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const newDoc: TimetableDocument = {
        id: `doc-${Date.now()}`,
        title: `Official Hostel 10 C/D Mess Timetable (${file.name})`,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileType: isPdf ? 'pdf' : 'image',
        uploadedAt: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        uploadedBy: 'Hostel 10 Administration',
        downloadUrl: '#',
      };
      onUploadDocument(newDoc);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const handleDownload = (doc: TimetableDocument) => {
    if (doc.downloadUrl && doc.downloadUrl !== '#') {
      const a = document.createElement('a');
      a.href = doc.downloadUrl;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    // Generate text/blob download for mock representation
    const textContent = `MANIT BHOPAL - HOSTEL 10 C/D MESS SCHEDULE\nDocument: ${doc.title}\nUploaded: ${doc.uploadedAt}\nBy: ${doc.uploadedBy}\n\nWeekly Mess Timetable is officially active for Hostel 10C & 10D residents.`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const filteredSchedule =
    selectedDay === 'all'
      ? schedule
      : schedule.filter((s) => s.day.toLowerCase() === selectedDay.toLowerCase());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Context Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>Hostel 10 C & 10 D Dining Schedule</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Weekly Mess Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete meal schedule configured for Breakfast, Lunch, Snacks, and Dinner.
          </p>
        </div>

        {/* Admin Upload Affordance */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload / Replace Timetable (PDF/Image)</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleAdminFileUpload}
                className="hidden"
              />
            </label>
            {uploadSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Uploaded
              </span>
            )}
          </div>
        )}
      </div>

      {/* Uploaded Timetable Section (Prominently featured per prompt requirement) */}
      <div className="bg-slate-50 rounded-2xl border border-blue-200/80 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
              PDF
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Uploaded Official Mess Documents
              </h2>
              <p className="text-xs text-slate-500">
                Official circulars & timetables uploaded by Hostel 10 Wardens
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-900 rounded-md">
            {documents.length} Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0 border border-red-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.title}>
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="font-mono">{doc.fileSize}</span>
                    <span>·</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                  <div className="text-[11px] text-blue-800 font-medium mt-0.5">
                    Uploaded by: {doc.uploadedBy}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Mode Toggle: Interactive Table vs Scanned Document */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interactive Weekly Menu
          </button>
          <button
            type="button"
            onClick={() => setViewMode('scanned')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'scanned'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Official Mess Menu (Weekly Timetable)</span>
          </button>
        </div>

        {viewMode === 'grid' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedDay('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedDay === 'all'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All 7 Days (Full Grid)
            </button>
            {daysList.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDay.toLowerCase() === day.toLowerCase()
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Special Occasion Dinners Banner if configured */}
      {schedule.some((s) => s.specialOccasion?.isActive) && viewMode === 'grid' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0 border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full">
                  Special Notice
                </span>
                <span className="text-xs font-bold text-amber-100">
                  Host / Warden Approved Special Dinners
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                Special Occasion Dinners Scheduled This Week
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {schedule
              .filter((s) => s.specialOccasion?.isActive)
              .map((s) => (
                <div
                  key={s.day}
                  className="px-3 py-1 rounded-lg bg-white/20 border border-white/25 text-xs text-white font-medium flex items-center gap-1.5"
                >
                  <span className="font-bold text-yellow-200">{s.day}:</span>
                  <span>{s.specialOccasion?.occasionName}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {viewMode === 'scanned' ? (
        /* Scanned Document View */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Mess Menu — Weekly Timetable
              </h3>
              <p className="text-xs text-slate-500">
                Official visual weekly timetable document approved for Hostel 10 C & 10 D (MANIT Bhopal)
              </p>
            </div>
            <a
              href="/assets/aistudio/Hostel_Mess_Weekly_Timetable_7332021d.png"
              download="Hostel_Mess_Weekly_Timetable_MANIT.png"
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official Image</span>
            </a>
          </div>

          <div className="bg-slate-900/5 p-4 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200">
            <img
              src="/assets/aistudio/Hostel_Mess_Weekly_Timetable_7332021d.png"
              alt="Hostel 10 C & 10 D MANIT Bhopal Mess Menu Weekly Timetable"
              className="max-h-[850px] w-auto max-w-full rounded-lg shadow-md border border-slate-300 object-contain"
            />
          </div>
        </div>
      ) : (
        /* Weekly Timetable Table / Cards */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3.5 px-4 w-36 shrink-0">Day</th>
                  <th className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">Breakfast</div>
                    <div className="text-[11px] font-normal text-slate-500 font-mono">
                      07:30 – 09:00 AM (Mon–Fri)
                    </div>
                    <div className="text-[10px] font-normal text-slate-400 font-mono">
                      08:30 – 10:00 AM (Sat–Sun)
                    </div>
                  </th>
                  <th className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">Lunch</div>
                    <div className="text-[11px] font-normal text-slate-500 font-mono">
                      12:30 – 02:00 PM
                    </div>
                  </th>
                  <th className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">Evening Snacks</div>
                    <div className="text-[11px] font-normal text-slate-500 font-mono">
                      05:00 – 06:00 PM
                    </div>
                  </th>
                  <th className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">Dinner</div>
                    <div className="text-[11px] font-normal text-slate-500 font-mono">
                      07:30 – 09:30 PM
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
              {filteredSchedule.map((row) => {
                const hasSpecialOccasion = Boolean(row.specialOccasion?.isActive);
                const dinnerItems =
                  hasSpecialOccasion && row.specialOccasion?.specialDinnerItems && row.specialOccasion.specialDinnerItems.length > 0
                    ? row.specialOccasion.specialDinnerItems
                    : row.dinner;

                return (
                  <tr
                    key={row.day}
                    className={`transition-colors ${
                      hasSpecialOccasion ? 'bg-amber-50/25 hover:bg-amber-50/50' : 'hover:bg-blue-50/40'
                    }`}
                  >
                    <td className={`py-4 px-4 align-top font-bold text-slate-900 ${
                      hasSpecialOccasion ? 'bg-amber-100/30' : 'bg-slate-50/50'
                    }`}>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-extrabold">{row.day}</span>
                        {hasSpecialOccasion && (
                          <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 inline-flex items-center gap-1 w-fit shadow-2xs">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            Special Feast
                          </span>
                        )}
                        {row.specialItem && !hasSpecialOccasion && (
                          <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 inline-block w-fit">
                            {row.specialItem}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Breakfast */}
                    <td className="py-4 px-4 align-top">
                      <ul className="space-y-1 text-slate-700">
                        {row.breakfast.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Lunch */}
                    <td className="py-4 px-4 align-top">
                      <ul className="space-y-1 text-slate-700">
                        {row.lunch.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Snacks */}
                    <td className="py-4 px-4 align-top">
                      <ul className="space-y-1 text-slate-700">
                        {row.snacks.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Dinner */}
                    <td className={`py-4 px-4 align-top ${hasSpecialOccasion ? 'bg-amber-50/50' : ''}`}>
                      {hasSpecialOccasion ? (
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-300 shadow-2xs space-y-2">
                          <div className="flex items-center gap-1 text-[11px] font-black text-amber-900 uppercase">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>{row.specialOccasion?.occasionName || 'Special Dinner'}</span>
                          </div>
                          <ul className="space-y-1 text-slate-900 font-medium">
                            {dinnerItems.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-amber-600 font-bold">★</span>
                                <span className="font-semibold">{item}</span>
                              </li>
                            ))}
                          </ul>
                          {row.specialOccasion?.highlightNote && (
                            <div className="text-[10px] text-amber-800 bg-white/80 p-1.5 rounded border border-amber-200/60 leading-snug">
                              <strong>Note:</strong> {row.specialOccasion.highlightNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <ul className="space-y-1 text-slate-700">
                          {dinnerItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Uploaded by {previewDoc.uploadedBy} on {previewDoc.uploadedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-3">
              {previewDoc.downloadUrl && previewDoc.downloadUrl !== '#' ? (
                <div className="space-y-3">
                  <div className="text-center font-bold text-xs text-blue-900 bg-blue-50 py-2 px-3 rounded-lg border border-blue-200">
                    MAULANA AZAD NATIONAL INSTITUTE OF TECHNOLOGY, BHOPAL
                    <div className="text-[11px] font-normal text-slate-600 mt-0.5">
                      Hostel 10 C & 10 D Mess Management Committee — Official Circular
                    </div>
                  </div>
                  <div className="bg-slate-900/5 p-2 rounded-lg flex items-center justify-center border border-slate-200">
                    <img
                      src={previewDoc.downloadUrl}
                      alt={previewDoc.title}
                      className="max-h-[60vh] w-auto max-w-full rounded-md shadow-sm border border-slate-200 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center font-bold text-sm text-blue-900 border-b border-slate-200 pb-2">
                    MAULANA AZAD NATIONAL INSTITUTE OF TECHNOLOGY, BHOPAL
                    <div className="text-xs font-normal text-slate-600 mt-0.5">
                      Hostel 10 C & 10 D Mess Management Committee
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200 text-xs">
                    <strong>Notification:</strong> This is the official timetable approved by Chief Warden & Mess Secretary for current semester dining at Hostel 10 C & 10 D.
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <p><strong>Total Mess Capacity:</strong> Total 582 Students across Wing C & Wing D (Wing 10C: 291, Wing 10D: 291)</p>
                    <p><strong>Breakfast Timing:</strong> 07:30 AM to 09:00 AM (Mon-Fri) / 08:30 to 10:00 AM (Sat-Sun)</p>
                    <p><strong>Lunch Timing:</strong> 12:30 PM to 02:00 PM</p>
                    <p><strong>Evening Snacks Timing:</strong> 05:00 PM to 06:00 PM</p>
                    <p><strong>Dinner Timing:</strong> 07:30 PM to 09:30 PM</p>
                    <p><strong>Rebate Minimum Notice:</strong> 48 hours via portal</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewDoc)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
