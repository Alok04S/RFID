import React, { useEffect } from 'react';
import { Sparkles, Calendar, Clock, ShieldCheck } from 'lucide-react';

export function GooglePaySuccessCheck({ student, timestamp, onClose }) {
  const timeFormatted = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const dateFormatted = new Date().toLocaleDateString([], { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  // Only ESC key or clicking the button dismisses the success screen early
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    // Delay adding key listener by 200ms so the initial Enter press doesn't trigger instant dismissal
    const timer = setTimeout(() => {
      window.addEventListener('keydown', handleEscKey, true);
    }, 200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleEscKey, true);
    };
  }, [onClose]);

  return (
    <div className="w-full bg-white border-2 border-emerald-500 rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-200 relative overflow-hidden">
      
      {/* Decorative subtle background radiant aura */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      {/* Google Pay Style Animated Success Checkmark */}
      <div className="relative flex items-center justify-center mb-6">
        
        {/* Expanding Ring Ripple 1 */}
        <div className="absolute w-28 h-28 rounded-full bg-emerald-100 animate-ping opacity-75"></div>
        {/* Expanding Ring Ripple 2 */}
        <div className="absolute w-32 h-32 rounded-full bg-emerald-50 border-2 border-emerald-200 animate-pulse"></div>

        {/* Main Solid Emerald Circle with SVG Draw Checkmark */}
        <div className="relative w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-600/30 transform transition-transform hover:scale-105">
          <svg
            className="w-14 h-14 text-white"
            viewBox="0 0 52 52"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              className="checkmark-check"
              d="M14 27 L22 35 L38 17"
              style={{
                strokeDasharray: 48,
                strokeDashoffset: 0,
                animation: 'drawCheck 0.45s ease-in-out forwards'
              }}
            />
          </svg>
        </div>
      </div>

      {/* Success Title */}
      <div className="space-y-1 mb-6 relative z-10">
        <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>ATTENDANCE VERIFIED PRESENT</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
          PRESENT CONFIRMED
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Attendance marked successfully for tonight's session.
        </p>
      </div>

      {/* Verified Student Mini Card */}
      {student && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto mb-6 flex items-center justify-between shadow-sm relative z-10 text-left">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="relative w-14 h-14 rounded-2xl bg-slate-900 border-2 border-emerald-500 shadow-sm shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
              <img
                src={student.photo_url}
                alt={student.full_name}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow">
                ✓
              </div>
            </div>

            <div className="min-w-0">
              <div className="font-black text-base text-slate-900 truncate">
                {student.full_name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {student.reg_number} • {student.branch}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 ml-2">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              ROOM
            </div>
            <div className="text-2xl font-black font-mono text-amber-700 leading-none mt-0.5">
              {student.room_number}
            </div>
          </div>
        </div>
      )}

      {/* Timestamp & Security Officer Sign-off */}
      <div className="flex items-center justify-center space-x-4 text-xs font-mono text-slate-500 bg-emerald-50/50 border border-emerald-100 py-2.5 px-4 rounded-xl max-w-sm mx-auto mb-6 relative z-10">
        <span className="flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-emerald-900">{timeFormatted}</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>{dateFormatted}</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Guard 1</span>
        </span>
      </div>

      {/* Next Student Button / Action */}
      <div className="relative z-10">
        <button
          onClick={onClose}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          Next Student (Esc)
        </button>
      </div>

    </div>
  );
}
