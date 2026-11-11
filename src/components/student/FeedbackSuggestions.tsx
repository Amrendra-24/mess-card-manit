import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  Utensils,
  Sparkles,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
} from 'lucide-react';
import { FeedbackItem, HostelWing, MealType, Student } from '../../types';

interface FeedbackSuggestionsProps {
  currentStudent: Student;
  feedbackList: FeedbackItem[];
  onSubmitFeedback: (feedback: Omit<FeedbackItem, 'id' | 'createdAt' | 'status'>) => void;
}

export const FeedbackSuggestions: React.FC<FeedbackSuggestionsProps> = ({
  currentStudent,
  feedbackList,
  onSubmitFeedback,
}) => {
  const [activeTab, setActiveTab] = useState<'meal' | 'general'>('meal');

  // Meal Feedback Form
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [mealCategory, setMealCategory] = useState<FeedbackItem['category']>('Taste');
  const [mealComment, setMealComment] = useState('');
  const [mealSubmitted, setMealSubmitted] = useState(false);

  // General Feedback Form
  const [generalCategory, setGeneralCategory] = useState<FeedbackItem['category']>('Cleanliness');
  const [generalComment, setGeneralComment] = useState('');
  const [generalSubmitted, setGeneralSubmitted] = useState(false);

  // Filter feedback for this specific student (per security requirement)
  const studentFeedbackHistory = feedbackList.filter(
    (f) => f.studentId === currentStudent.id
  );

  const handleMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealComment.trim()) return;

    onSubmitFeedback({
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      scholarNumber: currentStudent.scholarNumber,
      wing: currentStudent.wing,
      type: 'meal',
      meal: selectedMeal,
      rating,
      category: mealCategory,
      comment: mealComment.trim(),
    });

    setMealSubmitted(true);
    setMealComment('');
    setTimeout(() => setMealSubmitted(false), 3500);
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalComment.trim()) return;

    onSubmitFeedback({
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      scholarNumber: currentStudent.scholarNumber,
      wing: currentStudent.wing,
      type: 'general',
      category: generalCategory,
      comment: generalComment.trim(),
    });

    setGeneralSubmitted(true);
    setGeneralComment('');
    setTimeout(() => setGeneralSubmitted(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Hostel 10 C & 10 D Student Voice</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Feedback & Suggestions Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Share your daily meal experiences and mess concerns directly with the Chief Warden and Mess Committee.
        </p>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mt-6 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('meal')}
            className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'meal'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            A. Meal-Specific Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'general'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            B. General Mess Suggestions
          </button>
        </div>
      </div>

      {/* Tab A: Meal-Specific Feedback */}
      {activeTab === 'meal' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              How was your meal today?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the meal session and rate food quality, taste, quantity, or hygiene.
            </p>
          </div>

          {mealSubmitted && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thank you! Your meal rating and suggestions have been recorded for the Mess Warden.</span>
            </div>
          )}

          <form onSubmit={handleMealSubmit} className="space-y-6">
            {/* Meal Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                1. Select Meal Session
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMeal(m)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      selectedMeal === m
                        ? 'bg-blue-50 text-blue-800 border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'snacks' ? 'Evening Snacks' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                2. Overall Rating (1–5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                </span>
              </div>
            </div>

            {/* Aspect Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                3. Focus Area
              </label>
              <div className="flex flex-wrap gap-2">
                {['Taste', 'Food Quality', 'Quantity', 'Hygiene', 'Service'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMealCategory(cat as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      mealCategory === cat
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Your Feedback / Suggestions
              </label>
              <textarea
                required
                rows={3}
                value={mealComment}
                onChange={(e) => setMealComment(e.target.value)}
                placeholder="How was today's meal? Mention specifics like salt, spice level, temperature of rotis, or cleanliness of counter..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors"
            >
              Submit Meal Feedback
            </button>
          </form>
        </div>
      )}

      {/* Tab B: General Suggestions */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              General Mess & Hostel Concerns
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit feedback on mess management, dining hall cleanliness, water coolers, utensils, or service staff.
            </p>
          </div>

          {generalSubmitted && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thank you! Your suggestion has been forwarded to the Hostel 10 Mess Committee.</span>
            </div>
          )}

          <form onSubmit={handleGeneralSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                1. Select Suggestion Topic
              </label>
              <div className="flex flex-wrap gap-2">
                {['Cleanliness', 'Mess Management', 'Food Quality', 'Service', 'Other'].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setGeneralCategory(topic as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      generalCategory === topic
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Describe Your Concern / Recommendation
              </label>
              <textarea
                required
                rows={4}
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
                placeholder="Explain the suggestion clearly. E.g. Handwash dispenser maintenance, RO filter speed, pest control, queue management during dinner rush..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors"
            >
              Submit General Suggestion
            </button>
          </form>
        </div>
      )}

      {/* Student's Past Submitted Feedback History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Your Feedback History ({studentFeedbackHistory.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Visible only to your account and Chief Warden
          </span>
        </div>

        {studentFeedbackHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            You haven't submitted any feedback yet. Share your experience above to help improve mess quality!
          </div>
        ) : (
          <div className="space-y-3">
            {studentFeedbackHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      {item.type === 'meal' ? `${item.meal} Feedback` : 'General Concern'}
                    </span>
                    {item.rating && (
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium">
                      Category: {item.category}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                      item.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Reviewed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  "{item.comment}"
                </p>

                {item.adminNotes && (
                  <div className="text-[11px] text-blue-900 bg-blue-50 p-2 rounded-md border border-blue-200/60 font-medium">
                    <strong>Admin Note:</strong> {item.adminNotes}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 pt-1">
                  Submitted on {item.createdAt}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
