import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Phone, 
  Building, 
  GraduationCap, 
  Mail, 
  Clock, 
  ShieldAlert,
  Check
} from 'lucide-react';
import { formatAcademicYear } from '../../utils/academicYearUtils';
import { formatHostelDisplayName } from '../../utils/hostelUtils';

export function ScanModal({ 
  scanResult, 
  onVerify, 
  onDismiss, 
  isVerifying 
}) {
  const [countdown, setCountdown] = useState(5);

  if (!scanResult) return null;

  const isUnregistered = scanResult.status === 'UNREGISTERED';
  const isDayEntry = scanResult.mode === 'DAY_ENTRY' || scanResult.mode === 'POST_BUFFER' || scanResult.status === 'VERIFIED_DAY_ENTRY';
  const isNightMode = scanResult.mode === 'NIGHT_ATTENDANCE' || scanResult.mode === 'BUFFER_WINDOW';
  const alreadyPresent = scanResult.alreadyMarkedPresent;
  const isVerifiedNow = scanResult.justVerified;
  const student = scanResult.student;

  // Auto-reset countdown for Day Mode
  useEffect(() => {
    if (isDayEntry && !isUnregistered) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [scanResult, isDayEntry, isUnregistered, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* UNREGISTERED CARD MODAL */}
      {isUnregistered ? (
        <div className="bg-[#1a0c0c] border-2 border-red-600/90 rounded-2xl max-w-lg w-full p-8 text-center shadow-2xl shadow-red-950/80 flash-danger">
          <div className="w-20 h-20 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/40 animate-bounce">
            <XCircle className="w-12 h-12" />
          </div>

          <div className="text-xs uppercase tracking-widest font-extrabold text-red-400 mb-1">
            Security Alert
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            UNREGISTERED RFID CARD
          </h2>
          <p className="text-slate-300 text-sm mb-6">
            This card is not linked to any active hostel resident. Access is denied.
          </p>

          <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-3.5 mb-6 text-left">
            <div className="text-xs text-red-300/80 uppercase font-mono font-bold">Scanned Card Identifier</div>
            <div className="text-lg font-mono font-black text-red-200 tracking-wider">
              {scanResult.rfid_tag || 'UNKNOWN_TAG'}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition text-base shadow-lg shadow-red-600/30"
          >
            Dismiss Alert (Esc)
          </button>
        </div>
      ) : (

        /* REGISTERED STUDENT MODAL */
        <div className={`bg-[#0f172a] border-2 ${
          isVerifiedNow || isDayEntry ? 'border-emerald-500/80 flash-success' : 'border-blue-500/70'
        } rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl shadow-slate-950 text-slate-100 relative overflow-hidden`}>

          {/* Top Status Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              {isVerifiedNow || isDayEntry ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : alreadyPresent ? (
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40">
                  <Clock className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                  {isDayEntry ? 'Day Gate Entry Mode' : 'Night Attendance Mode'}
                </div>
                <div className="text-lg font-extrabold text-white">
                  {isVerifiedNow 
                    ? 'Attendance Verified & Logged' 
                    : isDayEntry 
                      ? 'Gate Entry Recorded' 
                      : alreadyPresent 
                        ? 'Already Marked Present Today' 
                        : 'Face Review & Verification Required'}
                </div>
              </div>
            </div>

            {/* Auto-Dismiss Timer for Day Mode */}
            {isDayEntry && (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300">
                <span>Auto-reset in</span>
                <span className="text-emerald-400 text-sm font-black">{countdown}s</span>
              </div>
            )}
          </div>

          {/* Main Content Layout: High-Res Photo & Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Student Photo & Room Badge */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative group w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border-4 border-slate-700 shadow-xl bg-slate-900 flex items-center justify-center p-2">
                <img
                  src={student?.photo_url}
                  alt={student?.full_name}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none"></div>
              </div>

              {/* Dominant Room Number Badge */}
              <div className="mt-4 w-full max-w-[260px] bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-500/60 rounded-2xl p-3 text-center shadow-lg shadow-amber-950/30">
                <div className="text-[11px] font-black uppercase tracking-widest text-amber-300">Room Number</div>
                <div className="text-3xl sm:text-4xl font-black text-amber-100 tracking-tight font-mono">
                  {student?.room_number}
                </div>
              </div>
            </div>

            {/* Right Column: Complete Student Details */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Student Name & Reg Number */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {student?.full_name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950/60 border border-blue-800/80 px-2.5 py-0.5 rounded-md">
                    {student?.reg_number}
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                    RFID: {student?.rfid_tag}
                  </span>
                </div>
              </div>

              {/* Detailed Attributes Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 text-xs">
                <div>
                  <div className="text-slate-400 font-medium flex items-center space-x-1 mb-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span>Branch & Year</span>
                  </div>
                  <div className="font-semibold text-slate-200">
                    {student?.branch} ({formatAcademicYear(student?.year || student?.academic_year, { includeCode: true })})
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium flex items-center space-x-1 mb-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Student Contact</span>
                  </div>
                  <div className="font-semibold text-slate-200 font-mono">
                    {student?.contact_number}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium flex items-center space-x-1 mb-0.5">
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
                    <span>Parent / Emergency Contact</span>
                  </div>
                  <div className="font-bold text-rose-300 font-mono">
                    {student?.parent_contact_number}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium flex items-center space-x-1 mb-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email Address</span>
                  </div>
                  <div className="font-medium text-slate-300 truncate" title={student?.email}>
                    {student?.email}
                  </div>
                </div>
              </div>

              {/* Active Warning / Disciplinary History Alert if any */}
              {scanResult.penaltyStats && scanResult.penaltyStats.active_incidents > 0 && (
                <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3 flex items-start space-x-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-rose-300 uppercase tracking-wide">
                      Active Penalties On Record:
                    </span>
                    <span className="text-rose-200 ml-1">
                      {scanResult.penaltyStats.active_incidents} incident(s) • Fine Due: ₹{scanResult.penaltyStats.total_fine}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="pt-2">
                {isNightMode && !alreadyPresent && !isVerifiedNow ? (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onVerify(student.id)}
                      disabled={isVerifying}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-950/80 flex items-center justify-center space-x-2 text-base tracking-wide transition border border-emerald-400/30 active:scale-[0.98]"
                    >
                      <Check className="w-5 h-5" />
                      <span>{isVerifying ? 'VERIFYING...' : 'VERIFY & MARK PRESENT (ENTER)'}</span>
                    </button>
                    <button
                      onClick={onDismiss}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-5 rounded-2xl transition text-sm border border-slate-700"
                    >
                      Dismiss (Esc)
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onDismiss}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-6 rounded-2xl transition text-sm border border-slate-700 flex items-center justify-center space-x-2"
                  >
                    <span>Close / Next Card (Esc)</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
