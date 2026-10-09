import React from 'react';
import { 
  Sun, 
  Moon, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  LogOut
} from 'lucide-react';
import { LanguageSelector } from '../LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';

export function GuardHub({ 
  user, 
  effectiveTime, 
  currentMode, 
  todayData, 
  onSelectSystem, 
  onLogout 
}) {
  const { t } = useLanguage();
  const now = effectiveTime ? new Date(effectiveTime) : new Date();
  
  const timeFormatted = now.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  });

  const dateFormatted = now.toLocaleDateString([], { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    weekday: 'long' 
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {t.appTitle}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {t.securityGuard}: <span className="font-bold text-slate-700">{user?.name || 'Guard'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <LanguageSelector />

            <div className="text-right hidden md:block">
              <div className="text-base font-black font-mono text-slate-900">{timeFormatted}</div>
              <div className="text-[11px] text-slate-500 font-medium">{dateFormatted}</div>
            </div>

            {/* TOP RIGHT ROLE REPRESENTATION */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ROLE: GUARD</span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200"
              title="Logout from Booth"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            {t.selectMode}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {t.selectModeSubtitle}
          </p>
        </div>

        {/* Two Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. All-Day Gate Entry */}
          <div 
            onClick={() => onSelectSystem('GATE_ENTRY')}
            className="group bg-white hover:bg-blue-50/40 border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition shadow-inner">
                <Sun className="w-8 h-8" />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  PRIMARY WORKSTATION
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  GATE IN ONLY
                </span>
                <span className="text-xs text-slate-400 font-medium">Zero-Touch Tap</span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">
                Gate Entry Monitor
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                Active resident gate scanning. Students tap ID upon entering the hostel. Large photo and room number verification for guards.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.gateBullet1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.gateBullet2}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.gateBullet3}</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-blue-600 group-hover:bg-blue-700 text-white font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2">
              <span>{t.openGateEntry}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* 2. Night Attendance System */}
          <div 
            onClick={() => onSelectSystem('NIGHT_ATTENDANCE')}
            className="group bg-white hover:bg-indigo-50/40 border-2 border-slate-200 hover:border-indigo-500 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition shadow-inner">
                <Moon className="w-8 h-8" />
              </div>

              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {t.nightAttendanceTag}
                </span>
                <span className="text-xs text-slate-400 font-medium">8:30 PM – 9:30 PM & Buffer</span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">
                {t.nightAttendanceTitle}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {t.nightAttendanceDesc}
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.nightBullet1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.nightBullet2}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.nightBullet3}</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-indigo-600 group-hover:bg-indigo-700 text-white font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2">
              <span>{t.openNightAttendance}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-500 font-medium">
        {t.appTitle} • USB RFID Reader Active
      </footer>

    </div>
  );
}
