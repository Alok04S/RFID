import React from 'react';
import { 
  Sun, 
  Moon, 
  Bell, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon 
} from 'lucide-react';

export function BottomDock({ 
  currentMode, 
  activeView, 
  setActiveView, 
  onSelectMode, 
  defaulterCount = 0,
  onOpenSimulator,
  onOpenSettings
}) {
  const isDayActive = currentMode?.mode === 'DAY_ENTRY' && activeView === 'GUARD';
  const isNightActive = currentMode?.mode === 'NIGHT_ATTENDANCE' && activeView === 'GUARD';
  const isBufferActive = currentMode?.mode === 'BUFFER_WINDOW' && activeView === 'GUARD';
  const isDefaultersActive = activeView === 'DEFAULTERS';
  const isSettingsActive = activeView === 'ADMIN';

  return (
    <div className="w-full bg-[#080e1a]/95 dark:bg-[#070c16]/95 light:bg-white/95 backdrop-blur-md border-t border-[#141f36] light:border-slate-200 py-2.5 px-4 sticky bottom-0 z-40 transition-colors">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        
        <div className="flex items-center space-x-2 sm:space-x-3 w-full justify-between sm:justify-start">
          
          {/* 1. DAY MODE */}
          <button
            onClick={() => {
              setActiveView('GUARD');
              onSelectMode('14:00');
            }}
            className={`px-4 py-2 rounded-2xl flex items-center space-x-2.5 transition shrink-0 ${
              isDayActive 
                ? 'bg-[#0f1d38] light:bg-blue-50 border-2 border-cyan-500/80 light:border-blue-500 shadow-md shadow-cyan-950/40 text-white light:text-blue-900' 
                : 'bg-[#0a1222] light:bg-slate-100 hover:bg-[#101b30] light:hover:bg-slate-200 border border-[#162440] light:border-slate-300 text-slate-300 light:text-slate-700'
            }`}
          >
            <Sun className={`w-4 h-4 ${isDayActive ? 'text-cyan-400 light:text-blue-600' : 'text-slate-400'}`} />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wide">DAY MODE</div>
              <div className="text-[9px] text-slate-400 light:text-slate-500">Gate Entry</div>
            </div>
          </button>

          {/* 2. NIGHT MODE */}
          <button
            onClick={() => {
              setActiveView('GUARD');
              onSelectMode('20:45');
            }}
            className={`px-4 py-2 rounded-2xl flex items-center space-x-2.5 transition shrink-0 ${
              isNightActive 
                ? 'bg-[#0f1d38] light:bg-blue-50 border-2 border-cyan-500/80 light:border-blue-500 shadow-md shadow-cyan-950/40 text-white light:text-blue-900' 
                : 'bg-[#0a1222] light:bg-slate-100 hover:bg-[#101b30] light:hover:bg-slate-200 border border-[#162440] light:border-slate-300 text-slate-300 light:text-slate-700'
            }`}
          >
            <Moon className={`w-4 h-4 ${isNightActive ? 'text-cyan-400 light:text-blue-600' : 'text-slate-400'}`} />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wide">NIGHT MODE</div>
              <div className="text-[9px] text-slate-400 light:text-slate-500">8:30 PM - 9:30 PM</div>
            </div>
          </button>

          {/* 3. BUFFER MODE */}
          <button
            onClick={() => {
              setActiveView('GUARD');
              onSelectMode('21:32');
            }}
            className={`px-4 py-2 rounded-2xl flex items-center space-x-2.5 transition shrink-0 ${
              isBufferActive 
                ? 'bg-[#241708] light:bg-amber-50 border-2 border-amber-500/80 light:border-amber-500 shadow-md shadow-amber-950/40 text-white light:text-amber-900' 
                : 'bg-[#0a1222] light:bg-slate-100 hover:bg-[#101b30] light:hover:bg-slate-200 border border-[#162440] light:border-slate-300 text-slate-300 light:text-slate-700'
            }`}
          >
            <Bell className={`w-4 h-4 ${isBufferActive ? 'text-amber-400' : 'text-slate-400'}`} />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wide">BUFFER MODE</div>
              <div className="text-[9px] text-slate-400 light:text-slate-500">9:30 PM - 9:45 PM</div>
            </div>
          </button>

          {/* 4. DEFAULTERS WATCHLIST */}
          <button
            onClick={() => {
              setActiveView(activeView === 'DEFAULTERS' ? 'GUARD' : 'DEFAULTERS');
            }}
            className={`px-4 py-2 rounded-2xl flex items-center space-x-2.5 transition shrink-0 ${
              isDefaultersActive 
                ? 'bg-[#240c12] light:bg-rose-50 border-2 border-rose-500/80 light:border-rose-500 shadow-md shadow-rose-950/40 text-white light:text-rose-900' 
                : 'bg-[#0a1222] light:bg-slate-100 hover:bg-[#101b30] light:hover:bg-slate-200 border border-[#162440] light:border-slate-300 text-slate-300 light:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4 text-rose-400" />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wide flex items-center space-x-1">
                <span>DEFAULTERS</span>
                {defaulterCount > 0 && (
                  <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {defaulterCount}
                  </span>
                )}
              </div>
              <div className="text-[9px] text-slate-400 light:text-slate-500">Live Watchlist</div>
            </div>
          </button>

          {/* 5. SIMULATOR */}
          <button
            onClick={onOpenSimulator}
            className="px-4 py-2 rounded-2xl bg-[#0a1222] light:bg-slate-100 hover:bg-[#101b30] light:hover:bg-slate-200 border border-[#162440] light:border-slate-300 text-slate-300 light:text-slate-700 flex items-center space-x-2.5 transition shrink-0"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wide">SIMULATOR</div>
              <div className="text-[9px] text-slate-400 light:text-slate-500">Test RFID Card</div>
            </div>
          </button>

          {/* 6. SETTINGS / ADMIN */}
          <button
            onClick={() => {
              setActiveView(activeView === 'ADMIN' ? 'GUARD' : 'ADMIN');
            }}
            className={`px-4 py-2 rounded-2xl flex items-center space-x-2.5 transition shrink-0 ${
              isSettingsActive 
                ? 'bg-[#0f1d38] light:bg-blue-50 border-2 border-cyan-500/80 light:border-blue-500 shadow-md text-white light:text-blue-900' 
                : 'bg-[#0a1222] light:bg-slate-100 hover:bg-[#101b30] light:hover:bg-slate-200 border border-[#162440] light:border-slate-300 text-slate-300 light:text-slate-700'
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wide">SETTINGS</div>
              <div className="text-[9px] text-slate-400 light:text-slate-500">System & Penalties</div>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}
