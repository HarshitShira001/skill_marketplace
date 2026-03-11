import React, { useState } from 'react';

const VideoReviewResult = ({ aiRating, aiReview, transcript }) => {
  const [showTranscript, setShowTranscript] = useState(false);

  // Determine badge color based on rating
  let badgeColor = 'bg-gray-100 text-gray-800 border-gray-200';
  if (aiRating >= 9) badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  else if (aiRating >= 7.5) badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
  else if (aiRating >= 6) badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 mt-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">AI Skill Analysis</h3>
          <p className="text-sm text-gray-500 font-medium">Powered by DeepSeek AI</p>
        </div>
        <div className={`ml-auto px-4 py-2 rounded-xl border ${badgeColor} font-black flex items-center gap-2`}>
          <span>*</span>
          <span className="text-lg">{aiRating}/10</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 mb-6">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">AI Feedback</h4>
        <p className="text-gray-700 font-medium leading-relaxed">
          {aiReview || "The AI was unable to generate a text review."}
        </p>
      </div>

      <div>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {showTranscript ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          )}
          {showTranscript ? 'Hide Audio Transcript' : 'View Audio Transcript'}
        </button>
        
        {showTranscript && (
          <div className="mt-4 p-5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-600 leading-relaxed shadow-inner max-h-60 overflow-y-auto">
            {transcript || "No transcript available."}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoReviewResult;
