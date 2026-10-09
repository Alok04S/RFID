import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Phone, 
  User, 
  Mail, 
  CreditCard, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  ListOrdered,
  ArrowRight,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

export function HeroCard({ 
  scanResult, 
  defaultStudent,
  currentMode, 
  effectiveTime,
  onVerify, 
  onDismiss, 
  isVerifying 
}) {
  const [countdown, setCountdown] = useState(5);

  const student = scanResult?.student || defaultStudent;
  const isUnregistered = scanResult?.status === 'UNREGISTERED';
  const isDayMode = currentMode?.mode === 'DAY_ENTRY' || currentMode?.mode === 'POST_BUFFER';
  const isNightMode = currentMode?.mode === 'NIGHT_ATTENDANCE' || currentMode?.mode === 'BUFFER_WINDOW';
  const isVerifiedNow = scanResult?.justVerified;
  const alreadyPresent = scanResult?.alreadyMarkedPresent;
  const requiresVerification = isNightMode && !alreadyPresent && !isVerifiedNow && scanResult;

  // Format Card UID with spaces: e.g. 04 A3 B1 7F 2E 81 90
  const formatUid = (uid) => {
    if (!uid) return '04 A3 B1 7F 2E 81 90';
    const clean = uid.replace(/[^a-zA-Z0-9]/g, '');
    return clean.match(/.{1,2}/g)?.join(' ').toUpperCase() || uid;
  };

  const scannedAtTime = effectiveTime 
    ? new Date(effectiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '07:42:18 PM';

  // Auto-dismiss countdown
  useEffect(() => {
    if (scanResult && !requiresVerification && !isUnregistered) {
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
  }, [scanResult, requiresVerification, isUnregistered, onDismiss]);

  if (isUnregistered) {
    return (
      <div className="w-full bg-[#12080a] light:bg-red-50 border-2 border-red-600/80 rounded-3xl p-8 shadow-2xl text-center max-w-4xl mx-auto my-4 animate-in fade-in">
        <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/40">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white light:text-red-900 tracking-tight mb-2">
          UNREGISTERED RFID CARD
        </h2>
        <p className="text-red-300 light:text-red-700 text-sm mb-4">
          Card UID: <span className="font-mono font-bold">{formatUid(scanResult.rfid_tag)}</span> is not registered in the hostel database. Access Denied.
        </p>
        <button
          onClick={onDismiss}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-xl transition text-sm shadow"
        >
          Dismiss (Esc)
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#080f1c] light:bg-white border border-[#14223b] light:border-slate-200 rounded-3xl shadow-2xl overflow-hidden transition-colors">
      
      {/* 1. Top Banner: RFID Card Detected & UID */}
      <div className="px-6 py-3.5 border-b border-[#14223b] light:border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-[#0a1324]/80 light:bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 light:text-emerald-600 flex items-center justify-center border border-emerald-500/40">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-extrabold text-emerald-400 light:text-emerald-700 uppercase tracking-wide">
              RFID CARD DETECTED
            </span>
            <span className="text-xs text-slate-400 light:text-slate-500 font-mono">
              Card UID: <span className="text-blue-400 light:text-blue-600 font-bold">{formatUid(student?.rfid_tag)}</span>
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400 light:text-slate-500 font-mono">
          Scanned At: <span className="text-emerald-400 light:text-emerald-600 font-bold">{scannedAtTime}</span>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Photo & Gold Room Badge */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="relative w-full max-w-[280px] aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 light:bg-slate-100 border-2 border-slate-700/80 light:border-slate-300 shadow-xl flex items-center justify-center p-2">
            <img
              src={student?.photo_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80'}
              alt={student?.full_name || 'Resident Photo'}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
              style={{ objectFit: 'contain', objectPosition: 'center' }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>

          {/* Room Badge Below Photo */}
          <div className="w-full max-w-[280px] mt-2.5 bg-[#0c121e]/90 light:bg-slate-900/90 border-2 border-amber-400/80 rounded-xl p-2 text-center shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              ROOM
            </div>
            <div className="text-3xl font-black text-amber-300 tracking-tight font-mono leading-none mt-0.5">
              {student?.room_number || 'A-204'}
            </div>
          </div>
        </div>

        {/* Right: Resident Information & Activity Sub-panel */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Name & Reg Number */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white light:text-slate-900 tracking-tight uppercase">
              {student?.full_name || 'KARTIK PRATAP SINGH'}
            </h2>
            <div className="text-sm font-mono font-bold text-slate-300 light:text-slate-700 mt-0.5">
              Reg. No.: <span className="text-cyan-400 light:text-cyan-600 font-extrabold">{student?.reg_number || '22IT1234'}</span>
            </div>
          </div>

          {/* Top 4 Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#0b1426] light:bg-slate-50 border border-[#162544] light:border-slate-200 rounded-xl p-2.5 flex items-center space-x-2">
              <ListOrdered className="w-4 h-4 text-slate-400 light:text-slate-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 light:text-slate-500">Branch</div>
                <div className="text-xs font-bold text-slate-200 light:text-slate-800 truncate">{student?.branch || 'Information Technology'}</div>
              </div>
            </div>

            <div className="bg-[#0b1426] light:bg-slate-50 border border-[#162544] light:border-slate-200 rounded-xl p-2.5 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-slate-400 light:text-slate-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 light:text-slate-500">Year</div>
                <div className="text-xs font-bold text-slate-200 light:text-slate-800">{student?.year ? `${student.year}rd Year` : '3rd Year'}</div>
              </div>
            </div>

            <div className="bg-[#0b1426] light:bg-slate-50 border border-[#162544] light:border-slate-200 rounded-xl p-2.5 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400 light:text-slate-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 light:text-slate-500">Hostel</div>
                <div className="text-xs font-bold text-slate-200 light:text-slate-800 truncate">{student?.hostel_name || 'Shivaji Hostel'}</div>
              </div>
            </div>

            <div className="bg-[#0b1426] light:bg-slate-50 border border-[#162544] light:border-slate-200 rounded-xl p-2.5 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 light:text-slate-500">Status</div>
                <div className="text-xs font-bold text-emerald-400 light:text-emerald-600 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{student?.status || 'Active'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table & Sub-panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Left Column (7 cols): Detailed Attributes List */}
            <div className="md:col-span-7 bg-[#0b1426]/60 light:bg-slate-50/80 border border-[#162544] light:border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              
              <div className="flex items-center justify-between py-1 border-b border-[#142038] light:border-slate-200">
                <span className="text-slate-400 light:text-slate-500 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Student Phone</span>
                </span>
                <span className="font-mono font-bold text-slate-200 light:text-slate-800">
                  {student?.contact_number || '+91 98765 43210'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#142038] light:border-slate-200">
                <span className="text-slate-400 light:text-slate-500 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Parent / Guardian</span>
                </span>
                <span className="font-medium text-slate-200 light:text-slate-800">
                  {student?.parent_name || 'Mr. Pratap Singh'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#142038] light:border-slate-200">
                <span className="text-slate-400 light:text-slate-500 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Parent Phone</span>
                </span>
                <span className="font-mono font-bold text-slate-200 light:text-slate-800">
                  {student?.parent_contact_number || '+91 87654 32109'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#142038] light:border-slate-200">
                <span className="text-slate-400 light:text-slate-500 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </span>
                <span className="font-mono text-slate-300 light:text-slate-700 truncate max-w-[180px]" title={student?.email}>
                  {student?.email || 'kartik.singh22@sggs.ac.in'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#142038] light:border-slate-200">
                <span className="text-slate-400 light:text-slate-500 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>RFID Card Type</span>
                </span>
                <span className="font-medium text-slate-200 light:text-slate-800">
                  {student?.card_type || '13.56 MHz (NFC)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 light:text-slate-500 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card UID</span>
                </span>
                <span className="font-mono font-bold text-blue-400 light:text-blue-600">
                  {formatUid(student?.rfid_tag)}
                </span>
              </div>

            </div>

            {/* Right Column (5 cols): LAST ENTRY & TODAY'S LOG sub-card */}
            <div className="md:col-span-5 bg-[#0b1426] light:bg-slate-50 border border-[#162544] light:border-slate-200 rounded-2xl p-4 flex flex-col justify-between text-xs space-y-4">
              
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-400 light:text-blue-600 mb-2">
                  LAST ENTRY
                </div>
                <div className="space-y-1.5 text-slate-300 light:text-slate-700 font-mono text-[11px]">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>20 May 2025</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>06:18:33 PM</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-sans">Guard Booth 1</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#162544] light:border-slate-200">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 light:text-emerald-600 mb-1.5">
                  TODAY'S LOG
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center space-x-2 text-emerald-400 light:text-emerald-700">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>IN <span className="font-bold ml-1">06:18:33 PM</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>OUT <span className="ml-1">--:--:--</span></span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* 3. Bottom Action & Status Strip */}
      <div className="p-4 sm:p-5 border-t border-[#14223b] light:border-slate-200 bg-[#060c18] light:bg-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Status Alert Box */}
        <div className="flex items-center space-x-3 w-full md:w-auto bg-[#0a1426] light:bg-white border border-[#182848] light:border-slate-300 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 light:text-emerald-600 flex items-center justify-center border border-emerald-500/40 shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black uppercase text-emerald-400 light:text-emerald-700 tracking-wide">
              {requiresVerification 
                ? 'FACE VERIFICATION REQUIRED' 
                : isVerifiedNow 
                  ? 'ATTENDANCE VERIFIED' 
                  : 'GATE ENTRY RECORDED'}
            </div>
            <div className="text-[10px] text-slate-400 light:text-slate-500 font-mono">
              Welcome Back! • {scannedAtTime}
            </div>
          </div>
        </div>

        {/* Center: Auto-dismiss countdown (for Day Mode) */}
        {!requiresVerification && (
          <div className="text-center text-xs text-slate-400 light:text-slate-600 font-medium">
            <div>This screen will auto dismiss in</div>
            <div className="text-xl font-black font-mono text-white light:text-slate-900 leading-tight">
              {String(countdown).padStart(2, '0')} <span className="text-[11px] font-sans font-normal text-slate-400">seconds</span>
            </div>
          </div>
        )}

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {requiresVerification ? (
            <button
              onClick={() => onVerify(student?.id)}
              disabled={isVerifying}
              className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-2.5 rounded-xl transition text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{isVerifying ? 'VERIFYING...' : 'VERIFY & MARK PRESENT (Enter)'}</span>
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="flex-1 md:flex-none bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-xs shadow flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>OK / NEXT (Enter)</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="flex-1 md:flex-none bg-[#141b2b] light:bg-slate-200 hover:bg-[#1a243b] light:hover:bg-slate-300 text-slate-300 light:text-slate-700 font-bold px-5 py-2.5 rounded-xl transition text-xs border border-[#202d48] light:border-slate-300 flex items-center justify-center space-x-1.5"
          >
            <X className="w-4 h-4 text-red-400" />
            <span>DISMISS (Esc)</span>
          </button>
        </div>

      </div>

    </div>
  );
}
