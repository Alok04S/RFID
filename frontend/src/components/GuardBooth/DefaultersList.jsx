import React from 'react';
import { AlertCircle, Phone, UserCheck, ShieldAlert, Check } from 'lucide-react';

export function DefaultersList({ defaulters, onQuickVerify, isVerifyingId, isBufferActive }) {
  return (
    <div className={`rounded-2xl border ${
      isBufferActive 
        ? 'bg-[#181119] border-amber-500/50 shadow-xl shadow-amber-950/20' 
        : 'bg-[#0f172a] border-slate-800'
    } p-4 sm:p-5`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl ${
            isBufferActive 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' 
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isBufferActive ? 'DEFULTERS / BUFFER WATCHLIST' : 'PENDING ATTENDANCE'}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black font-mono ${
                isBufferActive ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {defaulters.length} Students
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isBufferActive 
                ? 'Buffer period active (9:30–9:45 PM). Immediate physical outreach / phone call required.' 
                : 'Students yet to tap RFID card for tonight.'}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      {defaulters.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-slate-300">100% Attendance Recorded</div>
          <div className="text-xs text-slate-500">All registered residents have verified attendance.</div>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {defaulters.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {/* Photo Preview */}
                <div className="w-10 h-10 rounded-lg bg-slate-950 shrink-0 border border-slate-700 flex items-center justify-center p-0.5 overflow-hidden">
                  <img
                    src={student.photo_url}
                    alt={student.full_name}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-md"
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-100 truncate">
                      {student.full_name}
                    </span>
                    <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {student.room_number}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono mt-0.5">
                    <span>{student.reg_number}</span>
                    <a
                      href={`tel:${student.contact_number}`}
                      className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      title="Call student"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{student.contact_number}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center space-x-2 shrink-0 ml-2">
                <button
                  onClick={() => onQuickVerify(student.id)}
                  disabled={isVerifyingId === student.id}
                  className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1 shadow border border-emerald-500/30"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isVerifyingId === student.id ? '...' : 'Verify'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
