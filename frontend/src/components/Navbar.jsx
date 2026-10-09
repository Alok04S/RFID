import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Volume2, 
  VolumeX, 
  LayoutDashboard, 
  UserCheck, 
  Radio, 
  Settings, 
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { api } from '../services/api';

export function Navbar({ activeView, setActiveView, currentMode, effectiveTime, onTimeChange, onOpenSimulator }) {
  const [isMuted, setIsMuted] = useState(audioService.isMuted());
  const [customTime, setCustomTime] = useState('');
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  const toggleAudio = () => {
    const nextMuted = audioService.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      audioService.playSuccess();
    }
  };

  const formattedTime = effectiveTime 
    ? new Date(effectiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '--:--:--';

  const timePresets = [
    { label: '☀️ Day Entry (2:00 PM)', value: '14:00', desc: 'Standard gate logging & 5s auto-reset' },
    { label: '🌙 Night Attendance (8:45 PM)', value: '20:45', desc: 'Face review & Guard verification required' },
    { label: '⚠️ Buffer Window (9:32 PM)', value: '21:32', desc: '15-min grace window & Brevo emails sent' },
    { label: '🚨 Post-Buffer Cutoff (9:46 PM)', value: '21:46', desc: 'Disciplinary Escalation & Penalties applied' },
    { label: '⏱️ System Real Time', value: 'REALTIME', desc: 'Restore device clock' },
  ];

  const handleSelectPreset = async (val) => {
    try {
      const res = await api.setSystemTime(val);
      if (onTimeChange) onTimeChange(res);
      setShowTimeMenu(false);
    } catch (err) {
      console.error('Failed to change time:', err);
    }
  };

  const handleCustomTimeSubmit = async (e) => {
    e.preventDefault();
    if (!customTime) return;
    try {
      const res = await api.setSystemTime(customTime);
      if (onTimeChange) onTimeChange(res);
      setShowTimeMenu(false);
      setCustomTime('');
    } catch (err) {
      console.error('Failed to set custom time:', err);
    }
  };

  return (
    <header className="bg-[#0e1424] border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">HOSTEL GATE & ATTENDANCE</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  RFID HID v2.0
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Himalaya Residence Hall Security Terminal</div>
            </div>
          </div>

          {/* Center: Active Mode Banner & Time Simulator Widget */}
          <div className="flex items-center space-x-3">
            {/* Mode Badge */}
            <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${currentMode?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-ping opacity-75"></span>
              <span>{currentMode?.label || 'Day Entry Mode'}</span>
            </div>

            {/* Time Simulator Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTimeMenu(!showTimeMenu)}
                className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-inner"
                title="Click to simulate specific time windows"
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{formattedTime}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-sans uppercase">
                  Simulate Time ▾
                </span>
              </button>

              {showTimeMenu && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 bg-[#131b2e] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Fast-Forward Time Simulator</span>
                    <span className="text-[10px] text-slate-400 font-normal">Test any window</span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {timePresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handleSelectPreset(preset.value)}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-slate-200 transition border border-transparent hover:border-slate-700"
                      >
                        <div className="font-bold text-slate-100">{preset.label}</div>
                        <div className="text-[11px] text-slate-400">{preset.desc}</div>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleCustomTimeSubmit} className="pt-2 border-t border-slate-700/60 flex items-center space-x-2">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-xs rounded px-2 py-1.5 text-slate-200 font-mono flex-1 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded font-bold transition"
                    >
                      Set
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Navigation & Tools */}
          <div className="flex items-center space-x-2">
            {/* Simulator Launcher Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-purple-600/20 transition"
              title="Open Card Tap & Automation Simulator"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RFID Test Pad</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg border transition ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title={isMuted ? 'Sound Muted (Click to Unmute)' : 'Sound Active (Click to Mute)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* View Switcher: Guard Booth vs Admin Portal */}
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center space-x-1">
              <button
                onClick={() => setActiveView('GUARD')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  activeView === 'GUARD'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Guard Booth</span>
              </button>
              <button
                onClick={() => setActiveView('ADMIN')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  activeView === 'ADMIN'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
