import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Phone, 
  User, 
  Mail, 
  Building2, 
  GraduationCap, 
  Check, 
  LogOut, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { formatIstTime } from '../../utils/dateUtils';
import { formatHostelDisplayName } from '../../utils/hostelUtils';
import { formatAcademicYear, getAcademicYearCode } from '../../utils/academicYearUtils';

export function GateEntryMonitor({ 
  scanResult, 
  effectiveTime, 
  onSimulateScan, 
  onDismissScan, 
  onLogout,
  onBackToHub 
}) {
  const [timeLeftMs, setTimeLeftMs] = useState(4000);
  const animFrameRef = useRef(null);
  const onDismissScanRef = useRef(onDismissScan);

  // Keep latest onDismissScan without triggering re-renders
  useEffect(() => {
    onDismissScanRef.current = onDismissScan;
  }, [onDismissScan]);

  const student = scanResult?.student;
  const isUnregistered = scanResult?.status === 'UNREGISTERED';
  const hasActiveScan = !!scanResult;
  // Stable scan ID per card tap
  const currentScanId = scanResult ? (scanResult._scanId || scanResult.timestamp || (scanResult.rfid_tag + '_' + (scanResult.student?.id || ''))) : null;

  // Format Card UID with clean spacing (used only in error/unregistered views)
  const formatUid = (uid) => {
    if (!uid) return '00 00 00 00 00';
    const clean = uid.replace(/[^a-zA-Z0-9]/g, '');
    return clean.match(/.{1,2}/g)?.join(' ').toUpperCase() || uid;
  };

  // Real IST time when the gate card was scanned
  const scanTimeSource = scanResult?.timestamp || scanResult?.scanned_at_ist || effectiveTime || new Date();
  const scannedAtTime = formatIstTime(scanTimeSource);

  // Live top-header IST clock
  const timeFormatted = formatIstTime(effectiveTime || new Date());

  // Smooth Continuous 4.0s Real-Time Countdown: Runs strictly once per unique scanId
  useEffect(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (currentScanId && !isUnregistered) {
      const startTime = Date.now();
      const endTime = startTime + 4000;
      setTimeLeftMs(4000);

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setTimeLeftMs(remaining);

        if (remaining <= 0) {
          if (onDismissScanRef.current) {
            onDismissScanRef.current();
          }
        } else {
          animFrameRef.current = requestAnimationFrame(updateTimer);
        }
      };

      animFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      setTimeLeftMs(4000);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [currentScanId, isUnregistered]);

  // Global ESC key listener to dismiss immediately
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (onDismissScanRef.current) {
          onDismissScanRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, []);

  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / 4000) * 100));
  const secondsDisplay = (timeLeftMs / 1000).toFixed(1);

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden select-none">
      
      {/* ====================================================================== */}
      {/* PART 1: TOP HEADER - CLEANED UP, BRANDING FAR-LEFT, LOGOUT FAR-RIGHT   */}
      {/* ====================================================================== */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 shadow-xs shrink-0">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* FAR LEFT: System Branding & Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/sggs_banner.png"
              alt="SGGS IE&T Nanded"
              className="h-8 sm:h-9 max-w-[180px] sm:max-w-[240px] object-contain"
            />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                HOSTEL GATE ENTRY
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                125 KHZ USB MONITOR
              </span>
            </div>
          </div>

          {/* FAR RIGHT: Live Reader Status & Logout Button */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Clock / Reader Indicator */}
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-700">125 kHz USB Reader Active</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-900 font-black">{timeFormatted}</span>
            </div>

            {/* Strictly on Far Right: Sign Out Button */}
            <button
              onClick={onLogout || onBackToHub}
              className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition border border-rose-200 hover:border-rose-300 shadow-xs cursor-pointer active:scale-95"
              title="Sign out from Guard Workstation"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Widescreen Workspace - 100% Screen Utilization, Zero Vertical Scrolling */}
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 overflow-hidden flex flex-col justify-center">
        
        {/* DEACTIVATED OR LOST CARD ALERT */}
        {scanResult?.status === 'CARD_DEACTIVATED' ? (
          <div className="w-full bg-rose-50 border-2 border-rose-500 rounded-3xl p-8 shadow-xl text-center max-w-2xl mx-auto animate-in fade-in">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-rose-200">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-rose-900 tracking-tight mb-2">
              RFID CARD BLOCKED / DEACTIVATED
            </h2>
            <p className="text-rose-700 text-sm mb-2 font-bold">
              {scanResult.message || 'This card has been deactivated or reported lost by Hostel Admin. Access Denied.'}
            </p>
            {scanResult.student && (
              <p className="text-xs text-slate-600 mb-4">
                Assigned Resident: <span className="font-bold text-slate-900">{scanResult.student.full_name}</span> (Room {scanResult.student.room_number})
              </p>
            )}
            <button
              onClick={() => onDismissScanRef.current && onDismissScanRef.current()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow cursor-pointer"
            >
              Dismiss (Esc)
            </button>
          </div>
        ) : isUnregistered ? (
          <div className="w-full bg-red-50 border-2 border-red-500 rounded-3xl p-8 shadow-xl text-center max-w-2xl mx-auto animate-in fade-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-red-900 tracking-tight mb-2">
              UNREGISTERED RFID CARD
            </h2>
            <p className="text-red-700 text-sm mb-4">
              Card UID: <span className="font-mono font-bold">{formatUid(scanResult.rfid_tag)}</span> is not recognized. Access Denied.
            </p>
            <button
              onClick={() => onDismissScanRef.current && onDismissScanRef.current()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow cursor-pointer"
            >
              Dismiss (Esc)
            </button>
          </div>
        ) : hasActiveScan && student ? (

          /* ====================================================================== */
          /* PART 2: VERIFIED STUDENT CARD LAYOUT (POST-TAP VERIFICATION SCREEN)    */
          /* ====================================================================== */
          <div key={currentScanId} className="w-full h-full max-h-[calc(100vh-80px)] flex flex-col bg-white border-2 border-emerald-400 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden animate-in fade-in duration-100">
            
            {/* Top Verification Banner */}
            <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-emerald-600 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow shrink-0">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl font-black uppercase tracking-tight">
                    GATE ENTRY ALLOWED
                  </span>
                  <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-100 border border-emerald-500">
                    GATE IN VERIFIED
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-xs sm:text-sm bg-emerald-700/90 px-3 py-1 rounded-xl border border-emerald-500">
                <span className="text-emerald-200">ENTRY AT: </span>
                <span className="font-bold text-white">{scannedAtTime}</span>
              </div>
            </div>

            {/* Widescreen 2-Column Split: Exactly 50% Photo + 50% Details */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 p-2.5 sm:p-4 overflow-hidden items-stretch">
              
              {/* LEFT SECTION (50% HALF SCREEN): COMPLETE CLEAN STUDENT PHOTOGRAPH + ROOM NUMBER */}
              <div className="flex flex-col justify-between h-full w-full min-h-0 overflow-hidden">
                
                {/* Clean Photo Container: Centered Complete Uncropped Photo on Clean Neutral Surface */}
                <div className="relative w-full flex-1 min-h-[280px] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center p-2 sm:p-3">
                  <img
                    src={student.photo_url}
                    alt={student.full_name}
                    className="max-w-full max-h-full w-auto h-full object-contain rounded-xl sm:rounded-2xl transition-all shadow-xs"
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* High-visibility Verified Face Badge */}
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] sm:text-xs font-black uppercase px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 border border-emerald-400/40 z-10 pointer-events-none">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Verified Resident Face</span>
                  </div>
                </div>

                {/* DIRECTLY BELOW PHOTO: FULL-WIDTH HIGH CONTRAST ROOM NUMBER + STUDENT CONTACT BAR */}
                <div className="w-full flex items-stretch gap-2 sm:gap-3 mt-2 sm:mt-3 shrink-0 h-14 sm:h-16">
                  {/* GIANT ROOM NUMBER BADGE */}
                  <div className="flex-1 bg-amber-400 border-2 border-amber-500 rounded-xl sm:rounded-2xl px-4 py-1 shadow-sm flex items-center justify-between">
                    <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-950/80 leading-none">
                      ROOM NO
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-950 leading-none">
                      {student.room_number}
                    </div>
                  </div>

                  {/* STUDENT MOBILE NUMBER BANNER */}
                  <div className="w-44 sm:w-52 bg-slate-900 text-white rounded-xl sm:rounded-2xl px-3 py-1 flex flex-col justify-center items-center text-center border border-slate-700 shadow-xs shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>STUDENT MOBILE</span>
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-black text-amber-300 mt-0.5 tracking-wide truncate">
                      {student.contact_number || '+91 98765 00000'}
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT SECTION (50% HALF SCREEN): STUDENT-CENTRIC INFORMATION CARDS */}
              <div className="flex flex-col justify-between h-full min-h-0 space-y-2.5 py-1">
                
                {/* 1. Student Header Identity (Full Name + Roll Number) */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Resident Name
                  </div>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                    {student.full_name}
                  </h2>
                  <div className="mt-1.5 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-500">ROLL NO / REG:</span>
                    <span className="text-base sm:text-lg font-mono font-black text-blue-700">{student.reg_number}</span>
                  </div>
                </div>

                {/* 2. High-Contrast Student-Centric Data Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
                  
                  {/* Department / Branch */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left shadow-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Department / Branch</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-800 truncate mt-0.5">
                      {student.branch || 'Engineering & Technology'}
                    </div>
                    <div className="text-[11px] font-bold text-blue-600">
                      {formatAcademicYear(student, { includeCode: true })} Resident
                    </div>
                  </div>

                  {/* Academic Year */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left shadow-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Academic Year</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-800 truncate mt-0.5">
                      {formatAcademicYear(student)}
                    </div>
                    <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">
                        {getAcademicYearCode(student)}
                      </span>
                      <span>Undergraduate Resident</span>
                    </div>
                  </div>

                  {/* Hostel Facility & Room Number */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left shadow-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hostel Facility & Room</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-800 truncate mt-0.5">
                      {formatHostelDisplayName(student.hostel_name, student.room_number)}
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 font-mono">
                      Room {student.room_number}
                    </div>
                  </div>

                  {/* Academic Batch / Year Code */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left shadow-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Class Year Code</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-emerald-700 font-mono mt-0.5">
                      {getAcademicYearCode(student)}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600">
                      {formatAcademicYear(student, { short: true })} • B.Tech
                    </div>
                  </div>

                  {/* Student Mobile Phone (Direct student contact, spans 2 cols) */}
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Student Mobile Number (Direct Resident Line)</span>
                      </div>
                      <div className="text-base sm:text-lg font-mono font-black text-slate-900 mt-0.5">
                        {student.contact_number || '+91 98765 00000'}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        Verified Contact
                      </span>
                    </div>
                  </div>

                </div>

                {/* 3. Live Status Badge Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 font-black text-xs uppercase tracking-wide shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>STATUS: INSIDE HOSTEL (GATE IN VERIFIED)</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs">
                    <span>ALL-DAY CAMPUS ACCESS ALLOWED</span>
                  </span>
                </div>

              </div>

            </div>

            {/* Bottom Progress Bar & Auto-Reset Strip */}
            <div className="px-4 sm:px-6 py-2 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <div className="w-full sm:w-1/2 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>Next student in:</span>
                  <span className="font-black font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {secondsDisplay}s
                  </span>
                </div>

                <button
                  onClick={() => onDismissScanRef.current && onDismissScanRef.current()}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
                >
                  Next Student (Esc)
                </button>
              </div>
            </div>

          </div>

        ) : (

          /* IDLE / WAITING SCREEN - 125 KHZ USB RFID READER READY */
          <div className="w-full h-full max-h-[calc(100vh-80px)] bg-white border-2 border-dashed border-slate-300 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col justify-center items-center text-center shadow-xs overflow-hidden">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-emerald-200 animate-pulse">
              <Radio className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase mb-1">
              READY FOR 125 KHZ USB RFID TAP
            </h3>

            <div className="inline-block bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-3.5 py-1 rounded-full mb-3">
              ⚡ GATE IN ONLY • STUDENTS TAP UPON ENTERING THE HOSTEL
            </div>

            <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto mb-5">
              Plug in the USB 125 kHz RFID reader. When a returning student taps their card, their photo and details will instantly span this monitor for verification.
            </p>

            <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-600 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>125 kHz USB HID Reader Connected • Press Esc anytime to reset</span>
            </div>
          </div>

        )}

      </main>

    </div>
  );
}
