import React from 'react';
import { 
  Lock, 
  Radio, 
  Shield, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  ChevronDown 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { audioService } from '../services/audioService';

export function Header({ currentMode, effectiveTime, isMuted, onToggleAudio }) {
  const { isDark, toggleTheme } = useTheme();

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

  const modeTitle = currentMode?.mode === 'NIGHT_ATTENDANCE' 
    ? 'NIGHT MODE' 
    : currentMode?.mode === 'BUFFER_WINDOW' 
      ? 'BUFFER MODE' 
      : 'DAY MODE';

  const modeSub = currentMode?.mode === 'NIGHT_ATTENDANCE' 
    ? 'Attendance Window (8:30–9:30 PM)' 
    : currentMode?.mode === 'BUFFER_WINDOW' 
      ? 'Grace Period (9:30–9:45 PM)' 
      : 'Outside Attendance Window';

  return (
    <header className="w-full bg-[#080e1a] dark:bg-[#070c16] light:bg-white border-b border-[#141f36] light:border-slate-200 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: System Title with Lock Icon */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#121c33] light:bg-slate-100 border border-[#1e2e50] light:border-slate-300 flex items-center justify-center text-slate-300 light:text-slate-700 shadow-sm">
            <Lock className="w-5 h-5 text-slate-300 light:text-slate-700" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white light:text-slate-900 uppercase">
              HOSTEL GATE ENTRY SYSTEM
            </h1>
            <p className="text-[11px] text-slate-400 light:text-slate-500 font-medium">
              RFID Security Dashboard
            </p>
          </div>
        </div>

        {/* Center: Hardware Status & Current Mode */}
        <div className="flex items-center space-x-3">
          
          {/* Hardware Reader Connected Badge */}
          <div className="bg-[#0c1424] light:bg-slate-50 border border-[#192742] light:border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 light:text-emerald-600">
                RFID READER CONNECTED
              </div>
              <div className="text-[10px] text-slate-400 light:text-slate-500">
                Dual-Frequency 125KHz & 13.56MHz
              </div>
            </div>
          </div>

          {/* Mode Badge */}
          <div className="bg-[#0c1424] light:bg-slate-50 border border-[#192742] light:border-slate-200 px-3.5 py-1.5 rounded-xl hidden md:block">
            <div className={`text-[11px] font-extrabold uppercase tracking-wider ${
              currentMode?.mode === 'NIGHT_ATTENDANCE' 
                ? 'text-cyan-400 light:text-cyan-600' 
                : currentMode?.mode === 'BUFFER_WINDOW' 
                  ? 'text-amber-400 light:text-amber-600' 
                  : 'text-emerald-400 light:text-emerald-600'
            }`}>
              {modeTitle}
            </div>
            <div className="text-[10px] text-slate-400 light:text-slate-500">
              {modeSub}
            </div>
          </div>

        </div>

        {/* Right: Clock, Guard Profile & Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Clock */}
          <div className="text-right hidden sm:block">
            <div className="text-base font-black font-mono text-white light:text-slate-900 tracking-tight">
              {timeFormatted}
            </div>
            <div className="text-[10px] text-slate-400 light:text-slate-500 font-medium">
              {dateFormatted}
            </div>
          </div>

          {/* Guard Booth Dropdown */}
          <div className="bg-[#0c1424] light:bg-slate-50 border border-[#192742] light:border-slate-200 px-3 py-1.5 rounded-xl flex items-center space-x-2 text-slate-200 light:text-slate-800">
            <Shield className="w-4 h-4 text-slate-400 light:text-slate-500" />
            <div>
              <div className="text-[11px] font-extrabold text-white light:text-slate-900 leading-tight">Guard Booth 1</div>
              <div className="text-[9px] text-slate-400 light:text-slate-500 leading-tight">Security Guard</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleAudio}
            className="p-2 rounded-xl bg-[#0c1424] light:bg-slate-100 border border-[#192742] light:border-slate-300 text-slate-300 light:text-slate-700 hover:text-white transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#0c1424] light:bg-slate-100 border border-[#192742] light:border-slate-300 text-slate-300 light:text-slate-700 hover:text-white transition"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>

        </div>

      </div>
    </header>
  );
}
