import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Moon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  User, 
  Mail, 
  CreditCard, 
  Building2, 
  GraduationCap, 
  ListOrdered, 
  ShieldCheck, 
  Check, 
  X, 
  AlertTriangle, 
  Users, 
  PhoneCall, 
  Radio,
  Sparkles,
  Download,
  Printer
} from 'lucide-react';
import { LanguageSelector } from '../LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import { GooglePaySuccessCheck } from './GooglePaySuccessCheck';
import { formatAcademicYear } from '../../utils/academicYearUtils';
import { formatHostelDisplayName } from '../../utils/hostelUtils';

export function NightAttendanceMonitor({ 
  scanResult, 
  effectiveTime, 
  todayData, 
  onSimulateScan, 
  onVerifyStudent, 
  onDismissScan, 
  isVerifying, 
  onBackToHub 
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('LIVE_SCAN'); // 'LIVE_SCAN' | 'DEFAULTERS'
  const [isVerifyingDefaulterId, setIsVerifyingDefaulterId] = useState(null);
  const [verifiedSuccessStudent, setVerifiedSuccessStudent] = useState(null);

  const student = scanResult?.student;
  const isUnregistered = scanResult?.status === 'UNREGISTERED';
  const hasActiveScan = !!scanResult;
  const alreadyPresent = scanResult?.alreadyMarkedPresent;
  const isVerifiedNow = !!verifiedSuccessStudent || scanResult?.justVerified;

  const defaulters = todayData?.defaulters || [];
  const presentCount = todayData?.stats?.presentCount || 0;
  const totalStudents = todayData?.stats?.totalStudents || 0;
  const pendingCount = todayData?.stats?.pendingCount || defaulters.length;

  const formatUid = (uid) => {
    if (!uid) return '04 A3 B1 7F 2E 81 90';
    const clean = uid.replace(/[^a-zA-Z0-9]/g, '');
    return clean.match(/.{1,2}/g)?.join(' ').toUpperCase() || uid;
  };

  const timeFormatted = effectiveTime 
    ? new Date(effectiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '--:--:--';

  // Handle Verify Confirmation (Mouse click or Enter key)
  const handlePerformVerification = async (studentToVerify) => {
    if (!studentToVerify || isVerifying) return;

    // 1. Immediately display Google Pay Success Animation
    setVerifiedSuccessStudent(studentToVerify);

    // 2. Call backend verification
    try {
      await onVerifyStudent(studentToVerify.id);
    } catch (err) {
      console.error('Verification error:', err);
    }

    // 3. Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setVerifiedSuccessStudent(null);
      onDismissScan();
    }, 3500);
  };

  const handleQuickVerifyDefaulter = async (studentObj) => {
    try {
      setIsVerifyingDefaulterId(studentObj.id);
      await handlePerformVerification(studentObj);
    } finally {
      setIsVerifyingDefaulterId(null);
    }
  };

  // Global ESC key and Enter key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC unconditionally dismisses everything back to idle immediately
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        setVerifiedSuccessStudent(null);
        onDismissScan();
        return;
      }

      // Enter verifies student if waiting for verification
      if ((e.key === 'Enter' || e.key === ' ') && hasActiveScan && student && !isVerifiedNow && !alreadyPresent) {
        const tag = e.target?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          handlePerformVerification(student);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [hasActiveScan, student, isVerifiedNow, alreadyPresent, onDismissScan]);

  // Export Defaulters to CSV
  const handleExportCsv = () => {
    if (!defaulters || defaulters.length === 0) {
      alert('No defaulters to export.');
      return;
    }

    const headers = ['Full Name', 'Room Number', 'Registration Number', 'Branch', 'Year', 'Student Contact', 'Parent Name', 'Parent Contact', 'Email', 'Hostel'];
    const rows = defaulters.map((d) => [
      `"${d.full_name || ''}"`,
      `"${d.room_number || ''}"`,
      `"${d.reg_number || ''}"`,
      `"${d.branch || ''}"`,
      `"${d.year || ''}"`,
      `"${d.contact_number || ''}"`,
      `"${d.parent_name || ''}"`,
      `"${d.parent_contact_number || ''}"`,
      `"${d.email || ''}"`,
      `"${d.hostel_name || 'Shivaji Hostel'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Defaulters_Call_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Defaulters Sheet
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between relative">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToHub}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>

            <div>
              <div className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
                <span>NIGHT ATTENDANCE PORTAL</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  8:30 PM – 9:30 PM & Buffer
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Face Review + Press ENTER to Verify Attendance
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            
            {/* Language Selector */}
            <LanguageSelector />

            {/* Quick Demo Scan Button for Presentation */}
            <button
              onClick={() => onSimulateScan && onSimulateScan('04A3B17F2E8190')}
              className="hidden sm:flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              title="1-Click Demo Tap for Presentation"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Tap Kartik (A-204)</span>
            </button>

            <button
              onClick={() => onSimulateScan && onSimulateScan('0008456123')}
              className="hidden sm:flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              title="1-Click Demo Tap for Presentation"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Tap Priya (G-108)</span>
            </button>

            {/* View Switcher: Live Tap vs Defaulters Calling List */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('LIVE_SCAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'LIVE_SCAN' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Card Scanner
              </button>

              <button
                onClick={() => setActiveTab('DEFAULTERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'DEFAULTERS' 
                    ? 'bg-white text-rose-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Defaulters Call List</span>
                {pendingCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Top Right Role Representation */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ROLE: GUARD</span>
            </div>

            <div className="text-right font-mono font-black text-slate-900 text-base hidden md:block">
              {timeFormatted}
            </div>

          </div>

        </div>
      </header>

      {/* Main View */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center">
        
        {/* TAB 1: LIVE ATTENDANCE CARD SCAN */}
        {activeTab === 'LIVE_SCAN' && (
          <div>
            
            {/* GOOGLE PAY STYLE SUCCESS ANIMATION */}
            {isVerifiedNow && (verifiedSuccessStudent || student) ? (
              <GooglePaySuccessCheck
                student={verifiedSuccessStudent || student}
                timestamp={effectiveTime}
                onClose={() => {
                  setVerifiedSuccessStudent(null);
                  onDismissScan();
                }}
              />
            ) : isUnregistered ? (
              <div className="w-full bg-red-50 border-2 border-red-500 rounded-3xl p-8 shadow-xl text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
                  <XCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-red-900 tracking-tight mb-2">
                  UNREGISTERED RFID CARD
                </h2>
                <p className="text-red-700 text-sm mb-4">
                  Card UID: <span className="font-mono font-bold">{formatUid(scanResult.rfid_tag)}</span> - This card is not in database.
                </p>
                <button
                  onClick={() => {
                    setVerifiedSuccessStudent(null);
                    onDismissScan();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow cursor-pointer"
                >
                  Dismiss (Esc)
                </button>
              </div>
            ) : hasActiveScan && student ? (

              /* ACTIVE STUDENT ATTENDANCE VERIFICATION HERO */
              <div className="w-full bg-white border-2 border-indigo-200 rounded-3xl shadow-xl overflow-hidden animate-in fade-in duration-150">
                
                {/* Top Verification Header */}
                <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-indigo-50/70">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-indigo-900 uppercase tracking-wide">
                      {alreadyPresent 
                        ? 'ALREADY MARKED PRESENT TONIGHT' 
                        : 'FACE REVIEW & VERIFICATION REQUIRED'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    UID: <span className="text-blue-600 font-bold">{formatUid(student.rfid_tag)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: LARGE PHOTO WITH ROOM NUMBER BOLDLY BELOW */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    
                    {/* Big Photo Container */}
                    <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-300 shadow-md flex items-center justify-center p-2">
                      <img
                        src={student.photo_url}
                        alt={student.full_name}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>

                    {/* Room Badge Placed Directly Below Photo */}
                    <div className="w-full max-w-[320px] bg-slate-950 border-2 border-amber-400 rounded-2xl p-3 text-center shadow-lg mt-3">
                      <div className="text-[11px] font-black uppercase tracking-widest text-amber-300">
                        ROOM
                      </div>
                      <div className="text-4xl font-black text-amber-300 tracking-tight font-mono leading-none mt-1">
                        {student.room_number}
                      </div>
                    </div>

                  </div>

                  {/* Right: Details & Verification Action */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                        {student.full_name}
                      </h2>
                      <div className="text-sm font-mono font-bold text-slate-600 mt-1">
                        Reg. No.: <span className="text-indigo-600 font-extrabold">{student.reg_number}</span> • {student.branch} ({formatAcademicYear(student.year || student.academic_year, { includeCode: true })}) • {formatHostelDisplayName(student.hostel_name, student.room_number)} (Room {student.room_number})
                      </div>
                    </div>

                    {/* Verification Instructions Callout */}
                    {!alreadyPresent && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start space-x-3 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-base">
                          👁️
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase text-amber-900">
                            ACTION FOR SECURITY GUARD:
                          </div>
                          <div className="text-xs text-amber-800 font-medium mt-0.5 leading-relaxed">
                            Inspect student's physical face against the displayed high-resolution photo. If verified, press <strong>ENTER</strong> key or click the green button below.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Student Info Table (English fields) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-slate-400 font-medium">Student Phone</div>
                        <div className="font-mono font-bold text-slate-800">{student.contact_number}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Parent / Guardian</div>
                        <div className="font-bold text-slate-800">{student.parent_name || 'Guardian'} ({student.parent_contact_number})</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Email</div>
                        <div className="text-slate-700 truncate">{student.email}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Hostel</div>
                        <div className="font-bold text-slate-800">{student.hostel_name || 'Shivaji Hostel'}</div>
                      </div>
                    </div>

                    {/* BIG VERIFY BUTTON */}
                    <div className="pt-3">
                      {!alreadyPresent ? (
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => handlePerformVerification(student)}
                            disabled={isVerifying}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 px-6 rounded-2xl text-base tracking-wide transition shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <Check className="w-6 h-6 stroke-[3]" />
                            <span>{isVerifying ? 'MARKING ATTENDANCE...' : '✓ VERIFY & MARK PRESENT (PRESS ENTER)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setVerifiedSuccessStudent(null);
                              onDismissScan();
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 px-5 rounded-2xl text-xs transition cursor-pointer"
                          >
                            Dismiss (Esc)
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>Attendance Already Recorded for Tonight</span>
                          </div>
                          <button
                            onClick={() => {
                              setVerifiedSuccessStudent(null);
                              onDismissScan();
                            }}
                            className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                          >
                            Next Student (Esc)
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>

            ) : (

              /* IDLE NIGHT SCREEN WITH 1-CLICK DEMO BUTTONS */
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
                <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 border border-indigo-100 animate-pulse">
                  <Moon className="w-10 h-10" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">
                  NIGHT ATTENDANCE SCANNER READY
                </h3>

                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  Resident taps ID card on reader ➔ Photo appears ➔ Guard presses <strong>[ENTER]</strong> to confirm and mark Present. Or click below to simulate tap:
                </p>

                {/* 1-Click Demo Buttons */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto mb-5 text-left">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-2 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Simulate Evening Card Tap (Presentation Demo):</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => onSimulateScan && onSimulateScan('04A3B17F2E8190')}
                      className="w-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 p-2.5 rounded-xl text-left transition flex items-center justify-between shadow-sm group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">Kartik Pratap Singh</div>
                        <div className="text-[10px] text-slate-500 font-mono">UID: 04A3B17F2E8190 • <span className="text-amber-700 font-bold">Room A-204</span></div>
                      </div>
                      <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-lg">Tap Card</span>
                    </button>

                    <button
                      onClick={() => onSimulateScan && onSimulateScan('0008456123')}
                      className="w-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 p-2.5 rounded-xl text-left transition flex items-center justify-between shadow-sm group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">Priya Patel</div>
                        <div className="text-[10px] text-slate-500 font-mono">UID: 0008456123 • <span className="text-amber-700 font-bold">Room G-108</span></div>
                      </div>
                      <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-lg">Tap Card</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-6 text-xs text-slate-600 font-mono bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                  <span>Verified Present: <strong className="text-emerald-700 text-sm">{presentCount}</strong></span>
                  <span>•</span>
                  <span>Pending / Defaulters: <strong className="text-rose-700 text-sm">{pendingCount}</strong></span>
                </div>
              </div>

            )}
          </div>
        )}

        {/* TAB 2: DEFAULTERS CALL LIST WITH CSV EXPORT & PRINT */}
        {activeTab === 'DEFAULTERS' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
                  <span>DEFAULTER RESIDENTS • CALL LIST</span>
                  <span className="text-xs bg-rose-100 text-rose-700 font-mono px-2 py-0.5 rounded-full font-bold">
                    {defaulters.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Students who missed attendance. Guard can call directly or export the list.
                </p>
              </div>

              {/* Export & Print Action Buttons */}
              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={handleExportCsv}
                  className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  title="Download Defaulters List as CSV / Excel"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  title="Print Call Sheet"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {defaulters.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <div className="text-base font-bold text-slate-800">100% Attendance Completed!</div>
                <div className="text-xs text-slate-500">All registered residents have verified their attendance.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {defaulters.map((studentItem) => (
                  <div
                    key={studentItem.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between transition shadow-sm"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 shrink-0 border border-slate-300 flex items-center justify-center p-0.5 overflow-hidden">
                        <img
                          src={studentItem.photo_url}
                          alt={studentItem.full_name}
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                          style={{ objectFit: 'contain', objectPosition: 'center' }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {studentItem.full_name}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5 text-xs">
                          <span className="font-mono font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            Room {studentItem.room_number}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {studentItem.reg_number}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2 print:hidden">
                      {/* Direct Call Link */}
                      <a
                        href={`tel:${studentItem.contact_number}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-xs transition shadow-sm flex items-center space-x-1"
                        title="Call Student Now"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>

                      {/* Mark Present / Late */}
                      <button
                        onClick={() => handleQuickVerifyDefaulter(studentItem)}
                        disabled={isVerifyingDefaulterId === studentItem.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center space-x-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isVerifyingDefaulterId === studentItem.id ? '...' : 'Verify'}</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Floating Demo Launcher for Instructor Demo */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={() => onSimulateScan && onSimulateScan('04A3B17F2E8190')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center space-x-2 transition active:scale-95 cursor-pointer"
          title="Click to simulate RFID Card Scan instantly"
        >
          <Sparkles className="w-4 h-4" />
          <span>⚡ Tap Kartik (A-204)</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400 font-medium print:hidden">
        HOSTEL GATE ENTRY & ATTENDANCE SYSTEM • Press ENTER on keyboard or Click Verify Button
      </footer>

    </div>
  );
}
